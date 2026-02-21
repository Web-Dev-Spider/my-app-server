const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
    {
        agencyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Agency",
            required: [true, "Agency is required"],
        },

        registrationNumber: {
            type: String,
            required: [true, "Vehicle registration number is required"],
            unique: true,
            uppercase: true,
            trim: true,
        },

        vehicleType: {
            type: String,
            enum: ["TRUCK", "TEMPO", "AUTO", "VAN", "PICKUP", "OTHER"],
            required: [true, "Vehicle type is required"],
        },

        make: { type: String, trim: true },   // e.g. Tata, Ashok Leyland
        model: { type: String, trim: true },  // e.g. ACE, 407
        yearOfManufacture: { type: Number },

        // ── Compliance Dates ──────────────────────────────────────────────
        fitness: {
            expiryDate: { type: Date },
            certificateNumber: { type: String },
        },
        pollution: {
            expiryDate: { type: Date },
            certificateNumber: { type: String },
        },
        insurance: {
            expiryDate: { type: Date },
            policyNumber: { type: String },
            insurer: { type: String },
        },
        permit: {
            expiryDate: { type: Date },
            permitNumber: { type: String },
            permitType: { type: String },   // e.g. National, State, Local
        },
        roadTax: {
            expiryDate: { type: Date },
            receiptNumber: { type: String },
        },
        tax: {
            expiryDate: { type: Date },
            receiptNumber: { type: String },
        },

        // ── Status ────────────────────────────────────────────────────────
        isActive: { type: Boolean, default: true },

        remarks: { type: String },

        // ── Stock Location ─────────────────────────────────────────────────
        stockLocationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StockLocation",
            default: null,
        },
    },
    { timestamps: true }
);

vehicleSchema.index({ agencyId: 1 });
vehicleSchema.index({ registrationNumber: 1 }, { unique: true });

// ── Post-save hook: Auto-create StockLocation for vehicle ──────────────────
vehicleSchema.post("save", async function (doc) {
    // Only run on new documents
    if (!this.isNew) return;

    const StockLocation = require("./StockLocation");
    try {
        const vehicleName = doc.vehicleName || "";
        const locationName = `${doc.registrationNumber} ${vehicleName}`.trim();

        const location = await StockLocation.create({
            agencyId: doc.agencyId,
            locationType: "VEHICLE",
            name: locationName,
            code: doc.registrationNumber,
            vehicleId: doc._id,
        });

        // Update vehicle with stockLocationId
        await mongoose.model("Vehicle").updateOne(
            { _id: doc._id },
            { stockLocationId: location._id }
        );
    } catch (error) {
        console.error("Error creating vehicle stock location:", error);
        // Don't break vehicle creation if location creation fails
    }
});

module.exports = mongoose.model("Vehicle", vehicleSchema);
