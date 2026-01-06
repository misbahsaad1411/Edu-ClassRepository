const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify/:token', authController.verifyEmail); // New Route

// TEMPORARY: Route to create admin directly for troubleshooting
router.get('/create-admin-direct', authController.createAdminDirect);

module.exports = router;