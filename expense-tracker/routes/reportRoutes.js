const express = require("express");
const router = express.Router();
const { downloadPDFReport } = require("../controllers/reportController");
const userAuth = require("../middleware/userAuth");

router.get("/downloadPdf", userAuth, downloadPDFReport);

module.exports = router;
