// src/dal/productDal.ts
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import pool from '../config/db';
import { Product, ProductCreationAttributes, ProductFilter } from '../models/Product';

// Create a new product
export const createProduct = async (productDto: ProductCreationAttributes): Promise<Product> => {
  try {
    const query = `
      INSERT INTO products (
        name, brand, model, description, price, stockQuantity, 
        specifications, imageUrls, createdBy, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(
      query,
      [
        productDto.name,
        productDto.brand,
        productDto.model,
        productDto.description,
        productDto.price,
        productDto.stockQuantity,
        JSON.stringify(productDto.specifications),
        JSON.stringify(productDto.imageUrls),
        productDto.createdBy,
        productDto.status || 'active'
      ]
    );
    
    const productId = result.insertId;
    return getProductById(productId);
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

// Get product by ID
export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const query = `
      SELECT * FROM products
      WHERE id = ? AND status != 'deleted'
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);
    
    if (rows.length === 0) {
      return null;
    }
    
    // Parse JSON fields
    const product = rows[0] as any;
    product.specifications = JSON.parse(product.specifications || '{}');
    product.imageUrls = JSON.parse(product.imageUrls || '[]');
    
    return product as Product;
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
};

// Get all products (with optional filters)
export const getProducts = async (filter?: ProductFilter): Promise<Product[]> => {
  try {
    let query = `
      SELECT p.*, u.email as adminEmail 
      FROM products p
      JOIN users u ON p.createdBy = u.id
      WHERE p.status != 'deleted'
    `;
    
    const params: any[] = [];
    
    // Apply filters if provided
    if (filter) {
      if (filter.createdBy) {
        query += ' AND p.createdBy = ?';
        params.push(filter.createdBy);
      }
      
      if (filter.adminEmail) {
        query += ' AND u.email = ?';
        params.push(filter.adminEmail);
      }
      
      if (filter.brand) {
        query += ' AND p.brand = ?';
        params.push(filter.brand);
      }
      
      if (filter.status) {
        query += ' AND p.status = ?';
        params.push(filter.status);
      }
      
      if (filter.minPrice !== undefined) {
        query += ' AND p.price >= ?';
        params.push(filter.minPrice);
      }
      
      if (filter.maxPrice !== undefined) {
        query += ' AND p.price <= ?';
        params.push(filter.maxPrice);
      }
    }
    
    // Order by newest first
    query += ' ORDER BY p.createdAt DESC';
    
    const [rows] = await pool.execute<RowDataPacket[]>(query, params);
    
    // Parse JSON fields for all products
    return (rows as any[]).map(product => ({
      ...product,
      specifications: JSON.parse(product.specifications || '{}'),
      imageUrls: JSON.parse(product.imageUrls || '[]')
    })) as Product[];
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get products by admin ID
export const getProductsByAdmin = async (adminId: number): Promise<Product[]> => {
  return getProducts({ createdBy: adminId });
};

// Update a product
export const updateProduct = async (id: number, productDto: Partial<ProductCreationAttributes>): Promise<Product | null> => {
  try {
    // Build dynamic query based on provided fields
    const updates: string[] = [];
    const params: any[] = [];
    
    if (productDto.name !== undefined) {
      updates.push('name = ?');
      params.push(productDto.name);
    }
    
    if (productDto.brand !== undefined) {
      updates.push('brand = ?');
      params.push(productDto.brand);
    }
    
    if (productDto.model !== undefined) {
      updates.push('model = ?');
      params.push(productDto.model);
    }
    
    if (productDto.description !== undefined) {
      updates.push('description = ?');
      params.push(productDto.description);
    }
    
    if (productDto.price !== undefined) {
      updates.push('price = ?');
      params.push(productDto.price);
    }
    
    if (productDto.stockQuantity !== undefined) {
      updates.push('stockQuantity = ?');
      params.push(productDto.stockQuantity);
    }
    
    if (productDto.specifications !== undefined) {
      updates.push('specifications = ?');
      params.push(JSON.stringify(productDto.specifications));
    }
    
    if (productDto.imageUrls !== undefined) {
      updates.push('imageUrls = ?');
      params.push(JSON.stringify(productDto.imageUrls));
    }
    
    if (productDto.status !== undefined) {
      updates.push('status = ?');
      params.push(productDto.status);
    }
    
    // Return early if no updates
    if (updates.length === 0) {
      return getProductById(id);
    }
    
    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = ?
    `;
    
    // Add the ID parameter
    params.push(id);
    
    await pool.execute<ResultSetHeader>(query, params);
    
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
    const query = `
      UPDATE products
      SET status = 'deleted'
      WHERE id = ?
    `;
    
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Get available brands (for filtering)
export const getAvailableBrands = async (): Promise<string[]> => {
  try {
    const query = `
      SELECT DISTINCT brand FROM products
      WHERE status = 'active'
      ORDER BY brand
    `;
    
    const [rows] = await pool.execute<RowDataPacket[]>(query);
    
    return (rows as any[]).map(row => row.brand);
  } catch (error) {
    console.error('Error getting available brands:', error);
    throw error;
  }
};