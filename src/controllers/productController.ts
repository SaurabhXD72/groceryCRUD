// src/controllers/productController.ts
import { Request, Response } from 'express';
import db from '../db/knex'; // Import Knex instance
import { 
  Product, 
  ProductFilter 
} from '../models/productModel'; 
import { 
  CreateProductInput, 
  UpdateProductInput, 
  ProductFilterInput 
} from '../schemas/productSchemas'; 

// Interface for data passed to insertProduct, including created_by
interface ProductInsertData extends CreateProductInput {
  created_by: number;
}

// --- Internal Knex-based functions ---

const insertProduct = async (
  productData: ProductInsertData,
): Promise<Product> => {
  const productToInsert = {
    name: productData.name,
    description: productData.description,
    price: productData.price,
    image_url: productData.image_url,
    created_by: productData.created_by,
    status: 'active', 
  };

  const newProducts = await db('products').insert(productToInsert).returning('*');
  if (!newProducts || newProducts.length === 0) {
    throw new Error('Failed to create or retrieve product after insertion.');
  }
  const dbProduct = newProducts[0];
  
  return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description, 
      price: dbProduct.price,
      image_url: dbProduct.image_url, 
      createdBy: dbProduct.created_by, 
      createdAt: dbProduct.created_at, 
      updatedAt: dbProduct.updated_at,
      status: dbProduct.status as 'active' | 'inactive' | 'deleted' | undefined,
  };
};

const getProductById = async (id: number): Promise<Product | null> => {
  const product = await db('products')
    .where({ id })
    .andWhereNot('status', 'deleted')
    .first();
  if (!product) return null;

  return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      createdBy: product.created_by,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      status: product.status as 'active' | 'inactive' | 'deleted' | undefined,
  };
};

const getProducts = async (filter?: ProductFilter): Promise<Product[]> => {
  const query = db('products as p')
    .leftJoin('users as u', 'p.created_by', 'u.id') 
    .whereNot('p.status', 'deleted')
    .select('p.*', 'u.email as adminEmail');

  if (filter) {
    if (filter.createdBy) { 
      query.where('p.created_by', filter.createdBy);
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
  const dbProducts = await query.orderBy('p.created_at', 'desc');
  
  return dbProducts.map(dbProduct => ({
    id: dbProduct.id,
    name: dbProduct.name,
    description: dbProduct.description,
    price: dbProduct.price,
    image_url: dbProduct.image_url,
    createdBy: dbProduct.created_by,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
    status: dbProduct.status as 'active' | 'inactive' | 'deleted' | undefined,
    adminEmail: dbProduct.adminEmail, 
  }));
};

const updateProduct = async (
  id: number,
  productDto: Partial<CreateProductInput & { status?: string }>, 
): Promise<Product | null> => {
  const updateData: { [key: string]: any } = {};
  if (productDto.name !== undefined) updateData.name = productDto.name;
  if (productDto.description !== undefined) updateData.description = productDto.description;
  if (productDto.price !== undefined) updateData.price = productDto.price;
  if (productDto.image_url !== undefined) updateData.image_url = productDto.image_url;
  if (productDto.status !== undefined) updateData.status = productDto.status;

  if (Object.keys(updateData).length === 0) {
    return getProductById(id); 
  }

  await db('products').where({ id }).update(updateData);
  return getProductById(id);
};


const deleteProduct = async (id: number): Promise<boolean> => {
  const affectedRows = await db('products')
    .where({ id })
    .update({ status: 'deleted' }); 
  return affectedRows > 0;
};

const getAvailableBrands = async (): Promise<string[]> => {
  return []; 
};


// --- Controller methods ---

export const createProductHandler = async (
  req: Request & { user?: any, body: CreateProductInput },
  res: Response,
): Promise<void> => {
  try {
    const productDataFromClient = req.body;
    // Corrected to use req.user.id as per Express.User type
    const adminUserId = req.user.id; 

    const productToInsert: ProductInsertData = {
      ...productDataFromClient,
      created_by: adminUserId,
    };
    
    const newProduct = await insertProduct(productToInsert);
    
    res.status(201).json(newProduct); 

  } catch (error) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message.includes('Failed to create or retrieve product')) {
        res.status(500).json({ message: 'Error creating product: Internal data operation failure.' });
    } else {
        res.status(500).json({ message: 'Error creating product' });
    }
  }
};

export const getAllProducts = async (
  req: Request<any, any, any, ProductFilterInput>,
  res: Response,
): Promise<void> => {
  try {
    const filter = req.query as ProductFilter;
    if (filter.status === undefined && !filter.createdBy) { 
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

export const getProduct = async (
  req: Request<{ id: number }>,
  res: Response,
): Promise<void> => {
  try {
    const productId = req.params.id;
    const product = await getProductById(productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.status(200).json(product); 
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ message: 'Error retrieving product' });
  }
};

export const getMyProducts = async (
  req: Request & { user?: any },
  res: Response,
): Promise<void> => {
  try {
    // Corrected to use req.user.id
    const adminId = req.user.id; 
    const products = await getProducts({ createdBy: adminId }); 
    res.status(200).json({
      count: products.length,
      products,
    });
  } catch (error) {
    console.error('Error getting admin products:', error);
    res.status(500).json({ message: 'Error retrieving admin products' });
  }
};

export const updateExistingProduct = async (
  req: Request<{ id: number }, any, UpdateProductInput> & { user?: any },
  res: Response,
): Promise<void> => {
  try {
    const productId = req.params.id;
    const updateDataFromClient = req.body as Partial<CreateProductInput & { status?: string }>;

    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    // Corrected to use req.user.id
    if (existingProduct.createdBy !== Number(req.user.id)) { 
      res.status(403).json({ message: 'You can only update products that you created' });
      return;
    }

    const updatedProduct = await updateProduct(productId, updateDataFromClient);
    if (!updatedProduct) {
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

export const deleteExistingProduct = async (
  req: Request<{ id: number }> & { user?: any },
  res: Response,
): Promise<void> => {
  try {
    const productId = req.params.id;
    const existingProduct = await getProductById(productId);
    if (!existingProduct) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    // Corrected to use req.user.id
    if (existingProduct.createdBy !== Number(req.user.id)) { 
      res.status(403).json({ message: 'You can only delete products that you created' });
      return;
    }
    const deleted = await deleteProduct(productId);
    if (!deleted) {
      res.status(404).json({ message: 'Failed to delete product or product not found' });
      return;
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const brands = await getAvailableBrands();
    res.status(200).json({ brands });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({ message: 'Error retrieving brands' });
  }
};
