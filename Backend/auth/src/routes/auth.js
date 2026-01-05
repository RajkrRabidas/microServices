const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName, phone } = req.body;
    if (!username || !email || !fullName || !fullName.firstName || !fullName.lastName || !phone) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'User with given email or username already exists' });
    }

    const hashed = password ? await bcrypt.hash(password, 10) : undefined;

    const user = new User({
      username,
      email,
      password: hashed,
      fullName,
      phone
    });

    await user.save();

    const sanitized = user.toObject();
    delete sanitized.password;

    res.status(201).json({ user: sanitized });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
