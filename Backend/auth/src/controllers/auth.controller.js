const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerUserSchema, loginUserSchema} = require('../validator/validator');


const registerUser = async (req, res) => {
    try {
        const userValidator = registerUserSchema.safeParse(req.body);       

        if (userValidator.error) {
            return res.status(400).json({ message: userValidator.error.issues[0].message });
        }

        const { username, password, email, phone, fullName:{firstName, lastName} } = userValidator.data;

        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            password: hashedPassword,
            email,
            phone,
            fullName:{firstName, lastName},
        });

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        })

        res.status(201).json({ message: 'User registered successfully', user:{
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            addresses: user.addresses,
        }});

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const loginUser = async (req, res) => {
    try {
        const loginValidator = loginUserSchema.safeParse(req.body);

        if (loginValidator.error) {
            return res.status(400).json({ message: loginValidator.error.issues[0].message });
        }

        const { username, email, password } = loginValidator.data;

        const user = await userModel.findOne({ $or: [{ username }, { email }] }).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
        }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.status(200).json({ message: 'Login successful', user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            addresses: user.addresses,
        }});

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const getCurrentUser = async (req, res) => {

   return res.status(200).json({ 
    message: 'Current user fetched successfully',
    user: req.user });
}


module.exports = {
    registerUser,
    loginUser,
    getCurrentUser
};