const { verifyToken } = require("../utils/jwt");
const authenticate = async (req, res, next) => {
  try {
    // const token = req.headers.authorization?.split(" ")[1];
    const token = req.cookies?.token;
    if (!token) {
      res.status(401).json({ success: false, message: "Not Authenticated ...Access denied" });
    }

    const decoded = verifyToken(token);

    req.user = decoded; // attach the decoded token to the req.user object.
    console.log("req.user", req.user);
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token ...Access denied", error: error.message });
  }
};

module.exports = {
  authenticate,
};
