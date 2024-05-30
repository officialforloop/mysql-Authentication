const pool = require("./database");

// Read the SQL script
const sqlScript = `
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS \`request_history\`(
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  admin_reply VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id)
);

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
