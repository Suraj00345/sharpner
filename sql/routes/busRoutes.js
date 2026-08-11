const express = require("express");
const busController = require("../controller/busController");
const router = express.Router();

router.post("/users", busController.addUser);
router.get("/users", busController.getUser);
router.post("/addBuses", busController.addBuses);
router.get("/getBuses", busController.getBuses);
router.get("/available/:seats", busController.getBusesBySeats);

module.exports = router;
