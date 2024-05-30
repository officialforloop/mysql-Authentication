const express = require('express');
const { adminauthenticate } = require('../export/authenticate');
const db = require("../Database/database");
const router = express.Router();

router.get('/login', (req, res) => {
  res.render('login')
})
router.get('/signup', (req, res) => {
  res.render('login')
})
router.get("/admin/signup", (req, res) => {
  res.render("admin_signup");
});
router.get("/admin/login", (req, res) => {
  res.render("admin_signup");
});

router.get("/admin/dashboard", adminauthenticate, (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).send("Internal Server Error");
    }

    const requestsQuery = `
      SELECT 
        r.id, 
        r.user_id, 
        r.urlRequest, 
        IFNULL(h.old_urlRequest, 'N/A') AS old_urlRequest 
      FROM 
        requests r 
      LEFT JOIN 
        request_history h 
      ON 
        r.id = h.request_id 
      ORDER BY 
        r.created_at DESC
    `;

    connection.query(requestsQuery, (err, requestRows) => {
      if (err) {
        console.error("Query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      res.render("admin", {
        requests: requestRows,
      });

      connection.release();
    });
  });
});



module.exports = router;
