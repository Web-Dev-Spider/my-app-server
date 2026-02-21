const PurchaseRecord = require("../models/inventory/PurchaseRecord");
const mongoose = require("mongoose");
const inventoryService = require("../services/inventoryService");
const AgencyProduct = require("../models/inventory/AgencyProduct");
const Vehicle = require("../models/Vehicle");
const StockLocation = require("../models/StockLocation");
const StockLedger = require("../models/StockLedger");
const LocationStockTransaction = require("../models/LocationStockTransaction");
const { executeStockMovement } = require("../utils/stockMovement");

// 1. Plant Purchase (Filled Cylinders IN)
const createPlantPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { voucherNo, date, supplier, items, subTotal, taxTotal, rounding, grandTotal, createdBy } = req.body;

    // 1. Create Purchase Record (Financial)
    const purchase = new PurchaseRecord({
      invoiceNo: voucherNo,
      invoiceDate: date,
      supplierName: supplier || "IOCL Plant",
      agencyId: req.user.agencyId,
      items: items.map((item) => ({
        cylinderProductId: item.cylinderProductId, // This is actually globalProductId in UI payload usually, or AgencyProduct ID
        // Ideally purchase should link to GlobalProduct or AgencyProduct. let's assume AgencyProduct ID for now.
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        totalAmount: item.totalAmount,
      })),
      subTotal,
      taxTotal,
      rounding,
      grandTotal,
      createdBy: createdBy || req.user._id,
    });

    await purchase.save({ session });

    // 2. Create Stock Transactions (Physical Stock IN)
    const commonDetails = {
      agencyId: req.user.agencyId,
      transactionDate: date,
      voucherNo,
      referenceModel: "Supplier", // Supplier Purchase
      // referenceUser: supplierId if we had one
      remarks: `Plant Purchase Invoice: ${voucherNo}`,
      createdBy: createdBy || req.user._id,
    };

    const transactionsData = items.map((item) => ({
      globalProductId: item.globalProductId, // Ensure FE sends this
      type: "PURCHASE",
      quantity: item.quantity,
      variant: "FILLED", // Plant sends filled cylinders
      direction: "IN",
      rate: item.unitPrice,
      totalAmount: item.totalAmount,
    }));

    await inventoryService.createStockTransactions(transactionsData, commonDetails, session);

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, message: "Plant Purchase recorded successfully", purchaseId: purchase._id });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Plant Purchase Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Dispatch Empty to Plant (Empty Cylinders OUT)
const dispatchEmptyToPlant = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { voucherNo, date, items, createdBy } = req.body;

    const commonDetails = {
      agencyId: req.user.agencyId,
      transactionDate: date,
      voucherNo,
      referenceModel: "Agency", // Internal Transfer to Plant
      remarks: "Empty Dispatch to Plant",
      createdBy: createdBy || req.user._id,
    };

    const transactionsData = items.map((item) => ({
      globalProductId: item.globalProductId,
      type: "SEND_TO_PLANT",
      quantity: item.quantity,
      variant: "EMPTY",
      direction: "OUT",
      rate: 0, // usually no financial value on dispatch slip
      totalAmount: 0,
    }));

    await inventoryService.createStockTransactions(transactionsData, commonDetails, session);

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, message: "Empty Dispatch created successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Process Refill Delivery (Filled OUT, Empty IN)
const processRefillDelivery = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { voucherNo, date, items, createdBy, customerId } = req.body;

    const commonDetails = {
      agencyId: req.user.agencyId,
      transactionDate: date,
      voucherNo,
      referenceModel: "User",
      referenceUser: customerId,
      remarks: "Refill Delivery",
      createdBy: createdBy || req.user._id,
    };

    const transactionsData = [];

    items.forEach((item) => {
      // 1. FILLED OUT (Stock -1)
      transactionsData.push({
        globalProductId: item.globalProductId,
        type: "REFILL_SALE",
        quantity: item.quantity,
        variant: "FILLED",
        direction: "OUT",
        rate: item.rate, // selling price
        totalAmount: item.totalAmount,
      });

      // 2. EMPTY IN (Stock +1) - If applicable (check business logic, usually 1:1)
      if (item.returnEmpty) {
        // Assume FE flag or default true for refills
        transactionsData.push({
          globalProductId: item.globalProductId,
          type: "REFILL_SALE", // Context is same transaction
          quantity: item.quantity,
          variant: "EMPTY",
          direction: "IN",
          rate: 0, // Deposit value usually not exchanged here physically
          totalAmount: 0,
        });
      }
    });

    await inventoryService.createStockTransactions(transactionsData, commonDetails, session);

    await session.commitTransaction();
    session.endSession();
    res.status(201).json({ success: true, message: "Refill Delivery processed successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Get Live Stock
const getLiveStock = async (req, res) => {
  try {
    const stock = await inventoryService.calculateLiveStock(req.user.agencyId);
    res.status(200).json({ success: true, stock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Get Cylinder Products (Helper for dropdowns)
const getCylinderProducts = async (req, res) => {
  try {
    // ... (Keep existing logic or update to return new structure)
    // Reusing existing logic for now but ensuring field mapping
    const agencyProducts = await AgencyProduct.find({
      agencyId: req.user.agencyId,
      isActive: true,
    }).populate("globalProductId");

    const products = agencyProducts.map((ap) => {
      const global = ap.globalProductId;
      return {
        _id: ap._id, // AgencyProduct ID
        globalProductId: global._id, // Needed for Transactions
        name: ap.localName || global.name,
        productCode: global.productCode,
        capacityKg: global.capacityKg,
        currentPurchasePrice: ap.currentPurchasePrice,
        currentSalePrice: ap.currentSalePrice,
        type: "cylinder", // simplistic type for FE
      };
    });
    res.status(200).json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==================== PHASE 2: Location-Aware Stock Movement ====================

// 6. Issue stock to vehicle: POST /inventory/stock/issue
const issueStockToVehicle = async (req, res) => {
  try {
    const {
      vehicleId,
      driverName,
      driverPhone,
      driverUserId,
      tripNumber = 1,
      sourceLocationId,
      allowOverdraft = false,
      remarks,
      lines,
    } = req.body;

    // Validate required fields
    if (!vehicleId || !sourceLocationId || !lines || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: vehicleId, sourceLocationId, lines",
      });
    }

    // Validate vehicle belongs to agency
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      agencyId: req.user.agencyId,
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found for this agency",
      });
    }

    // Get vehicle's assigned stock location
    const vehicleStockLocation = await StockLocation.findOne({
      _id: vehicle.stockLocationId,
      agencyId: req.user.agencyId,
    });

    if (!vehicleStockLocation) {
      return res.status(404).json({
        success: false,
        message: "Vehicle has no assigned stock location",
      });
    }

    // Execute stock movement
    const result = await executeStockMovement({
      agencyId: req.user.agencyId,
      sourceLocationId,
      destinationLocationId: vehicle.stockLocationId,
      transactionType: "VEHICLE_ISSUE",
      lines,
      createdBy: req.user._id,
      meta: {
        driverName,
        driverPhone,
        driverUserId,
        tripNumber,
        remarks,
      },
      allowOverdraft,
    });

    res.status(201).json({
      success: true,
      message: "Stock issued to vehicle successfully",
      data: {
        transaction: result.transaction,
        warnings: result.warnings,
      },
    });
  } catch (error) {
    console.error("Issue Stock to Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 7. Vehicle return + settlement: POST /inventory/stock/settle/:transactionId
const settleVehicleReturn = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { lines, cashActual } = req.body;

    if (!lines || lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: lines array",
      });
    }

    // Find original VEHICLE_ISSUE transaction
    const originalTransaction = await LocationStockTransaction.findOne({
      _id: transactionId,
      agencyId: req.user.agencyId,
      transactionType: "VEHICLE_ISSUE",
      status: "CONFIRMED",
    });

    if (!originalTransaction) {
      return res.status(404).json({
        success: false,
        message: "Original vehicle issue transaction not found",
      });
    }

    let totalCashExpected = 0;
    const settlementTransactions = [];

    // Process each line item return
    for (const line of lines) {
      const { agencyProductId, filledReturned = 0, emptyReturned = 0 } = line;

      // Find the original line to get pricing
      const originalLine = originalTransaction.lines.find(
        (l) => l.agencyProductId.toString() === agencyProductId.toString(),
      );

      if (!originalLine) {
        return res.status(400).json({
          success: false,
          message: `Product ${agencyProductId} not found in original issue`,
        });
      }

      // Calculate cash expected: (quantityIssued - filledReturned) * unitPrice
      const filledSold = originalLine.quantity - filledReturned;
      const cashForThisLine = filledSold * originalLine.unitPrice;
      totalCashExpected += cashForThisLine;

      // Process VEHICLE_RETURN (filled back to godown)
      if (filledReturned > 0) {
        await executeStockMovement({
          agencyId: req.user.agencyId,
          sourceLocationId: originalTransaction.destinationLocationId, // vehicle location
          destinationLocationId: originalTransaction.sourceLocationId, // original godown
          transactionType: "VEHICLE_RETURN",
          lines: [
            {
              agencyProductId,
              stockField: "filled",
              quantity: filledReturned,
              unitPrice: originalLine.unitPrice,
              productLabel: originalLine.productLabel,
            },
          ],
          createdBy: req.user._id,
          meta: {
            remarks: `Return settlement for issue ${originalTransaction.referenceNumber}`,
            parentTransactionId: transactionId,
          },
        });
      }

      // Process EMPTY_RETURN (empties back to godown)
      if (emptyReturned > 0) {
        await executeStockMovement({
          agencyId: req.user.agencyId,
          sourceLocationId: originalTransaction.destinationLocationId, // vehicle location
          destinationLocationId: originalTransaction.sourceLocationId, // original godown
          transactionType: "EMPTY_RETURN",
          lines: [
            {
              agencyProductId,
              stockField: "empty",
              quantity: emptyReturned,
              unitPrice: 0,
              productLabel: originalLine.productLabel,
            },
          ],
          createdBy: req.user._id,
          meta: {
            remarks: `Empty return for issue ${originalTransaction.referenceNumber}`,
            parentTransactionId: transactionId,
          },
        });
      }
    }

    // Calculate cash shortage/excess
    const cashShortage = cashActual !== null ? Math.max(0, totalCashExpected - cashActual) : 0;
    const cashExcess = cashActual !== null ? Math.max(0, cashActual - totalCashExpected) : 0;

    // Update original transaction with settlement details
    originalTransaction.cashExpected = totalCashExpected;
    originalTransaction.cashActual = cashActual;
    originalTransaction.cashShortage = cashShortage;
    originalTransaction.cashExcess = cashExcess;
    await originalTransaction.save();

    res.status(200).json({
      success: true,
      message: "Vehicle settlement completed successfully",
      data: {
        referenceNumber: originalTransaction.referenceNumber,
        cashExpected: totalCashExpected,
        cashActual,
        cashShortage,
        cashExcess,
      },
    });
  } catch (error) {
    console.error("Vehicle Settlement Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 8. List open vehicle issues: GET /inventory/stock/open
const getOpenVehicleIssues = async (req, res) => {
  try {
    const { vehicleId } = req.query;

    const filter = {
      agencyId: req.user.agencyId,
      transactionType: "VEHICLE_ISSUE",
      status: "CONFIRMED",
    };

    if (vehicleId) {
      // Need to find transactions where destinationLocationId matches vehicle's location
      const vehicle = await Vehicle.findOne({
        _id: vehicleId,
        agencyId: req.user.agencyId,
      });

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      filter.destinationLocationId = vehicle.stockLocationId;
    }

    const transactions = await LocationStockTransaction.find(filter)
      .populate("sourceLocationId", "name locationType")
      .populate("destinationLocationId", "name locationType")
      .populate("lines.agencyProductId")
      .sort({ transactionDate: -1 });

    res.status(200).json({
      success: true,
      message: "Open vehicle issues retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    console.error("Get Open Issues Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 9. Transaction history: GET /inventory/stock/transactions
const getStockTransactions = async (req, res) => {
  try {
    const { transactionType, locationId, dateFrom, dateTo, status = "CONFIRMED", page = 1, limit = 20 } = req.query;

    const filter = {
      agencyId: req.user.agencyId,
    };

    if (transactionType) {
      filter.transactionType = transactionType;
    }

    if (status) {
      filter.status = status;
    }

    if (locationId) {
      filter.$or = [{ sourceLocationId: locationId }, { destinationLocationId: locationId }];
    }

    if (dateFrom || dateTo) {
      filter.transactionDate = {};
      if (dateFrom) {
        filter.transactionDate.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.transactionDate.$lte = new Date(dateTo);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await LocationStockTransaction.countDocuments(filter);
    const transactions = await LocationStockTransaction.find(filter)
      .populate("sourceLocationId", "name locationType")
      .populate("destinationLocationId", "name locationType")
      .populate("lines.agencyProductId", "localName itemCode")
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Transaction history retrieved successfully",
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 10. Location stock balance: GET /inventory/stock/location/:locationId
const getLocationStockBalance = async (req, res) => {
  try {
    const { locationId } = req.params;

    // Verify location belongs to agency
    const location = await StockLocation.findOne({
      _id: locationId,
      agencyId: req.user.agencyId,
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Stock location not found for this agency",
      });
    }

    // Get all stock ledger entries for this location
    const ledgers = await StockLedger.find({
      agencyId: req.user.agencyId,
      locationId,
    }).populate({
      path: "agencyProductId",
      select: "localName itemCode globalProductId stock",
      populate: {
        path: "globalProductId",
        select: "name productCode capacityKg",
      },
    });

    res.status(200).json({
      success: true,
      message: "Location stock balance retrieved successfully",
      data: {
        location: {
          _id: location._id,
          name: location.name,
          locationType: location.locationType,
        },
        ledgers,
      },
    });
  } catch (error) {
    console.error("Get Location Stock Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Add Stock to Godown (Admin/Manager function)
const addStockToGodown = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { locationId, agencyProductId, quantities, notes } = req.body;

    if (!locationId || !agencyProductId || !quantities) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: locationId, agencyProductId, quantities",
      });
    }

    // Validate location exists
    const location = await StockLocation.findOne({
      _id: locationId,
      agencyId: req.user.agencyId,
    }).session(session);

    if (!location) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Stock location not found",
      });
    }

    // Validate agency product exists
    const agencyProduct = await AgencyProduct.findOne({
      _id: agencyProductId,
      agencyId: req.user.agencyId,
    }).session(session);

    if (!agencyProduct) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Product not found for this agency",
      });
    }

    // Find or create StockLedger
    let ledger = await StockLedger.findOne({
      agencyId: req.user.agencyId,
      agencyProductId,
      locationId,
    }).session(session);

    if (!ledger) {
      ledger = new StockLedger({
        agencyId: req.user.agencyId,
        agencyProductId,
        locationId,
        stock: {
          filled: quantities.filled || 0,
          empty: quantities.empty || 0,
          defective: quantities.defective || 0,
          sound: quantities.sound || 0,
          defectivePR: quantities.defectivePR || 0,
          quantity:
            (quantities.filled || 0) +
            (quantities.empty || 0) +
            (quantities.defective || 0) +
            (quantities.sound || 0) +
            (quantities.defectivePR || 0),
        },
        lastMovementAt: new Date(),
      });
    } else {
      // Update existing ledger
      ledger.stock.filled = (ledger.stock.filled || 0) + (quantities.filled || 0);
      ledger.stock.empty = (ledger.stock.empty || 0) + (quantities.empty || 0);
      ledger.stock.defective = (ledger.stock.defective || 0) + (quantities.defective || 0);
      ledger.stock.sound = (ledger.stock.sound || 0) + (quantities.sound || 0);
      ledger.stock.defectivePR = (ledger.stock.defectivePR || 0) + (quantities.defectivePR || 0);
      ledger.stock.quantity =
        ledger.stock.filled +
        ledger.stock.empty +
        ledger.stock.defective +
        ledger.stock.sound +
        ledger.stock.defectivePR;
      ledger.lastMovementAt = new Date();
    }

    await ledger.save({ session });

    // Create transaction record
    const transaction = new LocationStockTransaction({
      agencyId: req.user.agencyId,
      transactionType: "STOCK_ADJUSTMENT", // Or PURCHASE if using a supplier
      sourceLocationId: null, // Null for new stock
      destinationLocationId: locationId,
      transactionDate: new Date(),
      lines: [
        {
          agencyProductId,
          filled: quantities.filled || 0,
          empty: quantities.empty || 0,
          defective: quantities.defective || 0,
          sound: quantities.sound || 0,
          defectivePR: quantities.defectivePR || 0,
          quantity:
            (quantities.filled || 0) +
            (quantities.empty || 0) +
            (quantities.defective || 0) +
            (quantities.sound || 0) +
            (quantities.defectivePR || 0),
        },
      ],
      referenceNumber: `ADJ-${Date.now()}`,
      status: "COMPLETED",
      remarks: notes || "Stock added to godown",
      createdBy: req.user._id,
    });

    await transaction.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Stock added to godown successfully",
      data: {
        ledger,
        transaction,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Add Stock to Godown Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = {
  createPlantPurchase,
  dispatchEmptyToPlant,
  getLiveStock,
  processRefillDelivery,
  getCylinderProducts,
  issueStockToVehicle,
  settleVehicleReturn,
  getOpenVehicleIssues,
  getStockTransactions,
  getLocationStockBalance,
  addStockToGodown,
};
