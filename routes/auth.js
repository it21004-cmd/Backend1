const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationCode } = require('../utils/emailService');
const router = express.Router();

// Generate 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ REGISTRATION WITH VERIFICATION - FIXED
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log('🟢 Registration attempt:', { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (!email.endsWith('@mbstu.ac.bd')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only MBSTU email (@mbstu.ac.bd) is allowed!' 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists! Please login.' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationCode,
      codeExpires,
      isVerified: false
    });

    await user.save();
    console.log('✅ User registered (unverified):', email);

    // Send verification email
    const emailSent = await sendVerificationCode(email, verificationCode);
    
    // ✅ FIXED: Always return needsVerification: true
    res.status(201).json({ 
      success: true,
      message: 'Registration successful! Verification code sent to your email.',
      email: email,
      needsVerification: true  // ✅ এই লাইন সবসময় থাকবে
    });
    
  } catch (error) {
    console.error('🔴 Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed: ' + error.message 
    });
  }
});

// ✅ VERIFY EMAIL WITH CODE - FIXED
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    console.log('🟢 Verification attempt:', { email, code });

    // ✅ FIXED: First find user by email only
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('🔴 User not found:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Email not found. Please register again.' 
      });
    }

    // ✅ FIXED: Then check verification code
    if (user.verificationCode !== code) {
      console.log('🔴 Invalid code for:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid verification code' 
      });
    }

    // ✅ FIXED: Check if code expired
    if (user.codeExpires < new Date()) {
      console.log('🔴 Code expired for:', email);
      return res.status(400).json({ 
        success: false,
        message: 'Verification code expired. Please request a new one.' 
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.verificationCode = undefined;
    user.codeExpires = undefined;
    await user.save();

    console.log('✅ Email verified successfully for:', email);

    res.json({
      success: true,
      message: 'Email verified successfully! Your account is now active.'
    });

  } catch (error) {
    console.log('❌ Verification error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during verification: ' + error.message 
    });
  }
});

// ✅ RESEND VERIFICATION CODE - FIXED
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🟢 Resend code request for:', email);

    // ✅ FIXED: Find user by email (verified or not)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Email not found. Please register again.' 
      });
    }

    // Generate new code
    const verificationCode = generateVerificationCode();
    const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.codeExpires = codeExpires;
    await user.save();

    // Send new code
    const emailSent = await sendVerificationCode(email, verificationCode);

    if (emailSent) {
      console.log('✅ New code sent to:', email);
      res.json({
        success: true,
        message: 'New verification code sent to your email!'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }

  } catch (error) {
    console.log('❌ Resend code error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

// ✅ LOGIN - FIXED
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🟢 Login attempt for:', email);

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please verify your email first. Check your inbox for verification code.' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({ 
      success: true,
      message: 'Login successful!',
      token: token,
      user: { 
        id: user._id,
        name: user.name, 
        email: user.email
      }
    });

  } catch (error) {
    console.error('🔴 Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed: ' + error.message 
    });
  }
});

module.exports = router;