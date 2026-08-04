const express = require("express");
const router = express.Router();

const {
  getCartForUser,
  addProductToCart,
} = require("../controllers/cartController");

router.get("/:userId", getCartForUser);
router.post("/:userId", addProductToCart);

module.exports = router;