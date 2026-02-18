const mongoose = require("mongoose");

const productCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true },
        type: {
            type: String,
            enum: ["CYLINDER", "NFR", "PR"],
            required: true
        },
        description: { type: String },
        isActive: { type: Boolean, default: true },
        createdBy: { type: String, default: "SUPER_ADMIN" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("ProductCategory", productCategorySchema);
