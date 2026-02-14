const express = require("express");
const { getStats, getAllAgencies, toggleAgencyStatus } = require("../controllers/adminController");
const { authenticate } = require("../middlewares/authMiddleware");
const checkRole = require("../middlewares/roleMiddleware");

const router = express.Router();

router.get("/stats", authenticate, checkRole("SUPER_ADMIN"), getStats);
router.get("/agencies", authenticate, checkRole("SUPER_ADMIN"), getAllAgencies);
router.put("/agency/:id/status", authenticate, checkRole("SUPER_ADMIN"), toggleAgencyStatus);
router.post("/create-user", authenticate, checkRole("ADMIN"), require("../controllers/adminController").createUser);
router.get("/users", authenticate, checkRole("ADMIN"), require("../controllers/adminController").getAgencyUsers);

module.exports = router;
