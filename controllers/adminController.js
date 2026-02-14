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

        const newUser = await User.create({
            name,
            email: email || undefined, // Use undefined so mongoose sparse index ignores it if empty/null
            mobile,
            username,
            password: hashedPassword,
            role,
            permissions,
            agencyId,
            createdBy: req.user._id
        });

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

module.exports = {
    getStats,
    getAllAgencies,
    toggleAgencyStatus,
    createUser,
    getAgencyUsers
};
