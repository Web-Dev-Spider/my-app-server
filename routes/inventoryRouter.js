const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const supplierController = require("../controllers/supplierController");
const productController = require("../controllers/productController");
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

module.exports = router;
