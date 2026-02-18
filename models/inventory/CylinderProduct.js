const mongoose = require("mongoose");

const cylinderProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        productCode: { type: String, required: true },
        variant: {
            type: String,
            enum: ["Filled", "Empty", "Defective"],
            default: "Filled"
        },
        capacityKg: { type: Number, required: true },
        category: {
            type: String,
            enum: ["domestic", "commercial", "ftl"],
            required: true,
        },
        isFiber: { type: Boolean, default: false }, // Equivalent to isComposite
        isPosVariant: { type: Boolean, default: false },
        isRefillVariant: { type: Boolean, default: true },
        hsnCode: { type: String, required: true },
        taxRate: { type: Number, required: true }, // in percentage
        currentPurchasePrice: { type: Number, default: 0 }, // 6 decimal precision for LPG
        currentSalePrice: { type: Number, default: 0 },
        securityDepositPrice: { type: Number, default: 0 }, // For Domestic/Commercial
        priceEffectiveDate: { type: Date },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
        },
        isActive: { type: Boolean, default: true },
        // Opening Stock for this variant
        openingStock: { type: Number, default: 0 },
        currentStock: { type: Number, default: 0 }, // Updated via transactions or stock movements
    },
    { timestamps: true }
);

// Compound index for local uniqueness within agency
// Each combination of agencyId + productCode + variant is unique
cylinderProductSchema.index({ agencyId: 1, productCode: 1, variant: 1 }, { unique: true });

module.exports = mongoose.model("CylinderProduct", cylinderProductSchema);
