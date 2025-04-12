import knex from 'knex';
import config from '../knexfile';  // Now points to .ts file

const db = knex(config.development);

// Test connection
db.raw('SELECT 1+1 AS result')
  .then(() => console.log('✅ Database connected'))
  .catch(err => console.error('❌ Database connection failed:', err));

export default db;