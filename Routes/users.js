const express = require("express");
const users = express.Router();
const db = require("../Database/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const session = require('express-session');
require("dotenv").config({ path: "./.env" });

const secretKey = process.env.SECRET_KEY;
users.use(
  session({
    secret: process.env.SESSION_KEY, // Replace with a secure key
    resave: false,
    saveUninitialized: true,
  })
);

users.get("/login", (req, res, error) => {
  res.render("login");
});

users.get("/signup", (req, res) => {
  res.render("login");
});

// Signup Route
users.post('/signup', (req, res) => {
  const today = new Date();
  const appData = { error: 1, data: '' };
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
      appData.data = 'Internal Server Error';
      console.error('Connection error:', err);
      res.status(500).json(appData);
    } else {
      connection.query('INSERT INTO users SET ?', userData, (err, rows, fields) => {
        if (!err) {
          const token = jwt.sign({ id: rows.insertId }, secretKey, {
            expiresIn: "15h",
          });
          res.cookie('authToken', token, { httpOnly: true, maxAge: 15 * 60 * 60 * 1000 }); // 15 hours
          res.redirect('dashboard', 200,{ title: 'Dashboard', message: 'User registered successfully!' });
        } else {
          appData.data = 'Error Occurred!';
          console.error('Query error:', err);
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
      return res.render("login", {
        error: "Internal Server Error",
        email,
        password,
      });
    }

    connection.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      (err, rows, fields) => {
        if (err) {
          console.error("Query error:", err);
          return res.render("login", {
            error: "Error Occurred!",
            email,
            password,
          });
        }

        if (rows.length > 0) {
          if (bcrypt.compareSync(password, rows[0].password)) {
            // Compare hashed password
            const token = jwt.sign({ id: rows[0].id }, secretKey, {
              expiresIn: "15h",
            });
            res.cookie("authToken", token, {
              httpOnly: true,
              maxAge: 15 * 60 * 60 * 1000,
            }); // 15 hours

            // Redirect to the dashboard view
            return res.redirect("/dashboard");
          } else {
            console.log(err)
            return res.render("login", {
              error: "Email and Password do not match",
              email,
              password,
            });
          }
        } else {
          console.log(err)
          return res.render("login", {
            error: "Email does not exist!",
            email,
            password,
          });
        }
      }
    );

    connection.release();
  });
});



// Middleware to verify token
function verifyToken(req, res, next) {
  const token = req.cookies.authToken;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    const verified = jwt.verify(token, secretKey);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).send('Invalid token');
  }
}


// Protected Route Example
users.get('/dashboard', verifyToken, (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Connection error:', err);
      return res.status(500).send('Internal Server Error');
    }
    connection.query('SELECT * FROM users WHERE id = ?', [req.user.id], (err, rows) => {
      if (err || rows.length === 0) {
        console.error('Query error:', err);
        return res.status(404).send('User not found');
      }
      res.render('dashboard', {
        title: 'Dashboard',
        message: 'Welcome to your dashboard!',
      });
      connection.release();
    });
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