const getAllProducts = () => {
  return "Fetching all products";
};

const getProductById = (id) => {
  return `Fetching product with ID: ${id}`;
};

const addProduct = () => {
  return "Adding a new product";
};

module.exports = {
  getAllProducts,
  getProductById,
  addProduct,
};