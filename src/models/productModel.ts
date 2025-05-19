// Create file: backend/models/productModel.js
const knex = require('../db/knex');

module.exports = {
  // Get all products
  getAllProducts() {
    return knex('products')
      .join('users', 'products.created_by', '=', 'users.id')
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.image_url',
        'products.created_at',
        'users.name as creator_name',
        'users.id as creator_id'
      );
  },
  
  // Get product by ID
  getProductById(id) {
    return knex('products')
      .join('users', 'products.created_by', '=', 'users.id')
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.image_url',
        'products.created_at',
        'users.name as creator_name',
        'users.id as creator_id'
      )
      .where('products.id', id)
      .first();
  },
  
  // Get products by admin ID
  getProductsByAdmin(adminId) {
    return knex('products')
      .join('users', 'products.created_by', '=', 'users.id')
      .select(
        'products.id',
        'products.name',
        'products.description',
        'products.price',
        'products.image_url',
        'products.created_at',
        'users.name as creator_name'
      )
      .where('products.created_by', adminId);
  },
  
  // Create a new product
  createProduct(productData) {
    return knex('products').insert(productData).returning('*');
  },
  
  // Update a product
  updateProduct(id, productData) {
    return knex('products').where({ id }).update(productData).returning('*');
  },
  
  // Delete a product
  deleteProduct(id) {
    return knex('products').where({ id }).del();
  }
};