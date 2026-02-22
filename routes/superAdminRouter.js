const express = require("express");
const router = express.Router();
const superAdminController = require("../controllers/superAdminController");
const { authenticate } = require("../middlewares/authMiddleware");

// Protect all super-admin routes
router.use(authenticate);

// Agency Management
router.get("/agency/:agencyId", superAdminController.getAgencyDetails);
router.delete("/agency/:agencyId", superAdminController.deleteAgency);

module.exports = router;
