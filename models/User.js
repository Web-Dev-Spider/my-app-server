const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  mobile: { type: Number, required: true },
  password: String,
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency", //required:true,
    required: [true, "Agency id is required"],
  },

  role: {
    type: String,
    enum: ["ADMIN", "MANAGER", "SHOWROO-STAFF", "DELIVERY-BOY-DRIVER", "DELIVERY-BOY", "MECHANIC", "GODOWN"],
    required: true,
  },

  permissions: [String],
  isActive: { type: Boolean, default: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
