// In the newly created migration file for products
exports.up = function(knex) {
    return knex.schema.createTable('products', table => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.text('description');
      table.decimal('price', 10, 2).notNullable();
      table.string('image_url');
      table.integer('created_by').unsigned().notNullable();
      table.foreign('created_by').references('users.id');
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('products');
  };