const express = require('express');
const { registerUser, loginUser, getCurrentUser, logOutUser, getUserAddresses, addUserAddress } = require('../controllers/auth.controller');
const {authMiddleware} = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', authMiddleware, getCurrentUser);
router.get('/logout', logOutUser);

router.get('/users/me/addresses', authMiddleware, getUserAddresses);
router.post('/users/me/addresses', authMiddleware, addUserAddress);
router.delete('/users/me/addresses/:addressId', authMiddleware, require('../controllers/auth.controller').deleteUserAddress);

module.exports = router;    
