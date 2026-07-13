const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'booking_user',
  password: process.env.MYSQL_PASSWORD || 'booking_pass',
  database: process.env.MYSQL_DATABASE || 'staype_booking_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

const getConnection = () => pool;

module.exports = {
  pool,
  getConnection
};
