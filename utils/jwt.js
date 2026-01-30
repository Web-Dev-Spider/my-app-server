const jwt = require("jsonwebtoken");
const { JWT_EXPIRES_IN, JWT_SECRET } = require("../config/envConfig");

const generateJwtToken = (userId, role) => {
  try {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  } catch (error) {
    console.log("Error generating jwt", error);
  }
};

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);
module.exports = { generateJwtToken, verifyToken }; // export generateJwtToken;
