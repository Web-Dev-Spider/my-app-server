const Vehicle = require("../models/Vehicle");
const ComplianceNotification = require("../models/ComplianceNotification");

// ── Helpers ──────────────────────────────────────────────────────────────────

const COMPLIANCE_FIELDS = ["fitness", "pollution", "insurance", "permit", "roadTax", "tax"];

const COMPLIANCE_TYPE_MAP = {
    fitness: "FITNESS",
    pollution: "POLLUTION",
    insurance: "INSURANCE",
    permit: "PERMIT",
    roadTax: "ROAD_TAX",
    tax: "TAX",
};

function getSeverity(daysRemaining) {
    if (daysRemaining <= 7) return "CRITICAL";
    if (daysRemaining <= 30) return "WARNING";
    return "INFO";
}

function buildDedupKey(vehicleId, complianceType) {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${vehicleId}_${complianceType}_${today}`;
}

// Generate notifications for a single vehicle (called after save/update)
async function generateComplianceNotifications(vehicle) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ALERT_THRESHOLD_DAYS = 60;

    for (const field of COMPLIANCE_FIELDS) {
        const doc = vehicle[field];
        if (!doc || !doc.expiryDate) continue;

        const expiry = new Date(doc.expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const daysRemaining = Math.round((expiry - today) / (1000 * 60 * 60 * 24));

        if (daysRemaining > ALERT_THRESHOLD_DAYS) continue; // Not due yet

        const complianceType = COMPLIANCE_TYPE_MAP[field];
        const dedupKey = buildDedupKey(vehicle._id, complianceType);
        const severity = getSeverity(daysRemaining);

        try {
            await ComplianceNotification.findOneAndUpdate(
                { dedupKey },
                {
                    agencyId: vehicle.agencyId,
                    vehicleId: vehicle._id,
                    complianceType,
                    expiryDate: doc.expiryDate,
                    daysRemaining,
                    severity,
                    dedupKey,
                },
                { upsert: true, new: true }
            );
        } catch {
            // Ignore duplicate key errors (already inserted today)
        }
    }
}

// ── Vehicle CRUD ──────────────────────────────────────────────────────────────

// POST /inventory/vehicle
const createVehicle = async (req, res) => {
    try {
        const { registrationNumber } = req.body;

        const existing = await Vehicle.findOne({
            registrationNumber: registrationNumber.toUpperCase(),
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: "Vehicle with this registration number already exists",
            });
        }

        const vehicle = new Vehicle({
            ...req.body,
            agencyId: req.user.agencyId,
            registrationNumber: registrationNumber.toUpperCase(),
        });
        await vehicle.save();

        // Generate compliance alerts if any dates are near expiry
        await generateComplianceNotifications(vehicle);

        res.status(201).json({ success: true, message: "Vehicle added successfully", vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /inventory/vehicles
const getVehicles = async (req, res) => {
    try {
        const filter = { agencyId: req.user.agencyId };
        if (req.query.active === "true") filter.isActive = true;
        if (req.query.active === "false") filter.isActive = false;

        const vehicles = await Vehicle.find(filter)
            .populate("stockLocationId")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, vehicles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /inventory/vehicle/:id
const getVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOne({
            _id: req.params.id,
            agencyId: req.user.agencyId,
        }).populate("stockLocationId");
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });
        res.status(200).json({ success: true, vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /inventory/vehicle/:id
const updateVehicle = async (req, res) => {
    try {
        const updates = { ...req.body };
        delete updates.agencyId;

        if (updates.registrationNumber) {
            updates.registrationNumber = updates.registrationNumber.toUpperCase();
        }

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, agencyId: req.user.agencyId },
            updates,
            { new: true, runValidators: true }
        );

        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

        // If registrationNumber changed, update the linked StockLocation
        if (updates.registrationNumber || updates.vehicleName) {
            if (vehicle.stockLocationId) {
                const StockLocation = require("../models/StockLocation");
                const vehicleName = vehicle.vehicleName || "";
                const newLocationName = `${vehicle.registrationNumber} ${vehicleName}`.trim();

                await StockLocation.findByIdAndUpdate(
                    vehicle.stockLocationId,
                    {
                        name: newLocationName,
                        code: vehicle.registrationNumber,
                    },
                    { runValidators: true }
                );
            }
        }

        // Re-evaluate compliance notifications after update
        await generateComplianceNotifications(vehicle);

        res.status(200).json({ success: true, message: "Vehicle updated successfully", vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /inventory/vehicle/:id/status
const toggleVehicleStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: req.params.id, agencyId: req.user.agencyId },
            { isActive },
            { new: true }
        );
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

        // Sync isActive status to linked StockLocation
        if (vehicle.stockLocationId) {
            const StockLocation = require("../models/StockLocation");
            await StockLocation.findByIdAndUpdate(
                vehicle.stockLocationId,
                { isActive },
                { new: true }
            );
        }

        const action = isActive ? "activated" : "deactivated";
        res.status(200).json({ success: true, message: `Vehicle ${action} successfully`, vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /inventory/vehicle/:id
const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findOneAndDelete({
            _id: req.params.id,
            agencyId: req.user.agencyId,
        });
        if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found" });

        // Remove associated compliance notifications
        await ComplianceNotification.deleteMany({ vehicleId: vehicle._id });

        res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── Compliance Notifications ──────────────────────────────────────────────────

// GET /inventory/compliance-notifications
const getComplianceNotifications = async (req, res) => {
    try {
        const filter = { agencyId: req.user.agencyId };
        if (req.query.unread === "true") filter.isRead = false;

        const notifications = await ComplianceNotification.find(filter)
            .populate("vehicleId", "registrationNumber vehicleType make model")
            .sort({ severity: 1, daysRemaining: 1, createdAt: -1 });

        const unreadCount = await ComplianceNotification.countDocuments({
            agencyId: req.user.agencyId,
            isRead: false,
        });

        res.status(200).json({ success: true, notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /inventory/compliance-notifications/mark-read
const markNotificationsRead = async (req, res) => {
    try {
        const { ids } = req.body; // Array of notification IDs, or empty to mark all

        const filter = { agencyId: req.user.agencyId };
        if (ids && ids.length > 0) filter._id = { $in: ids };

        await ComplianceNotification.updateMany(filter, {
            isRead: true,
            readAt: new Date(),
        });

        res.status(200).json({ success: true, message: "Notifications marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createVehicle,
    getVehicles,
    getVehicle,
    updateVehicle,
    toggleVehicleStatus,
    deleteVehicle,
    getComplianceNotifications,
    markNotificationsRead,
    generateComplianceNotifications, // exported for cron job
};
