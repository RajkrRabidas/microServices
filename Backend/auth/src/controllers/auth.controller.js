const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const registerUserSchema = require('../validator/validator');


const registerUser = async (req, res) => {
    try {
        const userValidator = registerUserSchema.safeParse(req.body);

        console.log('Validation Result:', userValidator);
        console.log('Request Body:', req.body);         

        if (userValidator.error) {
            return res.status(400).json({ message: userValidator.error.details[0].message });
        }

        const { username, password, email, phone, fullName } = userValidator.data;

        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            username,
            password: hashedPassword,
            email,
            phone,
            fullName,
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });




    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
};