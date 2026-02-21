const login = (req, res) => {
  if (!req?.body?.email || !req?.body?.password) {
    return res.json({ success: false, message: "Please provide email and password" });
  }
  const { email, password } = req.body;


  res.status(401).json({ success: false, message: "Invalid email or password" });
};
module.exports = {
  login,
};
