const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String },
  user_id: { type: Number },
  username: { type: String },
  password: { type: String, select: false, required: [true, "Password is required"] },
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
    required: false, // Changed to false, validation handled in pre-validate
  },

  role: {
    type: String,
    enum: ["SUPER-ADMIN", "ADMIN", "MANAGER", "SHOWROOM-STAFF", "DELIVERY-BOY-DRIVER", "DELIVERY-BOY", "MECHANIC", "GODOWN-KEEPER", "TRUCK-DRIVER"],
    required: true,
  },

  permissions: [String],
  isActive: { type: Boolean, default: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
}, { timestamps: true });

// Validate agencyId presence for non-SUPER-ADMIN roles
userSchema.pre("validate", async function () {
  if (this.role !== "SUPER-ADMIN" && !this.agencyId) {
    this.invalidate("agencyId", "Agency id is required for this role");
  }
});

userSchema.pre("save", async function () {
  if (this.role !== "ADMIN" && this.role !== "SUPER-ADMIN" && this.username === "admin") {
    throw new Error("Username 'admin' is reserved");
  }
});

module.exports = mongoose.model("User", userSchema);
