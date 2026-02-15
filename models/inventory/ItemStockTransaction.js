const mongoose = require("mongoose");

const itemStockTransactionSchema = new mongoose.Schema(
    {
        transactionDate: { type: Date, required: true },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "NFRProduct",
            required: true,
        },
        quantity: { type: Number, required: true },
        type: { type: String, enum: ["IN", "OUT"], required: true },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: true,
        },
        referenceType: {
            type: String,
            enum: ["VOUCHER", "INVOICE", "PURCHASE_RECEIPT"],
            required: true,
        },
        referenceId: { type: mongoose.Schema.Types.ObjectId },
        voucherNo: { type: String, required: true },
        remarks: { type: String },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ItemStockTransaction", itemStockTransactionSchema);
