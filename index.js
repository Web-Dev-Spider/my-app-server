require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const PORT = process.env.PORT || 3000;
const userRouter = require("./routes/userRouter.js");

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

app.use("/user", userRouter);

app.get("/", (req, res) => {
  res.send("Welcome to home page");
});

app.listen(PORT, (req, res) => {
  console.log("App has started on port 3000");
});
