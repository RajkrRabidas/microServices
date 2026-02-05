const userModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {registerUserSchema, loginUserSchema, addUserAddressValidator} = require('../validator/validator');
const redis = require('../db/redis');


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

const logOutUser = async (req, res) => {
    const token = req.cookies.token;

    if (token) {
        try {
            await redis.set(`blacklist:${token}`, 'true', 'EX',24 * 60 * 60); // Blacklist for 1 day
        } catch (err) {
            console.warn('Redis unavailable, skipping token blacklist:', err && err.message);
        }
    }

    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
    });

    return res.status(200).json({ message: 'Logged out successfully' });
}

const getUserAddresses = async (req, res) => {
    const id = req.user.id;

    const user = await userModel.findById(id).select('addresses');

    if(!user){
        return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
        message: 'User addresses fetched successfully',
        addresses: user.addresses
    });
}

const addUserAddress = async (req, res) => {
    const id = req.user.id;

    const addressValidator = addUserAddressValidator.safeParse(req.body);
    if (addressValidator.error) {
        return res.status(400).json({ message: addressValidator.error.issues[0].message });
    }

    const {street, city, state, pincode, country, isDefault} = addressValidator.data;

    const user = await userModel.findOneAndUpdate(
        { _id: id },
        { $push: { addresses: { street, city, state, pincode, country, isDefault } } },
        { new: true }
    );
    if(!user){
        return res.status(404).json({ message: 'User not found' });
    }

    return res.status(201).json({
        message: 'Address added successfully',
        address: user.addresses[user.addresses.length - 1],
        defaultAddressId: isDefault ? user.addresses[user.addresses.length - 1]._id : undefined,
    });
}

const deleteUserAddress = async (req, res) => {
    const id = req.user.id;
    const { addressId } = req.params;

    const user = await userModel.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const idx = user.addresses.findIndex(a => a._id.toString() === addressId);
    if (idx === -1) {
        return res.status(404).json({ message: 'Address not found' });
    }

    user.addresses.splice(idx, 1);
    await user.save();

    return res.status(200).json({ message: 'Address deleted', addresses: user.addresses });
}

module.exports = {
    registerUser,
    loginUser,
    getCurrentUser,
    logOutUser,
    getUserAddresses,
    addUserAddress
    ,
    deleteUserAddress
};