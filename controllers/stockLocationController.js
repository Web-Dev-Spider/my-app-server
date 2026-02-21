const StockLocation = require("../models/StockLocation");

// POST /api/inventory/stock-location
const createStockLocation = async (req, res) => {
  try {
    const { locationType, name, code, address, supplierDetails, notes } = req.body;

    // Prevent manual creation of VEHICLE type locations (auto-created only)
    if (locationType === "VEHICLE") {
      return res.status(400).json({
        success: false,
        message: "VEHICLE type locations are auto-created when vehicles are registered. Cannot create manually.",
      });
    }

    // Validate required fields
    if (!locationType || !name) {
      return res.status(400).json({
        success: false,
        message: "locationType and name are required",
      });
    }

    const location = await StockLocation.create({
      agencyId: req.user.agencyId,
      locationType,
      name,
      code,
      address,
      supplierDetails,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Stock location created successfully",
      data: location,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A location with this name already exists in your agency",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory/stock-locations
const getStockLocations = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const filter = { agencyId: req.user.agencyId };

    // Optional filter by type
    if (type) {
      filter.locationType = type;
    }

    const skip = (page - 1) * limit;

    const [locations, total] = await Promise.all([
      StockLocation.find(filter)
        .populate("vehicleId", "registrationNumber vehicleName")
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      StockLocation.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: locations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory/stock-location/:id
const getStockLocation = async (req, res) => {
  try {
    const location = await StockLocation.findOne({
      _id: req.params.id,
      agencyId: req.user.agencyId,
    }).populate("vehicleId");

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Stock location not found",
      });
    }

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/inventory/stock-location/:id
const updateStockLocation = async (req, res) => {
  try {
    const { name, address, supplierDetails, isActive, notes } = req.body;

    // Prevent changing critical fields
    if (req.body.locationType || req.body.vehicleId) {
      return res.status(400).json({
        success: false,
        message: "Cannot change location type or vehicle association",
      });
    }

    // Build update object with only allowed fields
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (supplierDetails !== undefined) updates.supplierDetails = supplierDetails;
    if (isActive !== undefined) updates.isActive = isActive;
    if (notes !== undefined) updates.notes = notes;

    const location = await StockLocation.findOneAndUpdate(
      { _id: req.params.id, agencyId: req.user.agencyId },
      updates,
      { new: true, runValidators: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Stock location not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock location updated successfully",
      data: location,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A location with this name already exists in your agency",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/inventory/stock-location/:id/stock
const getLocationStock = async (req, res) => {
  try {
    // Verify location belongs to user's agency
    const location = await StockLocation.findOne({
      _id: req.params.id,
      agencyId: req.user.agencyId,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Stock location not found",
      });
    }

    // TODO: Wire with StockLedger in Phase 2
    // For now, return placeholder structure with empty stock array
    res.status(200).json({
      success: true,
      data: {
        locationId: location._id,
        locationName: location.name,
        locationType: location.locationType,
        stock: [],
        // TODO: Add stock items here once StockLedger is implemented
        // stock: [
        //   { productId, productName, variant, quantity, ... }
        // ]
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createStockLocation,
  getStockLocations,
  getStockLocation,
  updateStockLocation,
  getLocationStock,
};
