const mongoose = require("mongoose");

const agencySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Agency name is required"] },

    email: { type: String, unique: [true, "This email already exists"], required: [true, "Email is required"] },

    sapcode: { type: String, unique: true },
    company: { type: String, enum: ["IOCL", "HPCL", "BPCL"], unique: true },

    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Agency", agencySchema);
