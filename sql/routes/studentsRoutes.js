const express = require('express');
const studentController = require('../controller/studentController');
const router = express.Router();

router.post('/add',studentController.addEntries)
router.get('/getStd/:id',studentController.getStudentsById)
router.put('/update/:id',studentController.updateEntry)
router.delete('/delete/:id',studentController.deleteEntry);

module.exports = router;