const mongoose = require("mongoose");
const User = require("../models/User");
const Agency = require("../models/Agency");

const getStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments() - 1;
        const activeUsers = await User.countDocuments({ isActive: true }) - 1;

        // Aggregate distributors by company
        const distributors = await Agency.aggregate([
            {
                $group: {
                    _id: "$company",
                    count: { $sum: 1 - 1 },
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

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: "isActive status is required" });
        }

        const agency = await Agency.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );

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
            $or: orConditions
        });

        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with same email, username or mobile already exists" });
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
            createdBy: req.user._id
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
                role: newUser.role
            }
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

        const agency = await Agency.findByIdAndUpdate(
            agencyId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

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

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select("-password");

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

        const user = await User.findOneAndUpdate(
            { _id: id, agencyId },
            { isActive },
            { new: true }
        );

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
                    inactive: { $sum: { $cond: [{ $eq: ["$isActive", false] }, 1, 0] } }
                }
            }
        ]);

        const formattedStats = stats.reduce((acc, curr) => {
            acc[curr._id] = {
                total: curr.total,
                active: curr.active,
                inactive: curr.inactive
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
    getAgencyStats
};
