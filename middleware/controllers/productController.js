const productService = require('../services/productService')
// Fetch all products
const getAllProducts = (req, res) => {
  const result = productService.getAllProducts();
  res.send(result);
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