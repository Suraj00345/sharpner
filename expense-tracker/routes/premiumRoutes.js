const express = require("express");
const router = express.Router();
const userAuth = require("../middleware/userAuth");

const { getLeaderboard } = require("../controllers/premiumController");

router.get("/leaderboard", userAuth, getLeaderboard);

module.exports = router;
