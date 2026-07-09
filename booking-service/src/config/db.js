const sql = require('mssql');
require('dotenv').config();

const SERVICE_NAME = process.env.SERVICE_NAME || 'booking-service';

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'
  }
};

let pool;

const getConnection = async () => {
  try {
    if (pool) {
      return pool;
    }

    console.log(`[${SERVICE_NAME}] Intentando conectar a SQL Server...`);
    console.log(`[${SERVICE_NAME}] Servidor:`, process.env.DB_SERVER);
    console.log(`[${SERVICE_NAME}] Puerto:`, process.env.DB_PORT);
    console.log(`[${SERVICE_NAME}] Base de datos:`, process.env.DB_DATABASE);

    pool = await sql.connect(dbConfig);

    console.log(`[${SERVICE_NAME}] Conexión exitosa a SQL Server`);
    return pool;
  } catch (error) {
    console.error(`[${SERVICE_NAME}] Error al conectar con SQL Server:`, error.message);
    throw error;
  }
};

module.exports = {
  sql,
  getConnection
};