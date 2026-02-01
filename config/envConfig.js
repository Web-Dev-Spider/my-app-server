require("dotenv").config();

const PORT = process.env.PORT || 3000;
//ENVIRONMENT

//Database
const MONGO_URI = process.env.MONGO_URI;

//JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// PORT=https://my-app-client-inky.vercel.app
VITE_BASE_URL = process.env.VITE_BASE_URL;
LOCAL_HOST = process.env.LOCAL_HOST;
NODE_ENV = process.env.NODE_ENV;

module.exports = { PORT, JWT_SECRET, JWT_EXPIRES_IN, VITE_BASE_URL, LOCAL_HOST, MONGO_URI, NODE_ENV };
