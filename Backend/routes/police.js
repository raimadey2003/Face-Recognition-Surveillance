import express from 'express';
import jwt from 'jsonwebtoken';
import Police from '../models/Police.js';

const router = express.Router();

// Registration Route
router.post('/register', async (req, res) => {
  try {
    const { badgeNumber, station, password } = req.body;

    // Check if officer already exists
    const existing = await Police.findOne({ badgeNumber });
    if (existing) {
      return res.status(400).json({ message: 'Police officer already registered' });
    }

    // Create new police officer (password will be hashed automatically by pre-save hook)
    const newPolice = new Police({ badgeNumber, station, password });
    await newPolice.save();

    res.status(201).json({ message: 'Registration successful! Please wait for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { badgeNumber, station, password } = req.body;

    const police = await Police.findOne({ badgeNumber, station });
    if (!police) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password using model method
    const isMatch = await police.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: police._id, badgeNumber: police.badgeNumber, station: police.station },
      process.env.JWT_SECRET || 'secretkey',
      { expiresIn: '1d' }
    );

    res.json({ token, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
