const mongoose = require("mongoose");

const agencyProductSchema = new mongoose.Schema(
    {
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: true
        },
        globalProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GlobalProduct",
            required: true
        },
        localName: { type: String }, // Optional, agency can rename locally
        currentPurchasePrice: { type: Number, default: 0 },
        currentSalePrice: { type: Number, default: 0 },
        priceEffectiveDate: { type: Date },
        openingStockConfig: { type: String }, // Placeholder for future use
        isEnabled: { type: Boolean, default: true },
        // Opening Stock (One-time entry)
        openingStockFilled: { type: Number, default: 0 },
        openingStockEmpty: { type: Number, default: 0 },
        openingStockDefective: { type: Number, default: 0 },
        // ... (other agency specific settings can go here)
    },
    { timestamps: true }
);

// Ensure unique product per agency
agencyProductSchema.index({ agencyId: 1, globalProductId: 1 }, { unique: true });

module.exports = mongoose.model("AgencyProduct", agencyProductSchema);
