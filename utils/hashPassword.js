const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
};

const comparePassword = async (password, hashedPassword) => await bcrypt.compare(password, hashedPassword);
module.exports = { hashPassword, comparePassword }; // export hashPassword;
