const mongoose = require("mongoose");

const prProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        productCode: { type: String },
        category: {
            type: String,
            // Categories: Domestic, FTL PR, FTL POS Resell PR
        },
        unit: { type: String, default: 'NOS' },
        hsnCode: { type: String },
        taxRate: { type: Number, default: 18 },
        currentPurchasePrice: { type: Number, default: 0 },
        currentSalePrice: { type: Number, default: 0 }, // Domestic might be 0
        securityDepositPrice: { type: Number, default: 0 }, // For Domestic PR
        priceEffectiveDate: { type: Date },
        isReturnable: { type: Boolean, default: false }, // For cylinder-like deposit tracking?
        // Domestic PR requires tracking like Cylinders (Sound/Defective) -> 
        // We might need "condition" in transaction, but local product definition is same.
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PRProduct", prProductSchema);
