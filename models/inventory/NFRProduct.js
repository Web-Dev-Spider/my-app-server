const mongoose = require("mongoose");

const nfrProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        productCode: { type: String },
        category: {
            type: String,
            // Dynamic category support
        },
        unit: { type: String, required: true },
        hsnCode: { type: String },
        taxRate: { type: Number },
        currentPurchasePrice: { type: Number, default: 0 },
        currentSalePrice: { type: Number, default: 0 },
        priceEffectiveDate: { type: Date },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("NFRProduct", nfrProductSchema);
