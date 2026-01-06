const express = require('express');
const courseController = require('../controllers/courseController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.post('/', auth, adminOnly, courseController.createCourse);
router.put('/:id', auth, adminOnly, courseController.updateCourse);
router.delete('/:id', auth, adminOnly, courseController.deleteCourse);

module.exports = router;
