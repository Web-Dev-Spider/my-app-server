const PurchaseRecord = require("../models/inventory/PurchaseRecord");
const mongoose = require("mongoose");
const inventoryService = require("../services/inventoryService");
const AgencyProduct = require("../models/inventory/AgencyProduct");

// 1. Plant Purchase (Filled Cylinders IN)
const createPlantPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucherNo, date, supplier, items, subTotal, taxTotal, rounding, grandTotal, createdBy } = req.body;

        // 1. Create Purchase Record (Financial)
        const purchase = new PurchaseRecord({
            invoiceNo: voucherNo,
            invoiceDate: date,
            supplierName: supplier || "IOCL Plant",
            agencyId: req.user.agencyId,
            items: items.map(item => ({
                cylinderProductId: item.cylinderProductId, // This is actually globalProductId in UI payload usually, or AgencyProduct ID
                // Ideally purchase should link to GlobalProduct or AgencyProduct. let's assume AgencyProduct ID for now.
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                taxRate: item.taxRate,
                taxAmount: item.taxAmount,
                totalAmount: item.totalAmount
            })),
            subTotal,
            taxTotal,
            rounding,
            grandTotal,
            createdBy: createdBy || req.user._id
        });

        await purchase.save({ session });

        // 2. Create Stock Transactions (Physical Stock IN)
        const commonDetails = {
            agencyId: req.user.agencyId,
            transactionDate: date,
            voucherNo,
            referenceModel: "Supplier", // Supplier Purchase
            // referenceUser: supplierId if we had one
            remarks: `Plant Purchase Invoice: ${voucherNo}`,
            createdBy: createdBy || req.user._id
        };

        const transactionsData = items.map(item => ({
            globalProductId: item.globalProductId, // Ensure FE sends this
            type: "PURCHASE",
            quantity: item.quantity,
            variant: "FILLED", // Plant sends filled cylinders
            direction: "IN",
            rate: item.unitPrice,
            totalAmount: item.totalAmount
        }));

        await inventoryService.createStockTransactions(transactionsData, commonDetails, session);

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Plant Purchase recorded successfully", purchaseId: purchase._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Plant Purchase Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Dispatch Empty to Plant (Empty Cylinders OUT)
const dispatchEmptyToPlant = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucherNo, date, items, createdBy } = req.body;

        const commonDetails = {
            agencyId: req.user.agencyId,
            transactionDate: date,
            voucherNo,
            referenceModel: "Agency", // Internal Transfer to Plant
            remarks: "Empty Dispatch to Plant",
            createdBy: createdBy || req.user._id
        };

        const transactionsData = items.map(item => ({
            globalProductId: item.globalProductId,
            type: "SEND_TO_PLANT",
            quantity: item.quantity,
            variant: "EMPTY",
            direction: "OUT",
            rate: 0, // usually no financial value on dispatch slip
            totalAmount: 0
        }));

        await inventoryService.createStockTransactions(transactionsData, commonDetails, session);

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Empty Dispatch created successfully" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Process Refill Delivery (Filled OUT, Empty IN)
const processRefillDelivery = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucherNo, date, items, createdBy, customerId } = req.body;

        const commonDetails = {
            agencyId: req.user.agencyId,
            transactionDate: date,
            voucherNo,
            referenceModel: "User",
            referenceUser: customerId,
            remarks: "Refill Delivery",
            createdBy: createdBy || req.user._id
        };

        const transactionsData = [];

        items.forEach(item => {
            // 1. FILLED OUT (Stock -1)
            transactionsData.push({
                globalProductId: item.globalProductId,
                type: "REFILL_SALE",
                quantity: item.quantity,
                variant: "FILLED",
                direction: "OUT",
                rate: item.rate, // selling price
                totalAmount: item.totalAmount
            });

            // 2. EMPTY IN (Stock +1) - If applicable (check business logic, usually 1:1)
            if (item.returnEmpty) { // Assume FE flag or default true for refills
                transactionsData.push({
                    globalProductId: item.globalProductId,
                    type: "REFILL_SALE", // Context is same transaction
                    quantity: item.quantity,
                    variant: "EMPTY",
                    direction: "IN",
                    rate: 0, // Deposit value usually not exchanged here physically
                    totalAmount: 0
                });
            }
        });

        await inventoryService.createStockTransactions(transactionsData, commonDetails, session);

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Refill Delivery processed successfully" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Get Live Stock
const getLiveStock = async (req, res) => {
    try {
        const stock = await inventoryService.calculateLiveStock(req.user.agencyId);
        res.status(200).json({ success: true, stock });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Get Cylinder Products (Helper for dropdowns)
const getCylinderProducts = async (req, res) => {
    try {
        // ... (Keep existing logic or update to return new structure)
        // Reusing existing logic for now but ensuring field mapping
        const agencyProducts = await AgencyProduct.find({
            agencyId: req.user.agencyId,
            isActive: true
        }).populate('globalProductId');

        const products = agencyProducts.map(ap => {
            const global = ap.globalProductId;
            return {
                _id: ap._id, // AgencyProduct ID
                globalProductId: global._id, // Needed for Transactions
                name: ap.localName || global.name,
                productCode: global.productCode,
                capacityKg: global.capacityKg,
                currentPurchasePrice: ap.currentPurchasePrice,
                currentSalePrice: ap.currentSalePrice,
                type: 'cylinder' // simplistic type for FE
            };
        });
        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createPlantPurchase,
    dispatchEmptyToPlant,
    getLiveStock,
    processRefillDelivery,
    getCylinderProducts
};
