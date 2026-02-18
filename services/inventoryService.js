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
 * Calculates current live stock from AgencyProduct inventory,
 * enriched with product type & category details from GlobalProduct.
 * @param {String} agencyId 
 */
const calculateLiveStock = async (agencyId) => {
    // Read stock directly from AgencyProduct and populate GlobalProduct details
    const agencyProducts = await AgencyProduct.find({
        agencyId,
        isEnabled: true
    }).populate('globalProductId').lean();

    const stock = [];

    for (const ap of agencyProducts) {
        const gp = ap.globalProductId;
        if (!gp) continue;

        const base = {
            agencyProductId: ap._id,
            globalProductId: gp._id,
            productName: ap.localName || gp.name,
            productCode: gp.productCode,
            itemCode: ap.itemCode,
            productType: gp.productType,      // CYLINDER, PR, NFR
            category: gp.category,             // Domestic, Commercial, NFR, FTL
            valuationType: gp.valuationType,   // DEPOSIT, VALUATED, NFR
            capacityKg: gp.capacityKg,
            isFiber: gp.isFiber,
            isReturnable: gp.isReturnable,
            hsnCode: gp.hsnCode,
            taxRate: gp.taxRate,
            unit: gp.unit,
            purchasePrice: ap.purchasePrice,
            currentSalePrice: ap.currentSalePrice,
            priceEffectiveDate: ap.priceEffectiveDate,
        };

        // Build variant-level rows based on GlobalProduct productType
        if (gp.productType === "CYLINDER") {
            stock.push({ ...base, condition: "FILLED", agencyStock: ap.stock?.filled || 0 });
            stock.push({ ...base, condition: "EMPTY", agencyStock: ap.stock?.empty || 0 });
            stock.push({ ...base, condition: "DEFECTIVE", agencyStock: ap.stock?.defective || 0 });
        } else if (gp.productType === "PR") {
            stock.push({ ...base, condition: "SOUND", agencyStock: ap.stock?.sound || 0 });
            stock.push({ ...base, condition: "DEFECTIVE", agencyStock: ap.stock?.defectivePR || 0 });
        } else {
            // NFR — simple quantity
            stock.push({ ...base, condition: "IN_STOCK", agencyStock: ap.stock?.quantity || 0 });
        }
    }

    // Sort by productType, then product name, then condition
    const typeOrder = { CYLINDER: 0, PR: 1, NFR: 2 };
    stock.sort((a, b) =>
        (typeOrder[a.productType] ?? 99) - (typeOrder[b.productType] ?? 99) ||
        a.productName.localeCompare(b.productName) ||
        a.condition.localeCompare(b.condition)
    );

    return stock;
};

module.exports = {
    createStockTransactions,
    calculateLiveStock
};
