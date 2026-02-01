const router = require("express").Router();

const { register, login, me, logout } = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", authenticate, me);

module.exports = router;
