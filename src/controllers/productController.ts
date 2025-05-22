// src/controllers/productController.ts
import { Request, Response } from 'express';
import { 
  createProduct, 
  getProductById, 
  getProducts, 
  getProductsByAdmin,
  updateProduct, 
  deleteProduct,
  getAvailableBrands
} from '../dal/productDal';
import { ProductCreationAttributes, ProductFilter } from '../models/Product';

// Create a new product
export const createNewProduct = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can create products' });
      return;
    }

    const productData = req.body as ProductCreationAttributes;
    
    // Input validation
    if (!productData.name || !productData.brand || !productData.model || !productData.price) {
      res.status(400).json({ message: 'Required fields missing: name, brand, model, and price are mandatory' });
      return;
    }

    // Ensure price is a positive number
    if (productData.price <= 0) {
      res.status(400).json({ message: 'Price must be greater than zero' });
      return;
    }

    // Ensure stockQuantity is non-negative
    if (productData.stockQuantity < 0) {
      res.status(400).json({ message: 'Stock quantity cannot be negative' });
      return;
    }

    // Set the createdBy field to the current user's ID
    productData.createdBy = req.user.userId;
    
    // Ensure valid specifications object
    if (!productData.specifications) {
      productData.specifications = {};
    }
    
    // Ensure valid imageUrls array
    if (!productData.imageUrls) {
      productData.imageUrls = [];
    }

    // Create the product
    const newProduct = await createProduct(productData);
    
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// Get all products (with optional filters)
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const filter: ProductFilter = {};
    
    // Extract filter parameters from query string
    if (req.query.createdBy && typeof req.query.createdBy === 'string') {
      filter.createdBy = parseInt(req.query.createdBy, 10);
    }
    
    if (req.query.adminEmail && typeof req.query.adminEmail === 'string') {
      filter.adminEmail = req.query.adminEmail;
    }
    
    if (req.query.brand && typeof req.query.brand === 'string') {
      filter.brand = req.query.brand;
    }
    
    if (req.query.status && typeof req.query.status === 'string') {
      if (['active', 'inactive', 'deleted'].includes(req.query.status)) {
        filter.status = req.query.status as 'active' | 'inactive' | 'deleted';
      }
    }
    
    if (req.query.minPrice && typeof req.query.minPrice === 'string') {
      filter.minPrice = parseFloat(req.query.minPrice);
    }
    
    if (req.query.maxPrice && typeof req.query.maxPrice === 'string') {
      filter.maxPrice = parseFloat(req.query.maxPrice);
    }
    
    // Set default status filter to 'active' if not specified
    if (!filter.status) {
      filter.status = 'active';
    }
    
    const products = await getProducts(filter);
    
    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
};

// Get product by ID
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = parseInt(req.params.id, 10);
    
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }
    
    const product = await getProductById(productId);
    
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    res.status(200).json({ product });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Error retrieving product' });
  }
};

// Get products by current admin
export const getMyProducts = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    if (req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can access their products' });
      return;
    }
    
    const adminId = req.user.userId;
    const products = await getProductsByAdmin(adminId);
    
    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error getting admin products:', error);
    res.status(500).json({ message: 'Error retrieving admin products' });
  }
};

// Update a product
export const updateExistingProduct = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can update products' });
      return;
    }
    
    const productId = parseInt(req.params.id, 10);
    
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }
    
    // Get the existing product to check ownership
    const existingProduct = await getProductById(productId);
    
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    // Check if the user is the creator of the product
    if (existingProduct.createdBy !== req.user.userId) {
      res.status(403).json({ message: 'You can only update products that you created' });
      return;
    }
    
    const updateData = req.body as Partial<ProductCreationAttributes>;
    
    // Validate price if provided
    if (updateData.price !== undefined && updateData.price <= 0) {
      res.status(400).json({ message: 'Price must be greater than zero' });
      return;
    }
    
    // Validate stock quantity if provided
    if (updateData.stockQuantity !== undefined && updateData.stockQuantity < 0) {
      res.status(400).json({ message: 'Stock quantity cannot be negative' });
      return;
    }
    
    // Process specifications if provided
    if (updateData.specifications !== undefined) {
      // Ensure it's a valid object
      if (typeof updateData.specifications !== 'object' || updateData.specifications === null) {
        updateData.specifications = {};
      }
    }
    
    // Process imageUrls if provided
    if (updateData.imageUrls !== undefined) {
      // Ensure it's a valid array
      if (!Array.isArray(updateData.imageUrls)) {
        updateData.imageUrls = [];
      }
    }
    
    // Update the product
    const updatedProduct = await updateProduct(productId, updateData);
    
    if (!updatedProduct) {
      res.status(500).json({ message: 'Failed to update product' });
      return;
    }
    
    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Delete a product
export const deleteExistingProduct = async (req: Request & { user?: any }, res: Response): Promise<void> => {
  try {
    // Ensure user is authenticated and is an admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can delete products' });
      return;
    }
    
    const productId = parseInt(req.params.id, 10);
    
    if (isNaN(productId)) {
      res.status(400).json({ message: 'Invalid product ID' });
      return;
    }
    
    // Get the existing product to check ownership
    const existingProduct = await getProductById(productId);
    
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    
    // Check if the user is the creator of the product
    if (existingProduct.createdBy !== req.user.userId) {
      res.status(403).json({ message: 'You can only delete products that you created' });
      return;
    }
    
    // Delete the product (soft delete)
    const deleted = await deleteProduct(productId);
    
    if (!deleted) {
      res.status(500).json({ message: 'Failed to delete product' });
      return;
    }
    
    res.status(200).json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// Get available brands for filtering
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await getAvailableBrands();
    
    res.status(200).json({
      brands
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ message: 'Error retrieving brands' });
  }
};