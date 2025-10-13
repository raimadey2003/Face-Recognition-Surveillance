import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /api/users/register
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      address,
      dateOfBirth,
      emergencyContact,
      emergencyPhone,
      password
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = new User({
      fullName,
      email,
      phone,
      address,
      dateOfBirth,
      emergencyContact,
      emergencyPhone,
      password
    });

    await newUser.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // You can generate a JWT here if needed, for now just sending success
    res.json({ message: 'Login successful', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
