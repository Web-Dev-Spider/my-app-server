const User = require("../models/User");
const jwt = require("jsonwebtoken");
const PERMISSIONS = require("../config/permissions");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const Agency = require("../models/Agency");

// const register = async (req, res) => {
//   try {
//     const { mobile, password, name, role } = req.body;
//     const hashed = await hashPassword(password);
//     const user = await User.create({ mobile, password: hashed, name, role });
//     return res.status(201).json({ success: true, message: "User created successfully", user });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({ success: false, message: "Internal server error", error: error.message });
//   }
// };

const register = async (req, res, next) => {
  try {
    const { gasAgencyName, sapcode, email, password, company } = req.body;
    console.log(req.body);
    if (!gasAgencyName || !sapcode || !email || !password || !company) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check duplicates
    const existingAgency = await Agency.findOne({
      $or: [{ email }, { sapcode }],
    });
    if (existingAgency) {
      return res.status(409).json({
        message: "Agency with same email or sapcode already exists",
      });
    }
    const newAgency = await Agency.create({ name: gasAgencyName, sapcode, email, password, company });
    console.log("Response received while createing", newAgency);
    if (newAgency) {
      const ALL_PERMISSIONS = Object.values(PERMISSIONS);
      const newUser = await User.create({
        agencyId: newAgency._id,
        role: "ADMIN",
        username: "admin",
        password,
        company,
        permissions: ALL_PERMISSIONS,
        createdBy: null,
      });
      console.log("Response received while createing user", newUser);

      const token = jwt.sign({ id: newUser._id, agencyId: newAgency._id, role: newUser.role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      if (newUser) {
        res.status(201).json({ message: "Agency Added and admin created", newAgency, newUser, token, success: true });
      }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
};
