const mongoose = require("mongoose");

const globalProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        productCode: { type: String, required: true },
        variant: {
            type: String,
            enum: ["Filled", "Empty", "Defective"],
            default: "Filled"
        },
        productType: {
            type: String,
            enum: ["CYLINDER", "NFR", "PR"],
            required: true
        },
        category: {
            type: String,
            required: true
            // Removed strict enum to allow dynamic categories
        },
        capacityKg: { type: Number }, // Required if productType is CYLINDER
        isFiber: { type: Boolean, default: false },
        isReturnable: { type: Boolean, default: false }, // true for cylinders usually
        hsnCode: { type: String },
        taxRate: { type: Number, required: true },
        createdBy: {
            type: String,
            enum: ["SUPER_ADMIN", "AGENCY"],
            default: "SUPER_ADMIN"
        },
        ownerAgencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency"
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Compound index for uniqueness based on productCode and variant
globalProductSchema.index({ productCode: 1, variant: 1 }, { unique: true });

module.exports = mongoose.model("GlobalProduct", globalProductSchema);
