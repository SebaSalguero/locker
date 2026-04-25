const { Pool } = require("pg");

let db;

if (process.env.DATABASE_URL) {
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Pool({
    host: "localhost",
    user: "postgres",
    password: "tu_password",
    database: "postgres",
    port: 5432
  });
}

module.exports = db;