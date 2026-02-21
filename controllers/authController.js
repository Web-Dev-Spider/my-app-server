const User = require("../models/User");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const PERMISSIONS = require("../config/permissions");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
// const hashPassword = require("../utils/hashPassword");
const Agency = require("../models/Agency");
const { generateJwtToken } = require("../utils/jwt"); // co
const { NODE_ENV, VITE_BASE_URL } = require("../config/envConfig");
const sendEmail = require("../utils/sendEmail");

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
        // approvalStatus defaults to 'pending' from schema
      });
      // console.log("Response received while createing user", newUser);

      if (newUser) {
        // Send registration confirmation email
        const registrationEmailHtml = `
          <h2>Registration Confirmation</h2>
          <p>Welcome to our application!</p>
          <p>Your agency registration has been received:</p>
          <ul>
            <li><strong>Agency Name:</strong> ${gasAgencyName}</li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Company:</strong> ${company}</li>
            <li><strong>SAP Code:</strong> ${sapcode}</li>
          </ul>
          <p>Your admin account is pending approval from our team. We'll send you an email notification once approved.</p>
          <p>Do not share this information with anyone.</p>
        `;

        try {
          await sendEmail({
            email,
            subject: "Registration Confirmation - Pending Approval",
            html: registrationEmailHtml,
            message: `Your agency registration has been received. Your admin account is pending approval from our team.`,
          });
        } catch (emailError) {
          console.error("Error sending registration email:", emailError);
          // Don't fail the registration if email fails
        }

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
    console.log(identifier, password);

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

    // Check approval status - block login if not approved (SUPER-ADMIN users bypass this)
    const isSuperAdmin = userExists.role === "SUPER-ADMIN" || userExists.role === "SUPER_ADMIN";

    if (!isSuperAdmin) {
      if (userExists.approvalStatus === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your registration is pending admin approval. Please wait for approval email.",
        });
      }

      if (userExists.approvalStatus === "rejected") {
        return res.status(403).json({
          success: false,
          message: `Your registration was rejected. Reason: ${userExists.rejectionNote || "Not provided"}`,
        });
      }
    }

    //Delete password from existing user to send in response
    const userSafe = userExists.toObject();
    delete userSafe.password;
    console.log("User safe", userSafe);

    const agency = await Agency.findById(userExists.agencyId);
    // console.log("agency", agency);
    // console.log("Agency", agency);

    // Block login if the user's agency has been deactivated by super-admin
    if (!isSuperAdmin && (!agency || !agency.isActive)) {
      return res.status(403).json({
        success: false,
        message: "Access is denied, contact the administrator",
      });
    }

    //generate token
    const token = generateJwtToken({ user: userSafe, role: userExists.role, agency });
    const isProduction = NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction, // secure only in production
      sameSite: isProduction ? "none" : "lax", // none for cross-site (prod), lax for local
      maxAge: 5 * 60 * 60 * 1000,
    });

    return res
      .status(200)
      .json({ success: true, message: "Login successful", user: userSafe, agency, redirectTo: "/home" });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: error.message });
    next(error);
  }
};

const me = async (req, res) => {
  try {
    // console.log("req.user at auth/me: ", req.user);

    // Fetch agency data so the frontend gets it on page refresh
    let agency = null;
    if (req.user.agencyId) {
      agency = await Agency.findById(req.user.agencyId);
    }

    // Check if agency is still active (in case it was deactivated after login)
    const isSuperAdmin = req.user.role === "SUPER-ADMIN" || req.user.role === "SUPER_ADMIN";
    if (!isSuperAdmin && req.user.agencyId) {
      if (!agency || !agency.isActive) {
        res.clearCookie("token");
        return res.status(403).json({
          success: false,
          message: "Access is denied, contact the administrator",
        });
      }
    }

    res.json({
      success: true,
      user: req.user,
      agency,
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Middleware now correctly attaches decoded.user to req.user
    const { name, email, mobile, username } = req.body;

    // Build update object only with provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (username) updateData.username = username;

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select(
      "-password",
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email or Username already in use" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logout successful" });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save();

    // Create reset URL
    // Use origin from request header to ensure link points to the correct frontend (local or prod)
    const frontendUrl = req.get("origin") || VITE_BASE_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message,
        html: `<p>You requested a password reset</p><p>Click this link to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
      });

      res.status(200).json({ success: true, message: `Email sent to ${user.email}` });
    } catch (err) {
      // console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ success: false, message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  me,
  updateProfile,
  logout,
  forgotPassword,
  resetPassword,
};
