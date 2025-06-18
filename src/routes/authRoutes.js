const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Rotte pubbliche
router.post('/register', register);
router.post('/login', login);

// Rotte protette
router.get('/profile', authenticate, getProfile);

module.exports = router;
