// Create file: backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

// Middleware to protect routes - verifies token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res
        .status(401)
        .json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user from decoded token
    const user = await userModel.getUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

// Middleware to verify product ownership for admins
exports.isProductOwner = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await knex('products').where({ id: productId }).first();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to modify this product' });
    }

    next();
  } catch (error) {
    console.error('Product ownership check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
