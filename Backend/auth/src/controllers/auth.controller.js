const userModel = require('../models/user.model');
const { registerUserValidator } = require('../validator/validator');


const registerUser = async (req, res) => {
    try {
        const { username, password, email, fullName:{firstName, lastName}, phone } = req.body;


    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}