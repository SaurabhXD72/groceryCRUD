// Create file: backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin, isProductOwner } = require('../middleware/authMiddleware');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);
router.get('/admin/:adminId', productController.getProductsByAdmin);

// Protected routes (admin only)
router.post('/', authenticate, isAdmin, productController.createProduct);
router.put('/:id', authenticate, isAdmin, isProductOwner, productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, isProductOwner, productController.deleteProduct);

module.exports = router;