const { createKYCPDF } = require("../controllers/pdfController");

const router = require("express").Router();

const { authenticate } = require("../middlewares/authMiddleware");

router.post("/kyc", authenticate, createKYCPDF);

module.exports = router;
