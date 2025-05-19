// Create file: backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const { authenticate, isAdmin } = require('../middleware/authMiddleware');

// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (admin or same user)
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is admin or the same user
    if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const user = await userModel.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;