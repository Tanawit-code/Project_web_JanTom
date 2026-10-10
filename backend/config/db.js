const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // คอลัมน์ DATE ส่งเป็นสตริง 'YYYY-MM-DD' กันวันที่เลื่อนไป 1 วันเพราะ time zone
  dateStrings: ['DATE'],
});

module.exports = pool;
