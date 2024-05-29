const express = require("express");
const users = express.Router();
const db = require("../Database/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require('express-session');
const { authenticateJWT } = require("../export/authenticate");
require("dotenv").config({ path: "./.env" });

const secretKey = process.env.SECRET_KEY;
users.use(
  session({
    secret: process.env.SESSION_KEY, // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 15 * 60 * 60 * 1000 }, 
  })
);

users.post("/signup", (req, res) => {
  const today = new Date();
  const appData = { error: 1, data: "" };
  const userData = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10), // Hash the password
    created: today,
  };

  db.getConnection((err, connection) => {
    if (err) {
      appData.error = 1;
      appData.data = "Internal Server Error";
      console.error("Connection error:", err);
      res.status(500).json(appData);
    } else {
      connection.query("INSERT INTO users SET ?", userData, (err, result) => {
        if (!err) {
          const userId = result.insertId;
          const token = jwt.sign({ id: userId }, secretKey, {
            expiresIn: "15h",
          });
          res.cookie("authToken", token, {
            httpOnly: true,
            maxAge: 15 * 60 * 60 * 1000,
          }); // 15 hours
          res.redirect("/dashboard");
        } else {
          appData.data = "Error Occurred!";
          console.error("Query error:", err);
          res.status(400).json(appData);
        }
        connection.release(); // Release the connection
      });
    }
  });
});

users.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, rows) => {
        if (err) {
          console.error("Query error:", err);
          return res.status(400).json({ error: "Error Occurred!" });
        }

        if (rows.length > 0) {
          if (bcrypt.compareSync(password, rows[0].password)) {
            // Compare hashed password
            const userId = rows[0].id;
            const token = jwt.sign({ id: userId }, secretKey, {
              expiresIn: "15h",
            });
            res.cookie("authToken", token, {
              httpOnly: true,
              maxAge: 15 * 60 * 60 * 1000,
            }); // 15 hours

            res.redirect("/dashboard");
          } else {
            return res
              .status(400)
              .json({ error: "Email and Password do not match" });
          }
        } else {
          return res.status(400).json({ error: "Email does not exist!" });
        }
      }
    );

    connection.release();
  });
});

users.post("/submit", authenticateJWT, (req, res) => {
  const userId = req.userId;
  const { urlRequest } = req.body;

  if (!urlRequest) {
    return res.status(400).json({ error: "urlRequest is required" });
  }

  db.query(
    "SELECT request_count, last_request_time FROM user_requests WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      let requestCount = 7; // Default value
      let lastRequestTime = null;

      if (results.length > 0) {
        requestCount = results[0].request_count;
        lastRequestTime = results[0].last_request_time;
      }

      if (
        lastRequestTime &&
        Date.now() - new Date(lastRequestTime).getTime() > 24 * 60 * 60 * 1000
      ) {
        requestCount = 7; // Reset request count
      }

      if (requestCount <= 0) {
        return res.status(400).json({ message: "Request limit reached" });
      }

      requestCount--;

      db.query(
        "INSERT INTO user_requests (user_id, request_count, last_request_time) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE request_count = ?, last_request_time = NOW()",
        [userId, requestCount, requestCount],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }

          db.query(
            "INSERT INTO requests (user_id, urlRequest) VALUES (?, ?)",
            [userId, urlRequest],
            (err) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
              }

              res.redirect("/dashboard");
            }
          );
        }
      );
    }
  );
});




// Protected Route Example
users.get("/dashboard", authenticateJWT, (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const userId = req.userId;

    const query = `
      SELECT u.first_name, u.last_name, r.*, h.old_urlRequest, ur.request_count 
      FROM users u 
      LEFT JOIN requests r ON u.id = r.user_id 
      LEFT JOIN request_history h ON r.id = h.request_id 
      LEFT JOIN user_requests ur ON u.id = ur.user_id 
      WHERE u.id = ?;
    `;

    connection.query(query, [userId], (err, rows) => {
      if (err) {
        console.error("Query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      if (rows.length === 0) {
        return res.status(404).send("User not found");
      }

      const user = {
        firstName: rows[0].first_name,
        lastName: rows[0].last_name,
        requests: rows.map((row) => ({
          id: row.id,
          urlRequest: row.urlRequest,
          old_urlRequest: row.old_urlRequest,
        })),
      };

      const dailyRequestCount =
        rows[0].request_count !== null ? rows[0].request_count : 7;

      res.render("dashboard", {
        user,
        dailyRequestCount,
      });
      connection.release();
    });
  });
});



users.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  console.log("logout successfully");
  res.redirect("login");
});

users.get("/admin/logout", (req, res) => {
  res.clearCookie("adToken");
  console.log("logout successfully");
  res.redirect("/admin/login");
});

module.exports = users;