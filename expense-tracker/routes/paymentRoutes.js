const express = require("express");

const {
  createCashfreeOrder,
  verifyCashfreePayment,
} = require("../controllers/paymentController");
const router = express.Router();
router.post("/create-order", createCashfreeOrder);
router.post("/verify-payment", verifyCashfreePayment);

module.exports = router;
