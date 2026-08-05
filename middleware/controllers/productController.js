const productService = require('../services/productService')
const path = require("path");
// Fetch all products
const getAllProducts = (req, res) => {
  // const result = productService.getAllProducts();
  // res.send(result);
  console.log('Fetching all products');
  res.sendFile(path.join(__dirname, "..", "view", "products.html"));
};

const getProductById = (req, res) => {
  const result = productService.getProductById(req.params.id);
  res.send(result);
};

const addProduct = (req, res) => {
  const result = productService.addProduct();
  res.send(result);
};


module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
};