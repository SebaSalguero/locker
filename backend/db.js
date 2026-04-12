const mysql = require("mysql2");


const db = mysql.createPool({
  uri: process.env.MYSQL_PUBLIC_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
