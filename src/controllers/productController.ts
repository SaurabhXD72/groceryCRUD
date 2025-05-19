// Create file: backend/controllers/productController.js
const productModel = require('../models/productModel');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await productModel.getProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get products by admin
exports.getProductsByAdmin = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const products = await productModel.getProductsByAdmin(adminId);
    res.json(products);
  } catch (error) {
    console.error('Get products by admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, image_url } = req.body;
    
    // Validate request
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
    
    // Add the current user (admin) as creator
    const productData = {
      name,
      description,
      price,
      image_url,
      created_by: req.user.id
    };
    
    const product = await productModel.createProduct(productData);
    res.status(201).json(product[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, image_url } = req.body;
    
    // Validate request
    if (!name && !description && !price && !image_url) {
      return res.status(400).json({ message: 'Please provide at least one field to update' });
    }
    
    // Create update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (image_url) updateData.image_url = image_url;
    
    const product = await productModel.updateProduct(productId, updateData);
    
    if (!product || product.length === 0) {
      return res.status(404).json({ message: 'Product not found or update failed' });
    }
    
    res.json(product[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const deleted = await productModel.deleteProduct(productId);
    
    if (deleted === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};