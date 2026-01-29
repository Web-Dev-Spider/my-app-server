const login = (req, res) => {
  if (!req?.body?.email || !req?.body?.password) {
    return res.json({ success: false, message: "Please provide email and password" });
  }
  const { email, password } = req.body;

  if (email && password) {
    if (email === "a@b.com" && password === "123") {
      return res.json({ success: true, message: "Login successful" });
    }
  }
  res.status(401).json({ success: false, message: "Invalid email or password" });
};
module.exports = {
  login,
};
