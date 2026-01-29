const mongoose = require("mongoose");

const agencyProfileSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agency",
  },
  address1: {
    type: String,
    required: [true, "Address is required"],
  },
  address2: {
    type: String,
    required: [true, "Address is required"],
  },
  address3: {
    type: String,
    required: [true, "Address is required"],
  },
  place: {
    type: String,
    required: [true, "Address is required"],
  },
  district: {
    type: String,
    required: [true, "Address is required"],
  },
  state: {
    type: String,
    required: [true, "Address is required"],
  },
  pincode: {
    type: Number,
    required: [true, "Address is required"],
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Profile",
  },
});

module.exports = mongoose.model("AgencyProfile", agencyProfileSchema);
