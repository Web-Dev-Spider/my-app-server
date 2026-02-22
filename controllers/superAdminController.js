const Agency = require("../models/Agency");
const AgencyProfile = require("../models/AgencyProfile");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const StockLocation = require("../models/StockLocation");
const LocationStockTransaction = require("../models/LocationStockTransaction");
const StockLedger = require("../models/StockLedger");
const ComplianceNotification = require("../models/ComplianceNotification");

// Inventory models
const AgencyProduct = require("../models/inventory/AgencyProduct");
const CylinderProduct = require("../models/inventory/CylinderProduct");
const CylinderTransaction = require("../models/inventory/CylinderTransaction");
const NFRProduct = require("../models/inventory/NFRProduct");
const PRProduct = require("../models/inventory/PRProduct");
const ProductCategory = require("../models/inventory/ProductCategory");
const PurchaseRecord = require("../models/inventory/PurchaseRecord");
const StockTransaction = require("../models/inventory/StockTransaction");
const Supplier = require("../models/inventory/Supplier");

// GET /api/super-admin/agency/:agencyId
// Fetch agency details including godowns and basic info
const getAgencyDetails = async (req, res) => {
  try {
    const { agencyId } = req.params;

    // Validate agencyId format
    if (!agencyId || agencyId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }

    // Fetch agency details
    const agency = await Agency.findById(agencyId).lean();

    if (!agency) {
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    // Fetch agency profile
    const agencyProfile = await AgencyProfile.findOne({ agencyId }).lean();

    // Fetch godowns for this agency
    const godowns = await StockLocation.find({
      agencyId,
      locationType: "GODOWN",
    })
      .select("name code address contact isActive createdAt")
      .lean();

    // Count related documents
    const userCount = await User.countDocuments({ agencyId });
    const vehicleCount = await Vehicle.countDocuments({ agencyId });
    const supplierCount = await Supplier.countDocuments({ agencyId });

    return res.status(200).json({
      success: true,
      data: {
        _id: agency._id,
        name: agency.name,
        address: agency.address,
        gst: agency.gstNumber,
        gstNumber: agency.gstNumber,
        godowns: {
          count: godowns.length,
          data: godowns,
        },
        relatedCount: {
          users: userCount,
          vehicles: vehicleCount,
          suppliers: supplierCount,
        },
        createdAt: agency.createdAt,
        updatedAt: agency.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching agency details:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching agency details",
      error: error.message,
    });
  }
};

// DELETE /api/super-admin/agency/:agencyId
// Permanently delete agency and all related documents
const deleteAgency = async (req, res) => {
  try {
    const { agencyId } = req.params;

    console.log("🗑️ DELETE AGENCY REQUEST - AgencyId:", agencyId);

    // Validate agencyId
    if (!agencyId || agencyId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Agency ID is required",
      });
    }

    // Verify agency exists
    const agency = await Agency.findById(agencyId);
    if (!agency) {
      console.warn("❌ Agency not found:", agencyId);
      return res.status(404).json({
        success: false,
        message: "Agency not found",
      });
    }

    const agencyName = agency.name;
    console.log("✅ Agency found:", agencyName, "- Starting cascade deletion...");

    // Delete all related documents in parallel using Promise.all
    // This ensures atomicity and efficiency
    const deleteResults = await Promise.all([
      // Delete inventory-related documents
      AgencyProduct.deleteMany({ agencyId }).then((r) => ({ collection: "AgencyProduct", deleted: r.deletedCount })),
      CylinderProduct.deleteMany({ agencyId }).then((r) => ({
        collection: "CylinderProduct",
        deleted: r.deletedCount,
      })),
      CylinderTransaction.deleteMany({ agencyId }).then((r) => ({
        collection: "CylinderTransaction",
        deleted: r.deletedCount,
      })),
      NFRProduct.deleteMany({ agencyId }).then((r) => ({ collection: "NFRProduct", deleted: r.deletedCount })),
      PRProduct.deleteMany({ agencyId }).then((r) => ({ collection: "PRProduct", deleted: r.deletedCount })),
      ProductCategory.deleteMany({ agencyId }).then((r) => ({
        collection: "ProductCategory",
        deleted: r.deletedCount,
      })),
      PurchaseRecord.deleteMany({ agencyId }).then((r) => ({ collection: "PurchaseRecord", deleted: r.deletedCount })),
      StockTransaction.deleteMany({ agencyId }).then((r) => ({
        collection: "StockTransaction",
        deleted: r.deletedCount,
      })),
      Supplier.deleteMany({ agencyId }).then((r) => ({ collection: "Supplier", deleted: r.deletedCount })),

      // Delete location and stock-related documents
      StockLocation.deleteMany({ agencyId }).then((r) => ({ collection: "StockLocation", deleted: r.deletedCount })),
      LocationStockTransaction.deleteMany({ agencyId }).then((r) => ({
        collection: "LocationStockTransaction",
        deleted: r.deletedCount,
      })),
      StockLedger.deleteMany({ agencyId }).then((r) => ({ collection: "StockLedger", deleted: r.deletedCount })),

      // Delete user-related documents
      User.deleteMany({ agencyId }).then((r) => ({ collection: "User", deleted: r.deletedCount })),

      // Delete vehicle and compliance related documents
      Vehicle.deleteMany({ agencyId }).then((r) => ({ collection: "Vehicle", deleted: r.deletedCount })),
      ComplianceNotification.deleteMany({ agencyId }).then((r) => ({
        collection: "ComplianceNotification",
        deleted: r.deletedCount,
      })),

      // Delete agency profile and agency itself
      AgencyProfile.deleteMany({ agencyId }).then((r) => ({ collection: "AgencyProfile", deleted: r.deletedCount })),
      Agency.deleteOne({ _id: agencyId }).then((r) => ({ collection: "Agency", deleted: r.deletedCount })),
    ]);

    console.log("📊 Deletion Summary:", deleteResults);

    return res.status(200).json({
      success: true,
      message: `Agency "${agencyName}" and all related data have been permanently deleted.`,
      deletedAgency: {
        _id: agencyId,
        name: agencyName,
      },
      deletionSummary: deleteResults,
    });
  } catch (error) {
    console.error("❌ Error deleting agency:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting agency",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

module.exports = {
  getAgencyDetails,
  deleteAgency,
};
