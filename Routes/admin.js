const express = require("express");
const admin = express.Router();
const db = require("../Database/database");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { adminauthenticate } = require("../export/authenticate");
const adminEdit = require("./adminEdit");
// const session = require("express-session");
require("dotenv").config({ path: "./.env" });
const secretKey = process.env.ADMIN_KEY;


admin.use(adminEdit);


admin.post("/admin/signup", (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const checkQuery = "SELECT COUNT(*) AS count FROM admin_users";

  db.query(checkQuery, (err, result) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(500).send("Internal Server Error");
    }

    if (result[0].count > 0) {
      return res.status(403).send("Admin signup not allowed");
    }

    const insertQuery =
      'INSERT INTO admin_users (email, password, role) VALUES (?, ?, "primary_admin")';
    db.query(insertQuery, [email, hashedPassword], (err, result) => {
      if (err) {
        console.error("Query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      // Ensure the role is included in the payload
      const payload = {
        id: user.id,
        role: user.role,
      };

      const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

      // Set the token as a cookie
      res.cookie("adtoken", token, {
        httpOnly: true,
        maxAge: 15 * 60 * 60 * 1000,
      }); // 15 hours

      res.redirect("/admin/dashboard");
    });
  });
});

admin.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).send("Internal Server Error");
    }

    connection.query(
      "SELECT * FROM admin_users WHERE email = ?",
      [email],
      (err, rows) => {
        if (err || rows.length === 0) {
          return res
            .status(400)
            .json({ error: "Email or password is incorrect" });
        }

        const user = rows[0];

        if (!bcrypt.compareSync(password, user.password)) {
          return res
            .status(400)
            .json({ error: "Email or password is incorrect" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, secretKey, {
          expiresIn: "15h",
        });

        res.cookie("adtoken", token, {
          httpOnly: true,
          maxAge: 15 * 60 * 60 * 1000,
        }); // 15 hours
        res.redirect("/admin/dashboard");
      }
    );

    connection.release();
  });
});



// ADD NEW ADMIN
// admin.post("/admin/add", adminauthenticate, (req, res) => {
//   if (req.userRole !== "primary_admin") {
//     return res.status(403).send("Forbidden");
//   }

//   const { email, password } = req.body;
//   const hashedPassword = bcrypt.hashSync(password, 10);

//   const insertQuery =
//     'INSERT INTO admin_users (email, password, role) VALUES (?, ?, "admin")';
//   db.query(insertQuery, [email, hashedPassword], (err, result) => {
//     if (err) {
//       console.error("Query error:", err);
//       return res.status(500).send("Internal Server Error");
//     }

//     res.status(201).send("Admin added successfully");
//   });
// });

module.exports = admin;
