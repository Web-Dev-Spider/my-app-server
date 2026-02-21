const mongoose = require("mongoose");

const transactionLineSchema = new mongoose.Schema(
  {
    agencyProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgencyProduct",
      required: true,
    },
    productLabel: { type: String }, // snapshot at time of transaction
    stockField: {
      type: String,
      enum: ["filled", "empty", "defective", "sound", "defectivePR", "quantity"],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    isOverride: { type: Boolean, default: false },
  },
  { _id: false },
);

const locationStockTransactionSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },
    sourceLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      required: true,
    },
    destinationLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      default: null, // null for CUSTOMER_SALE (stock leaves system)
    },
    transactionType: {
      type: String,
      enum: [
        "PURCHASE",
        "VEHICLE_ISSUE",
        "VEHICLE_RETURN",
        "EMPTY_RETURN",
        "GODOWN_TRANSFER",
        "SHOWROOM_ISSUE",
        "CUSTOMER_SALE",
        "ADJUSTMENT",
      ],
      required: true,
      index: true,
    },
    // Links VEHICLE_RETURN back to its VEHICLE_ISSUE
    parentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LocationStockTransaction",
      default: null,
    },
    // Driver info (for vehicle transactions)
    driverName: { type: String },
    driverPhone: { type: String },
    driverUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    referenceNumber: { type: String, unique: true },
    transactionDate: { type: Date, default: Date.now, index: true },
    tripNumber: { type: Number, default: 1 },
    lines: [transactionLineSchema],

    // Denormalized totals
    totalQuantity: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },

    // Cash settlement (filled on VEHICLE_RETURN)
    cashExpected: { type: Number, default: 0 },
    cashActual: { type: Number, default: null },
    cashShortage: { type: Number, default: 0 },
    cashExcess: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["DRAFT", "CONFIRMED", "CANCELLED"],
      default: "CONFIRMED",
      index: true,
    },

    // Audit trail
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    remarks: { type: String },
  },
  { timestamps: true },
);

locationStockTransactionSchema.index({ agencyId: 1, transactionType: 1, transactionDate: -1 });
locationStockTransactionSchema.index({ sourceLocationId: 1, transactionDate: -1 });
locationStockTransactionSchema.index({ destinationLocationId: 1, transactionDate: -1 });
locationStockTransactionSchema.index({ parentTransactionId: 1 });

// Auto-generate reference number
locationStockTransactionSchema.pre("save", async function (next) {
  if (!this.referenceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model("LocationStockTransaction").countDocuments({ agencyId: this.agencyId });
    const prefix = this.transactionType.slice(0, 3).toUpperCase();
    this.referenceNumber = `${prefix}-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

module.exports = mongoose.model("LocationStockTransaction", locationStockTransactionSchema);
