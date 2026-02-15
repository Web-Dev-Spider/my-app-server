const mongoose = require("mongoose");
const CylinderTransaction = require("../models/inventory/CylinderTransaction");
const CylinderProduct = require("../models/inventory/CylinderProduct");
const ItemStockTransaction = require("../models/inventory/ItemStockTransaction");

/**
 * Creates cylinder transactions for a voucher
 * @param {Array} transactionsData - Array of cylinder transactions details
 * @param {Object} voucherDetails - Common voucher details
 * @param {Object} session - Mongoose session
 */
const createCylinderTransactions = async (transactionsData, voucherDetails, session) => {
    const transactions = transactionsData.map(item => ({
        transactionDate: voucherDetails.transactionDate || new Date(),
        cylinderProductId: item.cylinderProductId,
        condition: item.condition,
        quantity: item.quantity,
        fromLocation: item.fromLocation,
        toLocation: item.toLocation,
        agencyId: voucherDetails.agencyId,
        referenceType: voucherDetails.referenceType,
        referenceId: voucherDetails.referenceId,
        voucherNo: voucherDetails.voucherNo,
        remarks: voucherDetails.remarks,
        relatedAgencyId: voucherDetails.relatedAgencyId, // For inter-agency
        createdBy: voucherDetails.createdBy
    }));

    return await CylinderTransaction.insertMany(transactions, { session });
};

/**
 * Creates item stock transactions for a voucher
 * @param {Array} itemsData - Array of item stock details
 * @param {Object} voucherDetails - Common voucher details
 * @param {Object} session - Mongoose session
 */
const createItemStockTransactions = async (itemsData, voucherDetails, session) => {
    const transactions = itemsData.map(item => ({
        transactionDate: voucherDetails.transactionDate || new Date(),
        itemId: item.itemId,
        quantity: item.quantity,
        type: item.type, // 'IN' or 'OUT'
        agencyId: voucherDetails.agencyId,
        referenceType: voucherDetails.referenceType,
        referenceId: voucherDetails.referenceId,
        voucherNo: voucherDetails.voucherNo,
        remarks: voucherDetails.remarks,
        createdBy: voucherDetails.createdBy
    }));

    return await ItemStockTransaction.insertMany(transactions, { session });
};

/**
 * Aggregation to calculate live cylinder stock for an agency
 * @param {String} agencyId 
 */
const getLiveCylinderStock = async (agencyId) => {
    return await CylinderTransaction.aggregate([
        { $match: { agencyId: new mongoose.Types.ObjectId(agencyId) } },
        {
            $group: {
                _id: {
                    cylinderProductId: "$cylinderProductId",
                    condition: "$condition",
                    location: "$toLocation" // We need to track where it IS now. 
                    // Wait, this is transaction based.
                    // A proper ledger sum: if toLocation == AGENCY, +qty. If fromLocation == AGENCY, -qty.
                },
                // We need a more complex grouping.
                // Alternatively, we can project to two docs (credit/debit) and then group.
            }
        }
    ]);
};

// Better approach for stock calculation using a facet or multi-stage aggregation
// Helper to get stock at AGENCY
const getAgencyCylinderStock = async (agencyId) => {
    return await CylinderTransaction.aggregate([
        { $match: { agencyId: new mongoose.Types.ObjectId(agencyId) } },
        {
            $facet: {
                "inflow": [
                    { $match: { toLocation: "AGENCY" } },
                    {
                        $group: {
                            _id: {
                                product: "$cylinderProductId",
                                condition: "$condition"
                            },
                            totalIn: { $sum: "$quantity" }
                        }
                    }
                ],
                "outflow": [
                    { $match: { fromLocation: "AGENCY" } },
                    {
                        $group: {
                            _id: {
                                product: "$cylinderProductId",
                                condition: "$condition"
                            },
                            totalOut: { $sum: "$quantity" }
                        }
                    }
                ]
            }
        },
        // We can process this in JS or further aggregate.
        // Let's assume we return this raw structure for controller to merge.
    ]);
};

// Generic Stock Calculation Logic
// We need stock considering:
// 1. Physically at Agency (Filled, Empty, Defective)
// 2. With Customer (Filled? No, we track 'With Customer' usually as a concept, but mostly we care about deposits. 
//    However, for cylinder reconciliation, 'Customer' is a location. 
//    If we send Filled to Customer, Agency Stock -1, Customer Loc +1.
//    If we receive Empty from Customer, Customer Loc -1, Agency Stock +1.
//    So 'Customer' location represents cylinders currently in the market.
// 3. At Plant (Defective returned, etc. - usually temporary or reconciled)
const calculateStock = async (agencyId) => {
    // We will sum (toLocation == LOC ? qty : 0) - (fromLocation == LOC ? qty : 0)
    return await CylinderTransaction.aggregate([
        { $match: { agencyId: new mongoose.Types.ObjectId(agencyId) } },
        {
            $project: {
                cylinderProductId: 1, // This is now AgencyProduct ID
                condition: 1,
                // Calculate impact on AGENCY location
                agencyChange: {
                    $cond: [
                        { $eq: ["$toLocation", "AGENCY"] },
                        "$quantity",
                        {
                            $cond: [
                                { $eq: ["$fromLocation", "AGENCY"] },
                                { $multiply: ["$quantity", -1] },
                                0
                            ]
                        }
                    ]
                },
                // Impact on CUSTOMER location
                customerChange: {
                    $cond: [
                        { $eq: ["$toLocation", "CUSTOMER"] },
                        "$quantity",
                        {
                            $cond: [
                                { $eq: ["$fromLocation", "CUSTOMER"] },
                                { $multiply: ["$quantity", -1] },
                                0
                            ]
                        }
                    ]
                },
                // Impact on PLANT location (Pending with Plant)
                plantChange: {
                    $cond: [
                        { $eq: ["$toLocation", "PLANT"] }, // Sent to plant
                        "$quantity",
                        {
                            $cond: [
                                { $eq: ["$fromLocation", "PLANT"] },
                                { $multiply: ["$quantity", -1] },
                                0
                            ]
                        }
                    ]
                }
            }
        },
        {
            $group: {
                _id: {
                    product: "$cylinderProductId",
                    condition: "$condition"
                },
                agencyStock: { $sum: "$agencyChange" },
                customerStock: { $sum: "$customerChange" },
                plantPending: { $sum: "$plantChange" }
                // plantPending positive means we sent to plant (it is at plant). 
                // Creating a voucher "Empty Dispatch to Plant" -> Agency to Plant. 
                // Agency Stock decreases, Plant Stock increases.
            }
        },
        {
            $lookup: {
                from: "agencyproducts",
                localField: "_id.product",
                foreignField: "_id",
                as: "agencyProductDetails"
            }
        },
        { $unwind: "$agencyProductDetails" },
        {
            $lookup: {
                from: "globalproducts",
                localField: "agencyProductDetails.globalProductId",
                foreignField: "_id",
                as: "globalProductDetails"
            }
        },
        { $unwind: "$globalProductDetails" },
        {
            $project: {
                productName: { $ifNull: ["$agencyProductDetails.localName", "$globalProductDetails.name"] },
                productCode: "$globalProductDetails.productCode",
                condition: "$_id.condition",
                agencyStock: 1,
                customerStock: 1,
                plantPending: 1
            }
        }
    ]);
};

module.exports = {
    createCylinderTransactions,
    createItemStockTransactions,
    calculateStock
};
