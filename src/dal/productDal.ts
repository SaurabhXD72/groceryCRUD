// src/dal/productDal.ts
import db from '../db/knex'; // Import Knex instance
import {
  Product,
  ProductCreationAttributes,
  ProductFilter,
} from '../models/Product';

// Create a new product
export const createProduct = async (
  productDto: ProductCreationAttributes,
): Promise<Product> => {
  try {
    const [productId] = await db('products').insert({
      ...productDto,
      status: productDto.status || 'active',
      // Assuming 'specifications' and 'imageUrls' are JSON columns,
      // Knex should handle stringification. If not, use JSON.stringify here.
    });

    // Knex insert with MariaDB/MySQL returns the insertId directly.
    // If it returned an array of IDs, you'd use productId[0] if applicable.
    return getProductById(productId);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const product = await db('products')
      .where({ id })
      .andWhereNot('status', 'deleted')
      .first();

    if (!product) {
      return null;
    }
    // Assuming 'specifications' and 'imageUrls' are JSON columns,
    // Knex should handle parsing. If not, use JSON.parse here.
    return product as Product;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
};

// Get all products (with optional filters)
export const getProducts = async (
  filter?: ProductFilter,
): Promise<Product[]> => {
  try {
    const query = db('products as p')
      .join('users as u', 'p.createdBy', 'u.id')
      .whereNot('p.status', 'deleted')
      .select('p.*', 'u.email as adminEmail');

    if (filter) {
      if (filter.createdBy) {
        query.where('p.createdBy', filter.createdBy);
      }
      if (filter.adminEmail) {
        query.where('u.email', filter.adminEmail);
      }
      if (filter.brand) {
        query.where('p.brand', filter.brand);
      }
      if (filter.status) {
        query.where('p.status', filter.status);
      }
      if (filter.minPrice !== undefined) {
        query.where('p.price', '>=', filter.minPrice);
      }
      if (filter.maxPrice !== undefined) {
        query.where('p.price', '<=', filter.maxPrice);
      }
    }

    const products = await query.orderBy('p.createdAt', 'desc');

    // Assuming 'specifications' and 'imageUrls' are JSON columns,
    // Knex should handle parsing.
    return products as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get products by admin ID
export const getProductsByAdmin = async (
  adminId: number,
): Promise<Product[]> => {
  return getProducts({ createdBy: adminId });
};

// Update a product
export const updateProduct = async (
  id: number,
  productDto: Partial<ProductCreationAttributes>,
): Promise<Product | null> => {
  try {
    const updateData: { [key: string]: any } = { ...productDto };

    // Knex handles JSON stringification for JSON columns
    // if (productDto.specifications !== undefined) {
    //   updateData.specifications = JSON.stringify(productDto.specifications);
    // }
    // if (productDto.imageUrls !== undefined) {
    //   updateData.imageUrls = JSON.stringify(productDto.imageUrls);
    // }
    
    if (Object.keys(updateData).length === 0) {
        return getProductById(id);
    }

    const affectedRows = await db('products').where({ id }).update(updateData);

    if (affectedRows === 0) {
        // Optionally handle case where product to update was not found
        // or no rows were actually updated.
        // For now, consistent with original: try to fetch, might return null.
    }
    
    // Return the updated product
    return getProductById(id);
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Delete a product (soft delete)
export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    const affectedRows = await db('products')
      .where({ id })
      .update({ status: 'deleted' });

    return affectedRows > 0;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Get available brands (for filtering)
export const getAvailableBrands = async (): Promise<string[]> => {
  try {
    const results = await db('products')
      .distinct('brand')
      .where('status', 'active')
      .orderBy('brand');

    return results.map((row: any) => row.brand);
  } catch (error) {
    console.error('Error getting available brands:', error);
    throw error;
  }
};
