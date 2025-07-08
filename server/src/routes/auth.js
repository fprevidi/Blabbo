const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Initialize Twilio client
const client = process.env.NODE_ENV === 'production'
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;


// Generate OTP
const generateOTP = () => {
   const otp = Math.floor(100000 + Math.random() * 900000).toString();
   console.log(`[DEV MODE] OTP generato per ${otp}`);
  return otp;
};

// Send OTP
router.post('/send-otp', [
  body('phoneNumber').isMobilePhone().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { phoneNumber } = req.body;
    phoneNumber = phoneNumber.replace(/^@/, '');

    const otp = generateOTP() ;
    console.log('OTP GENERATO' + otp)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Find or create user
    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({
        phoneNumber,
        name: phoneNumber, // Will be set during registration
        isVerified: false,
      });
    }

    user.otp = {
      code: otp,
      expiresAt,
    };

try {
  console.log('inizio salvataggio');
  await user.save();
  console.log('passato salvataggio')
} catch (err) {
  console.log(err);
  console.error('Errore salvataggio user:', err);
}


    // Send OTP via Twilio (in production)
    if (process.env.NODE_ENV === 'production') {
      await client.messages.create({
        body: `Your Blabbo verification code is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
    }

    // In development, log the OTP
    if (process.env.NODE_ENV === 'development') {
   console.log(`[DEV MODE] OTP generato for ${phoneNumber}: ${otp}`);

    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('phoneNumber').isMobilePhone(),
  body('otp').isLength({ min: 6, max: 6 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { phoneNumber, otp } = req.body;
phoneNumber = phoneNumber.replace(/^@/, '');


    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.otp || user.otp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Mark user as verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Register user
router.post('/register', [
  body('phoneNumber').isMobilePhone(),
  body('name').isLength({ min: 1, max: 50 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phoneNumber, name, avatar } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user || !user.isVerified) {
      return res.status(400).json({ message: 'Please verify your phone number first' });
    }

    // Update user with registration data
    user.name = name;
    if (avatar) user.avatar = avatar;
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        avatar: user.avatar,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-otp');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      avatar: user.avatar,
      about: user.about,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;