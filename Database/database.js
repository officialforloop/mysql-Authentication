const mysql = require("mysql2");
require("dotenv").config({ path: "./.env" });

const pool = mysql.createPool({
  connectionLimit: 100,
  host: process.env.DATABASE_HOST,
  user: "root",
  password: process.env.DATABASE_PASSWORD,
  database: 'nodemysql',
  debug: false,
  multipleStatements: true,
});

// Verify the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  if (connection) connection.release();
  console.log("Connected to the MySQL server.");
});

module.exports = pool;
