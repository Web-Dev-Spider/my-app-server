const mongoose = require("mongoose");

const stockLocationSchema = new mongoose.Schema(
  {
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agency",
      required: true,
      index: true,
    },

    locationType: {
      type: String,
      enum: ["GODOWN", "VEHICLE", "SHOWROOM", "SUPPLIER"],
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    code: {
      type: String,
      trim: true,
    },

    // Only for VEHICLE type
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // Only for SUPPLIER type
    supplierDetails: {
      contactName: { type: String },
      phone: { type: String },
      address: { type: String },
      gstNumber: { type: String },
    },

    // For GODOWN / SHOWROOM
    address: { type: String },

    contact: { type: String },

    isActive: {
      type: Boolean,
      default: true,
    },

    notes: { type: String },
  },
  { timestamps: true },
);

// Compound unique index: agencyId + name
stockLocationSchema.index({ agencyId: 1, name: 1 }, { unique: true });

// Index for filtering by agency and type
stockLocationSchema.index({ agencyId: 1, locationType: 1 });

module.exports = mongoose.model("StockLocation", stockLocationSchema);
