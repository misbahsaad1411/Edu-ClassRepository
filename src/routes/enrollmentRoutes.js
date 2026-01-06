const express = require('express');
const enrollmentController = require('../controllers/enrollmentController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, enrollmentController.getUserEnrollments);
router.post('/', auth, enrollmentController.enrollCourse);
router.delete('/:courseId', auth, enrollmentController.unenrollCourse);

module.exports = router;
