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

module.exports = {
    getStats,
    getAllAgencies,
    toggleAgencyStatus
};
