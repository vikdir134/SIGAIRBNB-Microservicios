const { Pool } = require('pg');

let pool;

const getPostgresPool = () => {
  if (!pool) {
    pool = new Pool({
      host: process.env.FINANCE_PG_HOST || 'finance-postgres',
      port: Number(process.env.FINANCE_PG_PORT || 5432),
      user: process.env.FINANCE_PG_USER || 'finance_user',
      password: process.env.FINANCE_PG_PASSWORD || 'finance_pass',
      database: process.env.FINANCE_PG_DATABASE || 'staype_finance_db',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
  }

  return pool;
};

module.exports = {
  getPostgresPool
};