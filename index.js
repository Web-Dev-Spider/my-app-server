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
const { hashPassword } = require("./utils/hashPassword.js");

const app = express();

app.use(morgan("dev"));
app.use(
  cors({
    origin: [
      "https://dfriend.in",
      "https://www.dfriend.in",
      "https://my-app-client-inky.vercel.app",

      "http://localhost:5173",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/pdf", pdfRouter);

const inventoryRouter = require("./routes/inventoryRouter.js");
app.use("/inventory", inventoryRouter);

const adminRouter = require("./routes/adminRouter.js");

// app.use("/api/v1/admin");
app.use("/admin", adminRouter);

const superAdminRouter = require("./routes/superAdminRouter.js");
app.use("/super-admin", superAdminRouter);

app.get("/", (req, res) => {
  res.send("Welcome to home page");
});

// app.listen(PORT, (req, res) => {
//   console.log("App has started on port 3000");
// });

const { startComplianceCron } = require("./services/complianceCron");

connectDB()
  .then(async () => {
    // One-time: sync AgencyProduct indexes to drop the old unique index
    // (allows NFR products to be mapped multiple times). Can be removed after first run.
    const AgencyProduct = require("./models/inventory/AgencyProduct");
    await AgencyProduct.syncIndexes();
    console.log("AgencyProduct indexes synced.");

    // Start scheduled jobs
    startComplianceCron();

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
