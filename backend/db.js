const mysql = require("mysql2/promise");

let db;

if (process.env.MYSQL_PUBLIC_URL) {
  db = mysql.createPool(process.env.MYSQL_PUBLIC_URL);
} else {
  db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "locker",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

module.exports = db;