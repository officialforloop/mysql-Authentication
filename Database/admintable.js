const pool = require("./database");

// Read the SQL script
const sqlScript = `
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
);

ALTER TABLE admin_users ADD COLUMN role ENUM('primary_admin', 'admin') NOT NULL DEFAULT 'admin';


COMMIT;
`;

// Execute the SQL script
pool.query(sqlScript, (error, results) => {
  if (error) {
    console.error("Error executing script: ", error);
    pool.end();
    return;
  }
  console.log("SQL script executed successfully.");
  pool.end();
});
