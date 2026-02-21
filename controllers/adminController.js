const mongoose = require("mongoose");
const User = require("../models/User");
const Agency = require("../models/Agency");
const distributorCount = require("../config/distributorCount");

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: "SUPER-ADMIN" } });
    const activeUsers = await User.countDocuments({ isActive: true, role: { $ne: "SUPER-ADMIN" } });

    // Aggregate distributors by company
    const distributors = await Agency.aggregate([
      {
        $group: {
          _id: "$company",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format distributors object
    const distData = {
      IOCL: 0,
      HPCL: 0,
      BPCL: 0,
    };

    distributors.forEach((d) => {
      if (d._id) {
        distData[d._id] = d.count;
      }
    });

    res.status(200).json({
      success: true,
      totalUsers,
      activeUsers,
      distributors: distData,
      marketCounts: distributorCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAgencies = async (req, res) => {
  try {
    const agencies = await Agency.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, agencies });
  } catch (error) {
    console.error("Error fetching agencies:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const toggleAgencyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive status is required" });
    }

    const agency = await Agency.findByIdAndUpdate(id, { isActive }, { new: true });

    if (!agency) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }

    // Update all users associated with this agency
    await User.updateMany({ agencyId: id }, { isActive });

    res.status(200).json({
      success: true,
      message: `Agency ${isActive ? "activated" : "deactivated"} successfully`,
      agency,
    });
  } catch (error) {
    console.error("Error toggling agency status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const { hashPassword } = require("../utils/hashPassword");
const ROLE_PERMISSIONS = require("../config/rolePermissions");

const createUser = async (req, res) => {
  try {
    const { name, email, mobile, username, password, role } = req.body;
    const agencyId = req.user.agencyId; // Assuming admin belongs to an agency

    // Check if user already exists
    const orConditions = [{ username }, { mobile }];
    if (email) {
      orConditions.push({ email });
    }

    const existingUser = await User.findOne({
      $or: orConditions,
    });

    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User with same email, username or mobile already exists" });
    }

    const hashedPassword = await hashPassword(password);

    // Get default permissions based on role
    const permissions = ROLE_PERMISSIONS[role] || [];

    const userData = {
      name,
      mobile,
      username,
      password: hashedPassword,
      role,
      permissions,
      agencyId,
      createdBy: req.user._id,
      approvalStatus: "approved", // Staff created by admins are approved instantly
    };

    if (email && email.trim() !== "") {
      userData.email = email.trim();
    }

    const newUser = await User.create(userData);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAgencyUsers = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const Users = await User.find({ agencyId }).select("-password").sort({ createdAt: -1 });
    res.status(200).json({ success: true, users: Users });
  } catch (error) {
    console.error("Error fetching agency users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAgencyDetails = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const agency = await Agency.findById(agencyId);
    if (!agency) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }
    res.status(200).json({ success: true, agency });
  } catch (error) {
    console.error("Error fetching agency details:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateAgencyDetails = async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const { name, address, contacts, gstNumber } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (gstNumber) updateData.gstNumber = gstNumber;

    // Handle nested address updates
    if (address) {
      for (const [key, value] of Object.entries(address)) {
        updateData[`address.${key}`] = value;
      }
    }

    // Handle contacts updates
    if (contacts) {
      if (Array.isArray(contacts) && contacts.length > 3) {
        return res.status(400).json({ success: false, message: "Maximum 3 contact numbers allowed" });
      }
      updateData.contacts = contacts;
    }

    const agency = await Agency.findByIdAndUpdate(agencyId, { $set: updateData }, { new: true, runValidators: true });

    if (!agency) {
      return res.status(404).json({ success: false, message: "Agency not found" });
    }

    res.status(200).json({ success: true, message: "Agency details updated successfully", agency });
  } catch (error) {
    console.error("Error updating agency details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, mobile, username, role, permissions } = req.body;
    const agencyId = req.user.agencyId; // Ensure admin can only update users in their agency

    const user = await User.findOne({ _id: id, agencyId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email !== undefined) updateData.email = email && email.trim() !== "" ? email : undefined; // Handle potential email removal or update
    if (mobile) updateData.mobile = mobile;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions; // Update permissions directly

    // If role is changed, we might want to reset permissions or merge?
    // Requirement says "add some special permission... other than default".
    // If role changes, usually we reset to new role defaults.
    // However, if only permissions are sent, we just update them.
    // Let's assume the frontend sends the final list of permissions.

    // Safety check for unique fields if they are being changed (handled by mongoose index usually, but good to catch early if needed)
    // For brevity relying on mongoose unique index error.

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select(
      "-password",
    );

    res.status(200).json({ success: true, message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const agencyId = req.user.agencyId;

    const user = await User.findOneAndUpdate({ _id: id, agencyId }, { isActive }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAgencyStats = async (req, res) => {
  try {
    const agencyId = new mongoose.Types.ObjectId(req.user.agencyId);

    const stats = await User.aggregate([
      { $match: { agencyId: agencyId } },
      {
        $group: {
          _id: "$role",
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$isActive", true] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } },
        },
      },
    ]);

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr._id] = {
        total: curr.total,
        active: curr.active,
        inactive: curr.inactive,
      };
      return acc;
    }, {});

    res.status(200).json({ success: true, stats: formattedStats });
  } catch (error) {
    console.error("Error fetching agency stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.user.agencyId;

    const user = await User.findOneAndDelete({ _id: id, agencyId });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get pending registrations
const getPendingRegistrations = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const userAgencyId = req.user.agencyId;

    let query = { approvalStatus: "pending" };

    // Super Admin can see all pending registrations (handle both SUPER-ADMIN and SUPER_ADMIN)
    const isSuperAdmin = userRole === "SUPER-ADMIN" || userRole === "SUPER_ADMIN";

    if (isSuperAdmin) {
      // Get all pending users (agency admins and staff from all agencies)
      const pendingUsers = await User.find(query)
        .populate("agencyId", "name sapcode email company")
        .populate("approvedBy", "name email")
        .select("-password")
        .sort({ createdAt: -1 });

      console.log("Pending users found for super-admin:", pendingUsers.length);
      return res.status(200).json({ success: true, data: pendingUsers });
    }

    // Regular Admin can only see pending staff in their agency
    if (userRole === "ADMIN") {
      query.agencyId = userAgencyId;
      query.role = { $ne: "ADMIN" }; // Don't show other admins
      const pendingStaff = await User.find(query)
        .populate("agencyId", "name sapcode")
        .select("-password")
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, data: pendingStaff });
    }

    return res.status(403).json({ success: false, message: "Unauthorized" });
  } catch (error) {
    console.error("Error fetching pending registrations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Approve pending user
const approvePendingUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const approverRole = req.user.role;
    const approverId = req.user._id;
    const approverAgencyId = req.user.agencyId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check authorization
    const isSuperAdmin = approverRole === "SUPER-ADMIN" || approverRole === "SUPER_ADMIN";
    if (approverRole === "ADMIN") {
      // Admins can only approve users in their agency
      if (user.agencyId.toString() !== approverAgencyId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
      // Admins can't approve other admins
      if (user.role === "ADMIN") {
        return res.status(403).json({ success: false, message: "Cannot approve admins" });
      }
    } else if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Update user approval status
    user.approvalStatus = "approved";
    user.approvedBy = approverId;
    user.approvalDate = new Date();
    await user.save();

    // Send approval email
    const sendEmail = require("../utils/sendEmail");
    const agency = await require("../models/Agency").findById(user.agencyId);
    const loginUrl = process.env.VITE_BASE_URL || "http://localhost:5173";

    const approvalEmailHtml = `
            <h2>Registration Approved!</h2>
            <p>Great news! Your agency registration has been approved.</p>
            <p>You can now log in with:</p>
            <ul>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Username:</strong> ${user.username}</li>
                <li><strong>Password:</strong> [Your password]</li>
            </ul>
            <p><a href="${loginUrl}/login">Log in here</a></p>
            <p>Next steps:</p>
            <ul>
                <li>Complete your agency profile</li>
                <li>Create additional staff accounts</li>
            </ul>
        `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Registration Approved - Account Active",
        html: approvalEmailHtml,
        message: "Your agency registration has been approved. You can now log in.",
      });
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
    }

    res.status(200).json({ success: true, message: "User approved successfully" });
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Reject pending user
const rejectPendingUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { rejectionNote } = req.body;
    const rejecterRole = req.user.role;
    const rejectingAgencyId = req.user.agencyId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check authorization
    const isSuperAdmin = rejecterRole === "SUPER-ADMIN" || rejecterRole === "SUPER_ADMIN";
    if (rejecterRole === "ADMIN") {
      // Admins can only reject users in their agency
      if (user.agencyId.toString() !== rejectingAgencyId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
      // Admins can't reject other admins
      if (user.role === "ADMIN") {
        return res.status(403).json({ success: false, message: "Cannot reject admins" });
      }
    } else if (!isSuperAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Update user rejection status
    user.approvalStatus = "rejected";
    user.rejectionNote = rejectionNote || "Not provided";
    await user.save();

    // Send rejection email
    const sendEmail = require("../utils/sendEmail");

    const rejectionEmailHtml = `
            <h2>Registration Status Update</h2>
            <p>Your agency registration request was not approved at this time.</p>
            <p><strong>Reason:</strong> ${user.rejectionNote}</p>
            <p>Please contact support for more information or to discuss your application.</p>
        `;

    try {
      await sendEmail({
        email: user.email,
        subject: "Registration Status Update",
        html: rejectionEmailHtml,
        message: `Your agency registration was rejected. Reason: ${user.rejectionNote}`,
      });
    } catch (emailError) {
      console.error("Error sending rejection email:", emailError);
    }

    res.status(200).json({ success: true, message: "User rejected successfully" });
  } catch (error) {
    console.error("Error rejecting user:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getStats,
  getAllAgencies,
  toggleAgencyStatus,
  createUser,
  getAgencyUsers,
  getAgencyDetails,
  updateAgencyDetails,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getAgencyStats,
  getPendingRegistrations,
  approvePendingUser,
  rejectPendingUser,
};
