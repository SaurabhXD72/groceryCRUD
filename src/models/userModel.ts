// Create file: backend/models/userModel.js
const knex = require('../db/knex');
const bcrypt = require('bcryptjs');

module.exports = {
  // Get all users
  getAllUsers() {
    return knex('users').select('id', 'name', 'email', 'role', 'created_at');
  },
  
  // Get user by ID
  getUserById(id) {
    return knex('users').where({ id }).first();
  },
  
  // Get user by email
  getUserByEmail(email) {
    return knex('users').where({ email }).first();
  },
  
  // Create a new user
  async createUser(userData) {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Insert user with hashed password
    return knex('users')
      .insert({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'customer'
      })
      .returning('*'); // Return the created user
  },
  
  // Update a user
  updateUser(id, userData) {
    return knex('users').where({ id }).update(userData).returning('*');
  },
  
  // Delete a user
  deleteUser(id) {
    return knex('users').where({ id }).del();
  },
  
  // Validate password
  async validatePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
};