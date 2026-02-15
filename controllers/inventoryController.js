const PurchaseRecord = require("../models/inventory/PurchaseRecord");
const mongoose = require("mongoose");
const inventoryService = require("../services/inventoryService");

const createPlantPurchase = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucherNo, date, supplier, items, subTotal, taxTotal, rounding, grandTotal, createdBy } = req.body;
        // Items here include: { cylinderProductId, quantity, unitPrice, taxRate, taxAmount, totalAmount }

        // 1. Create Purchase Record (Financial)
        const purchase = new PurchaseRecord({
            invoiceNo: voucherNo,
            invoiceDate: date,
            supplierName: supplier || "IOCL Plant",
            agencyId: req.user.agencyId,
            items: items.map(item => ({
                cylinderProductId: item.cylinderProductId,
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
            createdBy: createdBy || req.user._id // Ensure this fallback works
        });

        await purchase.save({ session });

        // 2. Create Inventory Transactions (Physical Stock)
        const voucherDetails = {
            voucherNo,
            transactionDate: date,
            createdUser: createdBy || req.user._id,
            agencyId: req.user.agencyId,
            referenceType: "PLANT_PURCHASE",
            referenceId: purchase._id, // Link to the Purchase Record
            remarks: `Plant Purchase Invoice: ${voucherNo}`
        };

        const transactionsData = items.map(item => ({
            cylinderProductId: item.cylinderProductId,
            quantity: item.quantity,
            condition: "FILLED",
            fromLocation: "PLANT", // Or "SUPPLIER"
            toLocation: "AGENCY"
        }));

        await inventoryService.createCylinderTransactions(transactionsData, voucherDetails, session);

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Plant Purchase & Receipt recorded successfully", purchaseId: purchase._id });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Plant Purchase Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const dispatchEmptyToPlant = async (req, res) => {
    try {
        const session = await mongoose.startSession();
        const { voucherNo, date, items, createdBy } = req.body;
        const voucherDetails = {
            voucherNo,
            transactionDate: date,
            createdUser: createdBy,
            agencyId: req.user.agencyId,
            referenceType: "VOUCHER",
            remarks: "Empty Dispatch to Plant"
        };
        const transactionsData = items.map(item => ({
            ...item,
            condition: "EMPTY",
            fromLocation: "AGENCY",
            toLocation: "PLANT"
        }));

        await inventoryService.createCylinderTransactions(transactionsData, voucherDetails, session);
        session.endSession();
        res.status(201).json({ success: true, message: "Empty Dispatch created successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ... (previous code)

const processRefillDelivery = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { voucherNo, date, items, createdBy, customerId } = req.body;
        // items: [{ productCategoryId, quantity }] 
        // We need specific CylinderProduct IDs.

        const voucherDetails = {
            voucherNo,
            transactionDate: date,
            createdUser: createdBy, // req.user.id preferred
            agencyId: req.user.agencyId,
            referenceType: "REFILL_DELIVERY",
            referenceId: customerId, // or Invoice ID
            remarks: "Refill Delivery"
        };

        const transactionsData = [];

        items.forEach(item => {
            // 1. FILLED: AGENCY -> CUSTOMER
            transactionsData.push({
                cylinderProductId: item.cylinderProductId,
                condition: "FILLED",
                quantity: item.quantity,
                fromLocation: "AGENCY",
                toLocation: "CUSTOMER"
            });

            // 2. EMPTY: CUSTOMER -> AGENCY
            transactionsData.push({
                cylinderProductId: item.cylinderProductId,
                condition: "EMPTY",
                quantity: item.quantity,
                fromLocation: "CUSTOMER",
                toLocation: "AGENCY"
            });
        });

        await inventoryService.createCylinderTransactions(transactionsData, voucherDetails, session);

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Refill Delivery processed successfully" });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};

const getLiveStock = async (req, res) => {
    // ... (rest of code)
    try {
        const stock = await inventoryService.calculateStock(req.user.agencyId);
        res.status(200).json({ success: true, stock });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const AgencyProduct = require("../models/inventory/AgencyProduct");

const getCylinderProducts = async (req, res) => {
    try {
        const agencyProducts = await AgencyProduct.find({
            agencyId: req.user.agencyId,
            isActive: true
        }).populate('globalProductId');

        const products = agencyProducts.map(ap => {
            const global = ap.globalProductId;
            return {
                _id: ap._id, // This is now AgencyProduct ID
                ...global.toObject(), // name, productCode, category, etc.
                _id: ap._id, // Ensure ID is AgencyProduct ID
                globalProductId: global._id,
                currentPurchasePrice: ap.currentPurchasePrice,
                currentSalePrice: ap.currentSalePrice,
                priceEffectiveDate: ap.priceEffectiveDate,
                localName: ap.localName,
                // Override name if localName exists
                name: ap.localName || global.name,
                type: global.productType === 'CYLINDER' ? 'cylinder' : 'nfr' // Map back to frontend expected type
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
