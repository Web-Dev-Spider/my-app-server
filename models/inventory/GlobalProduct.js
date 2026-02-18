const mongoose = require("mongoose");

const globalProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },

        productCode: { type: String, required: true },

        category: {
            type: String,
            enum: ["CYLINDER", "PR", "NFR"],
            required: true,
        }, valuationType:
        {
            type: String,
            enum: ["DEPOSIT", "VALUATED", "NFR"],
            required: true,
        },
        capacityKg: { type: Number }, // Required if productType is CYLINDER
        isFiber: { type: Boolean, default: false },
        isReturnable: { type: Boolean, default: false }, // true for cylinders usually
        hsnCode: { type: String, required: true },
        taxRate: { type: Number, required: true },
        unit:
        {
            type: String,
            default: "NOS"
        },
        createdBy: {
            type: String,
            enum: ["SUPER_ADMIN", "AGENCY", "ADMIN"],
            default: "SUPER_ADMIN"
        },
        ownerAgencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency"
        },
        // openingStock removed from here as it is Agency specific and detailed
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Compound index for uniqueness based on productCode and variant (for cylinders)
// Sparse index: only applies to documents where variant field exists
globalProductSchema.index({ productCode: 1, variant: 1 }, { unique: true, sparse: true });

// For non-cylinder products (where variant is undefined), ensure productCode is unique
// This will be enforced at application level for NFR/PR or via partial index

module.exports = mongoose.model("GlobalProduct", globalProductSchema);
