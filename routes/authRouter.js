const router = require("express").Router();

const { register, login, me, logout, updateProfile, forgotPassword, resetPassword } = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/logout", logout);
router.get("/me", authenticate, me);
router.put("/update-profile", authenticate, updateProfile);

module.exports = router;
