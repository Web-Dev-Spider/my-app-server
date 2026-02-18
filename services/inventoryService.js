const mongoose = require("mongoose");
const StockTransaction = require("../models/inventory/StockTransaction");
const AgencyProduct = require("../models/inventory/AgencyProduct");

/**
 * Creates stock transactions for a voucher or invoice
 * @param {Array} transactionsData - Array of transaction details (product, variant, qty)
 * @param {Object} commonDetails - Common details (agencyId, user, voucherNo, etc.)
 * @param {Object} session - Mongoose session
 */
const createStockTransactions = async (transactionsData, commonDetails, session) => {
    const transactions = transactionsData.map(item => ({
        agencyId: commonDetails.agencyId,
        transactionDate: commonDetails.transactionDate || new Date(),
        globalProductId: item.globalProductId,
        type: item.type,
        quantity: item.quantity,
        variant: item.variant,
        direction: item.direction,
        rate: item.rate,
        totalAmount: item.totalAmount,
        referenceUser: commonDetails.referenceUser,
        referenceModel: commonDetails.referenceModel,
        voucherNo: commonDetails.voucherNo,
        invoiceId: commonDetails.invoiceId,
        remarks: commonDetails.remarks,
        createdBy: commonDetails.createdBy
    }));

    return await StockTransaction.insertMany(transactions, { session });
};

/**
 * Calculates current stock for a specific product code and detailed conditions
 * @param {String} agencyId 
 */
const calculateLiveStock = async (agencyId) => {
    // This aggregation sums up IN and OUT transactions for every product variant
    return await StockTransaction.aggregate([
        { $match: { agencyId: new mongoose.Types.ObjectId(agencyId) } },
        {
            $group: {
                _id: {
                    globalProductId: "$globalProductId",
                    variant: "$variant"
                },
                totalIn: {
                    $sum: {
                        $cond: [{ $eq: ["$direction", "IN"] }, "$quantity", 0]
                    }
                },
                totalOut: {
                    $sum: {
                        $cond: [{ $eq: ["$direction", "OUT"] }, "$quantity", 0]
                    }
                }
            }
        },
        {
            $project: {
                currentStock: { $subtract: ["$totalIn", "$totalOut"] }
            }
        }
    ]);
};

module.exports = {
    createStockTransactions,
    calculateLiveStock
};
