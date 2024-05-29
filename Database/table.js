const pool= require("./database");

// Read the SQL script
const sqlScript = `
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` int(11) NOT NULL,
  \`first_name\` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  \`last_name\` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  \`email\` varchar(100) COLLATE utf8_unicode_ci NOT NULL,
  \`password\` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  \`created\` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE \`users\`
  ADD PRIMARY KEY (\`id\`);

ALTER TABLE \`users\`
  MODIFY \`id\` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
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