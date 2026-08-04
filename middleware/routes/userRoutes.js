const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  addUser,
  getUserById,
} = require("../controllers/userController");

router.get("/", getAllUsers);
router.post("/", addUser);
router.get("/:id", getUserById);

module.exports = router;