const getAllUsers = (req, res) => {
  res.send("Fetching all users");
};

const addUser = (req, res) => {
  res.send("Adding a new user");
};

const getUserById = (req, res) => {
  res.send(`Fetching user with ID: ${req.params.id}`);
};

module.exports = {
  getAllUsers,
  addUser,
  getUserById,
};