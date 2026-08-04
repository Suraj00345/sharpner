const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  addProduct,
} = require("../controllers/productController");

// GET /products
router.get("/", getAllProducts);

// GET /products/:id
router.get("/:id", getProductById);

// POST /products
router.post("/", addProduct);

module.exports = router;