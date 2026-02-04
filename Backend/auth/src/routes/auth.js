const express = require('express');
const { registerUser, loginUser, getCurrentUser, logOutUser } = require('../controllers/auth.controller');
const {authMiddleware} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/logout', logOutUser);

module.exports = router;    
