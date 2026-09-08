const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// 1. SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash Password & Generate OTP
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save User
    const newUser = new User({ email, password: hashedPassword, role, otp });
    await newUser.save();

    // Send Verification Email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'VoltSync - Verify your account',
      text: `Welcome to VoltSync! Your OTP is: ${otp}`
    });

    res.status(201).json({ message: "Signup successful. Please check your email for the OTP." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. VERIFY OTP ROUTE
router.post('/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // Update user status
    user.isVerified = true;
    user.otp = undefined; // Clear the OTP
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isVerified) return res.status(403).json({ message: "Please verify your email first." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({ token, role: user.role, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// --- NEW PROFILE ROUTES ---

// Middleware to secure the profile routes
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// GET: Fetch User Profile Data
router.get('/me', verifyToken, async (req, res) => {
  try {
    // .select('-password') ensures we don't accidentally send the password hash to the frontend!
    const user = await User.findById(req.user.userId).select('-password');
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT: Update User Profile Data
router.put('/update', verifyToken, async (req, res) => {
  try {
    const { name, city, evCount } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, city, evCount },
      { new: true }
    ).select('-password');
    
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;