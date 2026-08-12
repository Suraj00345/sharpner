const express = require("express");
const courseController = require("../Controller/CourseController");
const router = express.Router();

router.post("/addcourses", courseController.addCourses);
router.get("/addStudentCourses", courseController.addStudentsToCourses);

module.exports = router;
