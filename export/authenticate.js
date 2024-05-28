const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.authToken;
  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.redirect("/login");
    }

    req.userId = decoded.id; // Assume the payload contains the user ID as `id`
    next();
  });
};

const attachUserId = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
  }
  next();
};

module.exports = { authenticateJWT, attachUserId };
