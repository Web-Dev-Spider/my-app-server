const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: [true, "Agency is required"],
    },

    registrationNumber: {
      type: String,
      required: [true, "Vehicle registration number is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    vehicleType: {
      type: String,
      enum: ["TRUCK", "TEMPO", "AUTO", "VAN", "PICKUP", "OTHER"],
      required: [true, "Vehicle type is required"],
    },

    make: { type: String, trim: true }, // e.g. Tata, Ashok Leyland
    model: { type: String, trim: true }, // e.g. ACE, 407
    yearOfManufacture: { type: Number },

    // ── Compliance Dates ──────────────────────────────────────────────
    fitness: {
      expiryDate: { type: Date },
      certificateNumber: { type: String },
    },
    pollution: {
      expiryDate: { type: Date },
      certificateNumber: { type: String },
    },
    insurance: {
      expiryDate: { type: Date },
      policyNumber: { type: String },
      insurer: { type: String },
    },
    permit: {
      expiryDate: { type: Date },
      permitNumber: { type: String },
      permitType: { type: String }, // e.g. National, State, Local
    },
    roadTax: {
      expiryDate: { type: Date },
      receiptNumber: { type: String },
    },
    tax: {
      expiryDate: { type: Date },
      receiptNumber: { type: String },
    },

    // ── Status ────────────────────────────────────────────────────────
    isActive: { type: Boolean, default: true },

    remarks: { type: String },

    // ── Stock Location ─────────────────────────────────────────────────
    stockLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLocation",
      default: null,
    },
  },
  { timestamps: true },
);

vehicleSchema.index({ agencyId: 1 });
vehicleSchema.index({ registrationNumber: 1 }, { unique: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
