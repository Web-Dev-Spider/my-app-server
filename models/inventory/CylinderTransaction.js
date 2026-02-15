const mongoose = require("mongoose");

const cylinderTransactionSchema = new mongoose.Schema(
    {
        transactionDate: { type: Date, required: true },
        cylinderProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CylinderProduct",
            required: true,
        },
        condition: {
            type: String,
            enum: ["FILLED", "EMPTY", "DEFECTIVE"],
            required: true,
        },
        quantity: { type: Number, required: true },
        fromLocation: {
            type: String,
            enum: ["PLANT", "AGENCY", "CUSTOMER", "OTHER_AGENCY", "IN_TRANSIT"],
            required: true,
        },
        toLocation: {
            type: String,
            enum: ["PLANT", "AGENCY", "CUSTOMER", "OTHER_AGENCY", "IN_TRANSIT"],
            required: true,
        },
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: true,
        },
        referenceType: {
            type: String,
            enum: ["VOUCHER", "INVOICE", "DAC_NOTE"], // DAC_NOTE = Defective Acceptance
            required: true,
        },
        referenceId: { type: mongoose.Schema.Types.ObjectId }, // E.g., invoiceId
        voucherNo: { type: String, required: true },
        remarks: { type: String },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        relatedAgencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" }, // For inter-agency transfers
    },
    { timestamps: true }
);

module.exports = mongoose.model("CylinderTransaction", cylinderTransactionSchema);
