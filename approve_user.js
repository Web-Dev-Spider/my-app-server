const mongoose = require("mongoose");
const User = require("./models/User");
require("./config/envConfig.js");
const connectDB = require("./config/db.js");

const approveUser = async (email) => {
    try {
        await connectDB();
        const result = await User.updateOne(
            { email: email },
            { approvalStatus: "approved" }
        );
        console.log("User approved:", result);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.error("Please provide email as argument");
    process.exit(1);
}

approveUser(email);
