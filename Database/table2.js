const pool = require("./database");

// Read the SQL script
const sqlScript = `
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

-- Create requests table
CREATE TABLE IF NOT EXISTS \`requests\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`user_id\` int(11) NOT NULL,
  \`userRequest\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  KEY \`user_id\` (\`user_id\`),
  CONSTRAINT \`requests_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Create user_requests table to track request count
CREATE TABLE IF NOT EXISTS \`user_requests\` (
  \`user_id\` int(11) NOT NULL,
  \`request_count\` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (\`user_id\`),
  CONSTRAINT \`user_requests_ibfk_1\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

-- Add last_request_time column to user_requests table
ALTER TABLE \`user_requests\`
ADD COLUMN \`last_request_time\` DATETIME DEFAULT NULL;

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