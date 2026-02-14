const { verifyToken } = require("../utils/jwt");
const authenticate = async (req, res, next) => {
  try {
    // const token = req.headers.authorization?.split(" ")[1];
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Not Authenticated ...Access denied, please reload" });
    }

    const decoded = verifyToken(token);

    req.user = decoded.user; // attach the correct user object from the decoded token
    // console.log("req.user from middleware", req.user);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid token ...Access denied", error: error.message });
  }
};

module.exports = {
  authenticate,
};
