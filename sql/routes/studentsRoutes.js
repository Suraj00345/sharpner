const express = require('express');
const studentController = require('../controller/studentController');
const router = express.Router();

router.post('/add',studentController.addEntries)
router.put('/update/:id',studentController.updateEntry)
router.delete('/delete/:id',studentController.deleteEntry);

module.exports = router;