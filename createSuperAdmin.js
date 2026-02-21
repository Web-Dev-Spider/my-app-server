// const mongoose = require("mongoose");
// const User = require("./models/User");
// const { hashPassword } = require("./utils/hashPassword");
// require("dotenv").config(); // Load environment variables

// const createSuperAdmin = async () => {
//     try {
//         // Connect to MongoDB
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log("Connected to MongoDB");

//         const username = "superadmin";
//         const email = "superadmin@example.com";
//         const password = "admin@5055"; // Default password
//         const hashedPassword = await hashPassword(password);

//         // Check if super admin already exists
//         const existingAdmin = await User.findOne({
//             $or: [{ email }, { username }]
//         });

//         if (existingAdmin) {
//             console.log("Super Admin already exists");

//             // Optional: Update role if needed
//             if (existingAdmin.role !== "SUPER-ADMIN") {
//                 existingAdmin.role = "SUPER-ADMIN";
//                 await existingAdmin.save();
//                 console.log("Updated existing user to SUPER-ADMIN");
//             }

//             process.exit(0);
//         }

//         // Create new Super Admin
//         const superAdmin = new User({
//             username,
//             email,
//             password: hashedPassword,
//             role: "SUPER-ADMIN",
//             name: "Super Administrator",
//             isActive: true,
//             permissions: ["ALL_ACCESS"], // Define special permission if needed
//             // agencyId is not required for SUPER-ADMIN
//         });

//         await superAdmin.save();
//         console.log("Super Admin created successfully");
//         console.log(`Username: ${username}`);
//         console.log(`Password: ${password}`);

//     } catch (error) {
//         console.error("Error creating Super Admin:", error);
//     } finally {
//         mongoose.connection.close();
//     }
// };

// createSuperAdmin();
