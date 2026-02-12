require("./config/envConfig.js");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const { PORT } = require("./config/envConfig.js");
const userRouter = require("./routes/userRouter.js");
const authRouter = require("./routes/authRouter.js");
const pdfRouter = require("./routes/pdfRouter.js");
const connectDB = require("./config/db.js");

const app = express();

app.use(morgan("dev"));
app.use(cors({ origin: ["https://my-app-client-inky.vercel.app", "http://localhost:5173"], credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/pdf", pdfRouter);

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
