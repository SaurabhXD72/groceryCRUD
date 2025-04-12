exports.up = function(knex) {
    return knex.schema.createTable('grocery_items', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable();
      table.decimal('price', 10, 2).notNullable();
      table.integer('inventory').notNullable().defaultTo(0);
      table.timestamps(true, true);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('grocery_items');
  };