const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.post('/players', playerController.addPlayer);
router.get('/players/search', playerController.searchPlayer);

module.exports = router;