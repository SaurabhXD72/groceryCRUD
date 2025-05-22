// src/controllers/productController.ts
import { Request, Response } from 'express';
import {
  createProduct,
  getProductById,
  getProducts,
  getProductsByAdmin,
  updateProduct,
  deleteProduct,
  getAvailableBrands,
} from '../dal/productDal';
// Removed ProductCreationAttributes as Zod schemas will handle body shapes
// import { ProductCreationAttributes, ProductFilter } from '../models/Product'; (No longer strictly needed here for body)
import { ProductFilter } from '../models/Product'; // Keep for filter type if DAL expects it.
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from '../schemas/productSchemas'; // Zod inferred types

// Create a new product
export const createNewProduct = async (
  req: Request & { user?: any, body: CreateProductInput }, // Use Zod inferred type
  res: Response,
): Promise<void> => {
  try {
    // User role check remains (authentication/authorization, not validation)
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can create products' });
      return;
    }

    const productData = req.body;

    // createdBy is now set from authenticated user, not part of schema for client input
    const newProduct = await createProduct({
      ...productData,
      createdBy: req.user.userId,
      // specifications and imageUrls will use defaults from schema if not provided
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// Get all products (with optional filters)
export const getAllProducts = async (
  // req.query will be typed by Zod validation
  req: Request<any, any, any, ProductFilterInput>, 
  res: Response,
): Promise<void> => {
  try {
    // req.query is already validated and transformed by Zod middleware
    const filter = req.query as ProductFilter; 

    // Set default status filter to 'active' if not specified by client or schema default
    if (filter.status === undefined) {
        filter.status = 'active';
    }
    
    const products = await getProducts(filter);

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
};

// Get product by ID
export const getProduct = async (
  req: Request<{ id: number }>, // id is parsed by Zod middleware
  res: Response,
): Promise<void> => {
  try {
    const productId = req.params.id; // Already a number due to idParamSchema

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
export const getMyProducts = async (
  req: Request & { user?: any },
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    if (req.user.role !== 'admin') {
      res
        .status(403)
        .json({ message: 'Only admins can access their products' });
      return;
    }

    const adminId = req.user.userId;
    // Here, we use the DAL function that expects an adminId, not a filter object from query
    const products = await getProductsByAdmin(adminId);

    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error getting admin products:', error);
    res.status(500).json({ message: 'Error retrieving admin products' });
  }
};

// Update a product
export const updateExistingProduct = async (
  req: Request<{ id: number }, any, UpdateProductInput> & { user?: any }, // id from params, body is UpdateProductInput
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can update products' });
      return;
    }

    const productId = req.params.id; // Already a number
    const updateData = req.body;

    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (existingProduct.createdBy !== req.user.userId) {
      res
        .status(403)
        .json({ message: 'You can only update products that you created' });
      return;
    }
    
    // If updateData is empty, DAL will handle fetching the product.
    // No need for specific checks here as Zod ensures types are correct if fields are present.

    const updatedProduct = await updateProduct(productId, updateData);

    if (!updatedProduct) {
      // This might happen if getProductById in DAL returns null after update
      res.status(404).json({ message: 'Product not found after update attempt or no changes made' });
      return;
    }

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Delete a product
export const deleteExistingProduct = async (
  req: Request<{ id: number }> & { user?: any }, // id from params
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Only admins can delete products' });
      return;
    }

    const productId = req.params.id; // Already a number

    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    if (existingProduct.createdBy !== req.user.userId) {
      res
        .status(403)
        .json({ message: 'You can only delete products that you created' });
      return;
    }

    const deleted = await deleteProduct(productId);

    if (!deleted) {
      // This might happen if the product was already deleted or ID not found by DAL
      res.status(404).json({ message: 'Failed to delete product or product not found' });
      return;
    }

    res.status(200).json({
      message: 'Product deleted successfully',
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
      brands,
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ message: 'Error retrieving brands' });
  }
};

// It's important to update routes to use this middleware.
// Example (in productRoutes.ts, not here):
// router.post('/', authenticateToken, validateRequestBody(createProductSchema), createNewProduct);
// router.get('/', validateRequestQuery(productFilterSchema), getAllProducts);
// router.get('/:id', validateRequestParams(idParamSchema), getProduct);
// etc.
