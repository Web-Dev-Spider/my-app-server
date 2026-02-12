const { createKYCPDF } = require("../controllers/pdfController");

const router = require("express").Router();

router.post("/kyc", createKYCPDF);

module.exports = router;
