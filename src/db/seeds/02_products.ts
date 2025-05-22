// In seeds/02_products.js
exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('products')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('products').insert([
        {
          name: 'iPhone 13',
          description: 'Latest iPhone with A15 Bionic chip',
          price: 799.99,
          image_url: 'https://example.com/iphone13.jpg',
          created_by: 1, // Admin user ID
        },
        {
          name: 'Samsung Galaxy S21',
          description: 'Feature-rich Android phone with great camera',
          price: 699.99,
          image_url: 'https://example.com/galaxys21.jpg',
          created_by: 1, // Admin user ID
        },
      ]);
    });
};
