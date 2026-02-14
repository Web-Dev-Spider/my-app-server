require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const fixIndex = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        const usersCollection = mongoose.connection.collection("users");

        // Drop the unique email index if it exists
        try {
            await usersCollection.dropIndex("email_1");
            console.log("Successfully dropped 'email_1' index.");
        } catch (err) {
            if (err.codeName === "IndexNotFound") {
                console.log("'email_1' index not found, likely already sparse or dropped.");
            } else {
                console.error("Error dropping index:", err.message);
            }
        }

        // Explicitly update any existing users with null emails to undefined (unset the field)
        const res = await User.updateMany(
            { email: null },
            { $unset: { email: "" } }
        );
        console.log(`Updated ${res.modifiedCount} users with null email to unset.`);

        console.log("Index fix complete. Please restart the server.");
        process.exit(0);
    } catch (error) {
        console.error("Script error:", error);
        process.exit(1);
    }
};

fixIndex();
