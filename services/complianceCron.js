const cron = require("node-cron");
const Vehicle = require("../models/Vehicle");
const { generateComplianceNotifications } = require("../controllers/vehicleController");

/**
 * Runs once daily at 6:00 AM.
 * Scans all active vehicles across all agencies and generates
 * compliance notifications for documents expiring within 60 days.
 */
const startComplianceCron = () => {
    cron.schedule("0 6 * * *", async () => {
        console.log("[ComplianceCron] Running daily compliance check...");
        try {
            const vehicles = await Vehicle.find({ isActive: true });
            let processed = 0;
            let errors = 0;

            for (const vehicle of vehicles) {
                try {
                    await generateComplianceNotifications(vehicle);
                    processed++;
                } catch (err) {
                    errors++;
                    console.error(`[ComplianceCron] Error processing vehicle ${vehicle.registrationNumber}:`, err.message);
                }
            }

            console.log(`[ComplianceCron] Done. Processed: ${processed}, Errors: ${errors}`);
        } catch (err) {
            console.error("[ComplianceCron] Fatal error:", err.message);
        }
    });

    console.log("[ComplianceCron] Scheduled — runs daily at 6:00 AM");
};

module.exports = { startComplianceCron };
