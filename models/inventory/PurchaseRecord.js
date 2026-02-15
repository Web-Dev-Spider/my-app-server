const mongoose = require("mongoose");

const purchaseRecordSchema = new mongoose.Schema(
    {
        invoiceNo: { type: String, required: true },
        invoiceDate: { type: Date, required: true },
        supplierName: { type: String, default: "IOCL Plant" }, // Can be dynamic later
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: true,
        },
        items: [
            {
                cylinderProductId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "CylinderProduct",
                    required: true,
                },
                quantity: { type: Number, required: true },
                unitPrice: { type: Number, required: true }, // Taxable Value per Unit
                taxRate: { type: Number, required: true }, // GST %
                taxAmount: { type: Number, required: true },
                totalAmount: { type: Number, required: true }, // Line Total (Taxable + Tax)
            },
        ],
        subTotal: { type: Number, required: true }, // Total Taxable Value
        taxTotal: { type: Number, required: true }, // Total Tax Amount
        rounding: { type: Number, default: 0 },
        grandTotal: { type: Number, required: true }, // Final Invoice Amount

        referenceType: { // To link with Inventory Transaction
            type: String,
            default: "PLANT_PURCHASE"
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "PARTIAL"],
            default: "PENDING"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound index to ensure unique invoice numbers per agency
purchaseRecordSchema.index({ invoiceNo: 1, agencyId: 1 }, { unique: true });

module.exports = mongoose.model("PurchaseRecord", purchaseRecordSchema);
