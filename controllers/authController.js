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

    // Check if user email already exists to prevent partial failure
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already registered to a user account." });
    }

    // 3️⃣ Create Agency with hashed password

    const hashedPassword = await hashPassword(password);
    // console.log("Hashed password", hashedPassword);
    const newAgency = await Agency.create({ name: gasAgencyName, sapcode, email, company });
    // console.log("Response received while createing", newAgency);

    //if agency is created then create admin user
    if (newAgency) {
      const username = `admin_${sapcode}`;
      const ALL_PERMISSIONS = Object.values(PERMISSIONS);
      const newUser = await User.create({
        agencyId: newAgency._id,
        role: "ADMIN",
        username,
        email,
        password: hashedPassword,
        company,
        permissions: ALL_PERMISSIONS,
        createdBy: null,
      });
      // console.log("Response received while createing user", newUser);

      if (newUser) {
        // const token = generateJwtToken({ userId: newUser._id, role: newUser.role, agency: newUser.agencyId, username });
        // res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "lax", maxAge: EXPIRES_IN });
        return res.status(201).json({ message: "Agency Added and admin created", success: true });
      } else {
        return res.status(500).json({ success: false, message: "Error creating user" });
      }
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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
    //password select is false in userschema, so here we need to add select password to compare user password
    const userExists = await User.findOne({ $or: orConditions }).select("+password");
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User does not exist",
      });
    }

    const validPassword = await comparePassword(password, userExists.password);
    if (!validPassword) {
      return res.status(404).json({ success: false, message: "Invalid login credentials" });
    }
    //Delete password from existing user to send in response
    const userSafe = userExists.toObject();
    delete userSafe.password;
    // console.log("User safe", userSafe);

    const agency = await Agency.findById(userExists.agencyId);
    // console.log("agency", agency);
    // console.log("Agency", agency);

    //generate token
    const token = generateJwtToken({ user: userSafe, role: userExists.role, agency });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });
    // console.log("Token generated", token);
    // if (userExists.role === "admin") {
    //   redirectTo = "/admin/dashboard";
    //   // } else if ((userExists.role = "doctor")) {
    //   //   redirectTo = "/doctor/dashboard";
    //   // } else if (userExists.role === "patient") {
    //   //   redirectTo = "/patient/dashboard";
    // } else {
    //   redirectTo = "/";
    // }

    return res
      .status(200)
      .json({ success: true, message: "Login successful", user: userSafe, agency, redirectTo: "/" });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: error.message });
    next(error);
  }
};

const me = async (req, res) => {
  try {
    // console.log("req.user at auth/me: ", req.user);
    res.json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logout successful" });
};

module.exports = {
  register,
  login,
  me,
  logout,
};
