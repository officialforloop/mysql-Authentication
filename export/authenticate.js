const jwt = require("jsonwebtoken");
const userKey = process.env.SECRET_KEY;
const adminKey = process.env.ADMIN_KEY;

const authenticateJWT = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, userKey, (err, decoded) => {
    if (err) {
      return res.redirect("/login");
    }

    req.userId = decoded.id; // Assume the payload contains the user ID as `id`
    next();
  });
};

const adminauthenticate = (req, res, next) => {
  const token = req.cookies.adtoken;

  if (!token) {
    return res.status(403).json({ error: "No token provided" });
  }

  jwt.verify(token, adminKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();
  });
};

const attachUserId = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
  }
  next();
};

module.exports = { authenticateJWT, attachUserId, adminauthenticate };
