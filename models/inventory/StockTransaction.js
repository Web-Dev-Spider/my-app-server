const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
    {
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: true
        },
        transactionDate: { type: Date, required: true, default: Date.now },

        // The primary product involved (e.g., 14.2kg Cylinder, Regulator, Stove)
        globalProductId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GlobalProduct",
            required: true
        },

        // Transaction Classification
        type: {
            type: String,
            enum: [
                "OPENING_STOCK",

                // DEPOSIT & CONNECTION TRANSACTIONS
                "NEW_CONNECTION",        // Issue Cylinder + PR (Deposit)
                "ADDITIONAL_CONNECTION", // Issue Cylinder (DBC)
                "TERMINATION",           // Return Cylinder + PR (Refund)
                "SBC_TO_DBC",            // Upgrade logic if handled separately
                "DBC_TO_SBC",            // Downgrade logic

                // CYLINDER TRANSACTIONS (REFILL / FTL)
                "REFILL_SALE",           // Normal Refill (Empty In, Filled Out)
                "FTL_SALE",              // Outright Sale (Filled Out, No Return)
                "FTL_REFILL",            // Refill (Empty In, Filled Out)

                // POS / AGENT TRANSACTIONS
                "FTL_POS_ISSUE",         // Transfer to Agent
                "FTL_POS_RETURN",        // Return from Agent

                // DEFECTIVE / REPAIR
                "DEFECTIVE_RETURN",      // Customer returns defective
                "SEND_TO_PLANT",         // Agency sends to plant
                "RECEIVE_FROM_PLANT",    // Plant returns good/filled

                // PR & NFR TRANSACTIONS
                "PR_SALE",               // Sale of Valuated PR
                "NFR_SALE",              // Sale of Stove/Tube etc.
                "PURCHASE",              // Buying Stock from Supplier
                "ADJUSTMENT"             // Stock Correction
            ],
            required: true
        },

        // Details of the movement
        quantity: { type: Number, required: true }, // Absolute number

        // Which specific stock state was affected?
        variant: {
            type: String,
            enum: [
                "FILLED", "EMPTY", "DEFECTIVE",  // For Cylinders
                "SOUND", "DEFECTIVE_PR",         // For Deposit PR
                "STANDARD"                       // For NFR / Valuated PR / FTL
            ],
            required: true
        },

        // Direction: IN (Add to Agency Stock), OUT (Remove from Agency Stock)
        direction: {
            type: String,
            enum: ["IN", "OUT"],
            required: true
        },

        // Financials
        rate: { type: Number, default: 0 }, // Unit Price / Deposit / Refill Rate at time of transaction
        totalAmount: { type: Number, default: 0 },

        // Context
        referenceUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Customer or Agent
        },
        referenceModel: {
            type: String,
            enum: ["User", "Agency", "Supplier"],
        },

        voucherNo: { type: String }, // TV No, SV No, Cash Memo No
        invoiceId: { type: mongoose.Schema.Types.ObjectId }, // Link to Financial Invoice

        remarks: { type: String },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// Indexes for fast history lookup
stockTransactionSchema.index({ agencyId: 1, transactionDate: -1 });
stockTransactionSchema.index({ agencyId: 1, globalProductId: 1 });
stockTransactionSchema.index({ voucherNo: 1 });

module.exports = mongoose.model("StockTransaction", stockTransactionSchema);
