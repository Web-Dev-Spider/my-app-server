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
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Agency", agencySchema);
