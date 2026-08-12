// routes/busRoutes.js
const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');

router.post('/buses', busController.createBus);
router.get('/buses/:id/bookings', busController.getBusBookings);

module.exports = router;