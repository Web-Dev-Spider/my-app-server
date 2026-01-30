const User = require("../models/User");
const jwt = require("jsonwebtoken");
const PERMISSIONS = require("../config/permissions");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
// const hashPassword = require("../utils/hashPassword");
const Agency = require("../models/Agency");
const { generateJwtToken } = require("../utils/jwt"); // co
const { NODE_ENV } = require("../config/envConfig");

const EXPIRES_IN = process.env.EXPIRES_IN;

//Register Agency if no sapcode or email present in db, other wise create user
const register = async (req, res, next) => {
  try {
    const { gasAgencyName, sapcode, email, password, company } = req.body;
    // console.log(req.body);
    if (!gasAgencyName || !sapcode || !email || !password || !company) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2️⃣ Check duplicates
    const existingAgency = await Agency.findOne({
      $or: [{ email }, { sapcode }],
    });
    if (existingAgency) {
      return res.status(409).json({ success: false, message: "Agency with same email or sapcode already exists" });
    }

    // 3️⃣ Create Agency with hashed password

    const hashedPassword = await hashPassword(password);
    // console.log("Hashed password", hashedPassword);
    const newAgency = await Agency.create({ name: gasAgencyName, sapcode, email, company });
    // console.log("Response received while createing", newAgency);

    //if agency is created then create admin user
    if (newAgency) {
      const ALL_PERMISSIONS = Object.values(PERMISSIONS);
      const newUser = await User.create({
        agencyId: newAgency._id,
        role: "ADMIN",
        username: "admin",
        email,
        password: hashedPassword,
        company,
        permissions: ALL_PERMISSIONS,
        createdBy: null,
      });
      // console.log("Response received while createing user", newUser);

      const token = generateJwtToken(newUser._id, newUser.role, gasAgencyName, username);

      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: EXPIRES_IN });
      res.status(201).json({ message: "Agency Added and admin created", newAgency, newUser, success: true });
      // if (newUser) {
      //   res.status(201).json({ message: "Agency Added and admin created", newAgency, newUser, token, success: true });
      // }
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    // console.log(req.body);
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const orConditions = [{ email: identifier }, { username: identifier }];

    if (/^\d+$/.test(identifier)) {
      orConditions.push({ mobile: Number(identifier) });
    }
    const userExists = await User.findOne({ $or: orConditions });
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    const validPassword = comparePassword(password, userExists.password);
    if (!validPassword) {
      return res.status(404).json({ success: false, message: "Invalid login credentials" });
    }

    //generate token
    const token = generateJwtToken(userExists._id, userExists.role);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (userExists.role === "admin") {
      redirectTo = "/admin/dashboard";
      // } else if ((userExists.role = "doctor")) {
      //   redirectTo = "/doctor/dashboard";
      // } else if (userExists.role === "patient") {
      //   redirectTo = "/patient/dashboard";
    } else {
      redirectTo = "/";
    }
    res.status(200).json({ success: true, message: "Login successful", user: userExists, token });
  } catch (error) {
    next(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
};
