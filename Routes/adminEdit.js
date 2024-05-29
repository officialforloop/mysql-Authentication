const express = require("express");
const adminEdit = express.Router();
const db = require("../Database/database"); 
const { adminauthenticate, authenticateJWT } = require("../export/authenticate");


adminEdit.post("/admin/edit-request/:id", adminauthenticate, (req, res) => {
  if (req.userRole !== "primary_admin") {
    return res.status(403).send("Forbidden");
  }

  const requestId = req.params.id;
  const newRequest = req.body.newRequest;

  db.getConnection((err, connection) => {
    if (err) {
      console.error("Connection error:", err);
      return res.status(500).send("Internal Server Error");
    }

    // Store the original request in request_history table before updating
    const historyQuery = `
      INSERT INTO request_history (request_id, old_urlRequest)
      SELECT id, urlRequest FROM requests WHERE id = ?
    `;
    connection.query(historyQuery, [requestId], (err, result) => {
      if (err) {
        console.error("Query error:", err);
        return res.status(500).send("Internal Server Error");
      }

      // Update the request with the new URL
      const updateQuery = "UPDATE requests SET urlRequest = ? WHERE id = ?";
      connection.query(updateQuery, [newRequest, requestId], (err, result) => {
        if (err) {
          console.error("Query error:", err);
          return res.status(500).send("Internal Server Error");
        }

        res.redirect("/admin/dashboard");
      });
    });

    connection.release();
  });
});
// Render the edit request form
// adminEdit.get("/edit-request/:id", (req, res) => {
//   if (req.userRole !== "primary_admin") {
//     return res.status(403).send("Forbidden");
//   }

//   const requestId = req.params.id;

//   db.query("SELECT * FROM requests WHERE id = ?", [requestId], (err, rows) => {
//     if (err || rows.length === 0) {
//       console.error("Query error:", err);
//       return res.status(404).send("Request not found");
//     }

//     const request = rows[0];
//     res.render("edit_request", { request });
//   });
// });

// Handle the form submission for editing a request
// adminEdit.post("/edit-request/:id", (req, res) => {
//   if (req.userRole !== "primary_admin") {
//     return res.status(403).send("Forbidden");
//   }

//   const requestId = req.params.id;
//   const newUrlRequest = req.body.urlRequest;

//   // Begin a transaction
//   db.getConnection((err, connection) => {
//     if (err) {
//       console.error("Connection error:", err);
//       return res.status(500).send("Internal Server Error");
//     }

//     connection.beginTransaction((err) => {
//       if (err) {
//         connection.release();
//         console.error("Transaction error:", err);
//         return res.status(500).send("Transaction Error");
//       }

//       // Get the old request
//       connection.query(
//         "SELECT urlRequest FROM requests WHERE id = ?",
//         [requestId],
//         (err, rows) => {
//           if (err || rows.length === 0) {
//             connection.rollback(() => {
//               connection.release();
//               console.error("Query error:", err);
//               return res.status(404).send("Request not found");
//             });
//           }

//           const oldUrlRequest = rows[0].urlRequest;

//           // Insert the old request into request_history
//           connection.query(
//             "INSERT INTO request_history (request_id, old_urlRequest) VALUES (?, ?)",
//             [requestId, oldUrlRequest],
//             (err, result) => {
//               if (err) {
//                 connection.rollback(() => {
//                   connection.release();
//                   console.error("Insert error:", err);
//                   return res.status(500).send("Database Error");
//                 });
//               }

//               // Update the request with the new URL
//               connection.query(
//                 "UPDATE requests SET urlRequest = ? WHERE id = ?",
//                 [newUrlRequest, requestId],
//                 (err, result) => {
//                   if (err) {
//                     connection.rollback(() => {
//                       connection.release();
//                       console.error("Update error:", err);
//                       return res.status(500).send("Database Error");
//                     });
//                   }

//                   connection.commit((err) => {
//                     if (err) {
//                       connection.rollback(() => {
//                         connection.release();
//                         console.error("Commit error:", err);
//                         return res.status(500).send("Transaction Commit Error");
//                       });
//                     }

//                     res.redirect("/admin/dashboard");
//                     connection.release();
//                   });
//                 }
//               );
//             }
//           );
//         }
//       );
//     });
//   });
// });

module.exports = adminEdit;
