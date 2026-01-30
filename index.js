require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const PORT = process.env.PORT || 3000;
const userRouter = require("./routes/userRouter.js");
const authRouter = require("./routes/authRouter.js");
const connectDB = require("./config/db.js");

const app = express();

app.use(morgan("dev"));
app.use(cors({ origin: ["https://my-app-client-inky.vercel.app", "http://localhost:5173"], credentials: true }));
app.use(express.json());

app.use("/auth", authRouter);
app.use("/user", userRouter);

// app.use("/api/v1/admin");

app.get("/", (req, res) => {
  res.send("Welcome to home page");
});

// app.listen(PORT, (req, res) => {
//   console.log("App has started on port 3000");
// });

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
