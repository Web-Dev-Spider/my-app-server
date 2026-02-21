const mongoose = require("mongoose");

const stockLedgerSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    agencyProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgencyProduct",
      required: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      required: true,
    },
    // Mirrors AgencyProduct.stock shape exactly
    stock: {
      filled: { type: Number, default: 0 },
      empty: { type: Number, default: 0 },
      defective: { type: Number, default: 0 },
      sound: { type: Number, default: 0 },
      defectivePR: { type: Number, default: 0 },
      quantity: { type: Number, default: 0 },
    },
    lastMovementAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// Most critical index — every ledger query hits this
stockLedgerSchema.index({ agencyId: 1, agencyProductId: 1, locationId: 1 }, { unique: true });

// Additional indexes for queries
stockLedgerSchema.index({ agencyId: 1, locationId: 1 });
stockLedgerSchema.index({ agencyId: 1, agencyProductId: 1 });

module.exports = mongoose.model("StockLedger", stockLedgerSchema);
