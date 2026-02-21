const mongoose = require("mongoose");

const complianceNotificationSchema = new mongoose.Schema(
    {
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: true,
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },

        // Which compliance document is expiring
        complianceType: {
            type: String,
            enum: ["FITNESS", "POLLUTION", "INSURANCE", "PERMIT", "ROAD_TAX", "TAX"],
            required: true,
        },

        // Actual expiry date of the document
        expiryDate: {
            type: Date,
            required: true,
        },

        // How many days until expiry at time of notification creation
        // Negative = already expired
        daysRemaining: {
            type: Number,
            required: true,
        },

        // Severity based on daysRemaining
        severity: {
            type: String,
            enum: ["CRITICAL", "WARNING", "INFO"],
            // CRITICAL: expired or <= 7 days
            // WARNING: 8–30 days
            // INFO: 31–60 days
            required: true,
        },

        // Read/acknowledged by agency admin
        isRead: { type: Boolean, default: false },
        readAt: { type: Date },

        // Deduplication: one notification per (vehicle, complianceType, date of creation)
        // Prevents duplicate cron-generated notifications on the same day
        dedupKey: {
            type: String,
            unique: true, // vehicleId_complianceType_YYYY-MM-DD
            required: true,
        },
    },
    { timestamps: true }
);

complianceNotificationSchema.index({ agencyId: 1, isRead: 1, createdAt: -1 });
complianceNotificationSchema.index({ vehicleId: 1, complianceType: 1 });
complianceNotificationSchema.index({ dedupKey: 1 }, { unique: true });

module.exports = mongoose.model("ComplianceNotification", complianceNotificationSchema);
