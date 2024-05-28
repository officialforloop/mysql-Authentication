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

users.get("/login", (req, res, error) => {
  res.render("login");
});

users.get("/signup", (req, res) => {
  res.render("login");
});

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

  // Check the request count and last request time for the user
  db.query(
    "SELECT request_count, last_request_time FROM user_requests WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error" });
      }

      let requestCount = 0;
      let lastRequestTime = null;

      if (results.length > 0) {
        requestCount = results[0].request_count;
        lastRequestTime = results[0].last_request_time;
      }

      // Check if last request was more than 24 hours ago
      if (
        lastRequestTime &&
        Date.now() - new Date(lastRequestTime).getTime() > 24 * 60 * 60 * 1000
      ) {
        requestCount = 0; // Reset request count
      }

      if (requestCount >= 7) {
        return res.json({ message: "Request limit reached" });
      }

      // Increment the request count
      requestCount++;

      // Update or insert the request count and last request time
      db.query(
        "INSERT INTO user_requests (user_id, request_count, last_request_time) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE request_count = ?, last_request_time = NOW()",
        [userId, requestCount, requestCount],
        (err, results) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
          }

          // Insert the request
          db.query(
            "INSERT INTO requests (user_id, urlRequest) VALUES (?, ?)",
            [userId, urlRequest],
            (err, results) => {
              if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error" });
              }

              res.json({ message: "Request received", requestCount });
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
    connection.query(
      "SELECT * FROM users WHERE id = ?",
      [req.userId],
      (err, rows) => {
        if (err || rows.length === 0) {
          console.error("Query error:", err);
          return res.status(404).send("User not found");
        }
        const data = rows[0]
        // console.log(data)
        res.render("dashboard", {
          firstname: data.first_name,
          lastname: data.last_name
        });
        connection.release();
      }
    );
  });
});

users.get("/logout", (req, res) => {
  res.clearCookie("authToken");
  console.log("logout successfully");
  res.redirect("login", 200);
});


// Logout Route
// users.post('/logout', (req, res) => {
//   res.clearCookie('authToken');
//   console.log('logout successfully')
// });

module.exports = users;