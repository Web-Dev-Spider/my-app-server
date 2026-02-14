const mongoose = require("mongoose");

const agencySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Agency name is required"] },

    email: { type: String, unique: [true, "This email already exists"], required: [true, "Email is required"] },

    sapcode: { type: String, unique: true },
    company: { type: String, enum: ["IOCL", "HPCL", "BPCL"] },

    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
    address: {
      buildingNo: { type: String },
      place: { type: String },
      landmark: { type: String },
      street: { type: String },
      city: { type: String },
      district: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    contacts: {
      type: [
        {
          type: { type: String, enum: ["Mobile", "Landline"], required: true },
          number: { type: String, required: true },
        },
      ],
      validate: [
        {
          validator: function (val) {
            return val.length <= 3;
          },
          message: "Maximum 3 contact numbers allowed",
        },
      ],
    },
    contactNumber: { type: mongoose.Schema.Types.Mixed }, // Legacy support
    gstNumber: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Agency", agencySchema);
