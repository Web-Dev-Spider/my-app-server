const express = require("express");
const { getStats, getAllAgencies, toggleAgencyStatus, getAgencyDetails, updateAgencyDetails, createUser, getAgencyUsers, updateUser, deleteUser, toggleUserStatus, getAgencyStats } = require("../controllers/adminController");
const { authenticate } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/stats", authenticate, checkRole("SUPER_ADMIN"), getStats);
router.get("/agencies", authenticate, checkRole("SUPER_ADMIN"), getAllAgencies);
router.put("/agency/:id/status", authenticate, checkRole("SUPER_ADMIN"), toggleAgencyStatus);
router.post("/create-user", authenticate, checkRole("ADMIN"), createUser);
router.get("/users", authenticate, checkRole("ADMIN"), getAgencyUsers);
router.get("/agency-stats", authenticate, checkRole("ADMIN"), getAgencyStats);
router.get("/my-agency", authenticate, checkRole("ADMIN"), getAgencyDetails);
router.put("/my-agency", authenticate, checkRole("ADMIN"), updateAgencyDetails);
router.put("/user/:id", authenticate, checkRole("ADMIN"), updateUser);
router.put("/user/:id/status", authenticate, checkRole("ADMIN"), toggleUserStatus);
router.delete("/user/:id", authenticate, checkRole("ADMIN"), deleteUser);

const {
    createGlobalProduct,
    getGlobalProducts,
    updateGlobalProduct,
    deleteGlobalProduct,
    getCategories,
    createCategory
} = require("../controllers/globalProductController");

// Global Product Management (Super Admin)
router.post("/global-product", authenticate, checkRole("SUPER_ADMIN"), createGlobalProduct);
router.get("/global-products", authenticate, checkRole("SUPER_ADMIN"), getGlobalProducts);
router.put("/global-product/:id", authenticate, checkRole("SUPER_ADMIN"), updateGlobalProduct);
router.delete("/global-product/:id", authenticate, checkRole("SUPER_ADMIN"), deleteGlobalProduct);

// Category Management
router.get("/product-categories", authenticate, checkRole("SUPER_ADMIN"), getCategories);
router.post("/product-category", authenticate, checkRole("SUPER_ADMIN"), createCategory);

module.exports = router;
