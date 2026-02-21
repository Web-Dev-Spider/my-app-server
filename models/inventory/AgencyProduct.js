const mongoose = require("mongoose");

const agencyProductSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
    },
    globalProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GlobalProduct",
      required: true,
    },
    localName: { type: String }, // Optional renaming
    itemCode: { type: String, required: true },
    // Configuration / Pricing (Current prevailing rates)
    purchasePrice: { type: Number, default: 0 }, // Purchase/Deposit Price
    currentSalePrice: { type: Number, default: 0 }, // Selling Price (if applicable)
    priceEffectiveDate: { type: Date, default: Date.now },

    // LIVE STOCK INVENTORY (Updated by Transactions)
    stock: {
      // CYLINDER (ValuationType: DEPOSIT / FTL)
      filled: { type: Number, default: 0 },
      empty: { type: Number, default: 0 },
      defective: { type: Number, default: 0 },

      // PR (ValuationType: DEPOSIT)
      sound: { type: Number, default: 0 },
      defectivePR: { type: Number, default: 0 },

      // NFR / FTL PR (ValuationType: FTL / NFR) - quantity only
      quantity: { type: Number, default: 0 },
    },

    // OPENING STOCK RECORD (Immutable History of Initial State)
    openingStock: {
      // CYLINDER (Deposit / FTL)
      filled: {
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 }, // Valuation/Deposit per unit
        sellingPrice: { type: Number, default: 0 }, // Current Refill Rate
        effectiveDate: { type: Date },
      },
      empty: {
        quantity: { type: Number, default: 0 },
      },
      defective: {
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 }, // Recoverable amount if any
      },

      // PR (Deposit)
      sound: {
        quantity: { type: Number, default: 0 },
        price: { type: Number, default: 0 }, // Deposit
      },
      defectivePR: {
        quantity: { type: Number, default: 0 },
      },

      // NFR / FTL PR (ValuationType: NFR / FTL)
      simple: {
        quantity: { type: Number, default: 0 },
        purchasePrice: { type: Number, default: 0 },
        sellingPrice: { type: Number, default: 0 },
        effectiveDate: { type: Date },
      },
    },

    isEnabled: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Index for fast lookups. Uniqueness for non-NFR products is enforced at application level
// to allow NFR global templates to be mapped multiple times to the same agency.
agencyProductSchema.index({ agencyId: 1, globalProductId: 1 });

module.exports = mongoose.model("AgencyProduct", agencyProductSchema);
