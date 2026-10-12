import bcrypt from 'bcryptjs';
import { storage } from '../data/dbStorage.js';
import { generateToken } from '../utils/jwt.js';
import mongoose from 'mongoose';

export async function healthCheck(req, res) {
  const isMongoLive = mongoose.connection.readyState === 1;
  res.json({
    status: 'UP',
    service: 'Student Attendance & Performance Monitoring Backend (MERN)',
    database: isMongoLive
      ? `MongoDB Atlas Active (${mongoose.connection.host})`
      : 'Persistent File Engine Active (db.json)',
    time: new Date().toISOString(),
  });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = storage.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No account found with this email address.',
      });
    }

    // Compare with bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your credentials and try again.',
      });
    }

    const token = generateToken(user);

    // Strip password from returned user object
    const userSafe = { ...user };
    delete userSafe.password;

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: userSafe,
    });
  } catch (error) {
    console.error('[authController:login] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
}

export async function getMe(req, res) {
  try {
    const user = storage.findUserById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const safeUser = { ...user };
    delete safeUser.password;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving user.' });
  }
}

export async function logout(req, res) {
  res.json({
    success: true,
    message: 'User logged out successfully.',
  });
}
