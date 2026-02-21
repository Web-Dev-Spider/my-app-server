const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const supplierController = require("../controllers/supplierController");
const productController = require("../controllers/productController");
const vehicleController = require("../controllers/vehicleController");
const stockLocationController = require("../controllers/stockLocationController");
const { authenticate } = require("../middlewares/authMiddleware");

// Ensure routes are protected
router.use(authenticate);

// Suppliers
router.post("/supplier", supplierController.createSupplier);
router.get("/suppliers", supplierController.getSuppliers);
router.put("/supplier/:id", supplierController.updateSupplier);
router.put("/supplier/:id/status", supplierController.toggleSupplierStatus);
router.delete("/supplier/:id", supplierController.deleteSupplier);

// Products
router.post("/product", productController.createProduct);
router.get("/products", productController.getProducts);
router.get("/products/unmapped", productController.getUnmappedGlobalProducts);
router.post("/product/map", productController.mapGlobalProduct);
router.put("/product/:id", productController.updateProduct);
router.put("/product/:id/status", productController.toggleProductStatus);
router.delete("/product/:id", productController.deleteProduct);

// Cylinder Vouchers
router.post("/plant/receipt", inventoryController.createPlantPurchase);
router.post("/plant/dispatch/empty", inventoryController.dispatchEmptyToPlant);
router.post("/customer/refill", inventoryController.processRefillDelivery);

// Stock
router.get("/stock/live", inventoryController.getLiveStock);
// router.get("/products", inventoryController.getCylinderProducts); // Overwritten by new product route above

// Vehicles
router.post("/vehicle", vehicleController.createVehicle);
router.get("/vehicles", vehicleController.getVehicles);
router.get("/vehicle/:id", vehicleController.getVehicle);
router.put("/vehicle/:id", vehicleController.updateVehicle);
router.put("/vehicle/:id/status", vehicleController.toggleVehicleStatus);
router.delete("/vehicle/:id", vehicleController.deleteVehicle);

// Compliance Notifications
router.get("/compliance-notifications", vehicleController.getComplianceNotifications);
router.put("/compliance-notifications/mark-read", vehicleController.markNotificationsRead);

// Stock Locations
router.post("/stock-location", stockLocationController.createStockLocation);
router.post("/stock-locations", stockLocationController.createStockLocation);
router.get("/stock-locations", stockLocationController.getStockLocations);
router.get("/stock-location/:id", stockLocationController.getStockLocation);
router.put("/stock-location/:id", stockLocationController.updateStockLocation);
router.put("/stock-locations/:id", stockLocationController.updateStockLocation);
router.get("/stock-location/:id/stock", stockLocationController.getLocationStock);

// Stock Movement (Phase 2)
router.post("/stock/issue", inventoryController.issueStockToVehicle);
router.post("/stock/settle/:transactionId", inventoryController.settleVehicleReturn);
router.get("/stock/open", inventoryController.getOpenVehicleIssues);
router.get("/stock/transactions", inventoryController.getStockTransactions);
router.get("/stock/location/:locationId", inventoryController.getLocationStockBalance);
router.post("/stock/add-to-godown", inventoryController.addStockToGodown);

module.exports = router;
