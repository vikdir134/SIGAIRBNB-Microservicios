const mysql = require('mysql2/promise');

let pool;

const getMySqlPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.BOOKING_MYSQL_HOST || 'booking-mysql',
      port: Number(process.env.BOOKING_MYSQL_PORT || 3306),
      user: process.env.BOOKING_MYSQL_USER || 'booking_user',
      password: process.env.BOOKING_MYSQL_PASSWORD || 'booking_pass',
      database: process.env.BOOKING_MYSQL_DATABASE || 'staype_booking_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }

  return pool;
};

module.exports = {
  getMySqlPool
};