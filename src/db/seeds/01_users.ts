// In seeds/01_users.js
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('users')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('users').insert([
        {
          name: 'Admin User',
          email: 'admin@phonestore.com',
          // In production you'd hash these passwords
          password:
            '$2a$10$rXg4XPzlGdZ3OYvEZAF3zuYn1/ZXR.SJsNrr8LbsZaBDfAZhTn5tO', // "password123"
          role: 'admin',
        },
        {
          name: 'Customer User',
          email: 'customer@example.com',
          password:
            '$2a$10$rXg4XPzlGdZ3OYvEZAF3zuYn1/ZXR.SJsNrr8LbsZaBDfAZhTn5tO', // "password123"
          role: 'customer',
        },
      ]);
    });
};
