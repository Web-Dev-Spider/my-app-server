const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, unique: true },
  mobile: { type: Number },
  user_id: { type: Number },
  username: { type: String },
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

userSchema.pre("save", async function () {
  if (this.role !== "ADMIN" && this.username === "admin") {
    throw new Error("Username 'admin' is reserved");
  }
});

module.exports = mongoose.model("User", userSchema);
