// Fetch all products
const getAllProducts = (req, res) => {
  res.send("Fetching all products");
};

// Fetch product by ID
const getProductById = (req, res) => {
  res.send(`Fetching product with ID: ${req.params.id}`);
};

// Add a new product
const addProduct = (req, res) => {
  res.send("Adding a new product");
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
};