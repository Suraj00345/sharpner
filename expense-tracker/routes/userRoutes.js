const express = require("express");
const router = express.Router();
const userController = require("../controllers/userRoutes");

router.post("/signup", userController.signup);

module.exports = router;
