const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration...");

        const db = mongoose.connection.db;

        // 1. Update GlobalProduct productType
        const gpResult = await db.collection("globalproducts").updateMany(
            { productType: "ITEM" },
            { $set: { productType: "NFR" } }
        );
        console.log(`Updated ${gpResult.modifiedCount} GlobalProducts from ITEM to NFR.`);

        // 2. Update ProductCategory type
        const pcResult = await db.collection("productcategories").updateMany(
            { type: "ITEM" },
            { $set: { type: "NFR" } }
        );
        console.log(`Updated ${pcResult.modifiedCount} ProductCategories from ITEM to NFR.`);

        // 3. Rename itemproducts collection to nfrproducts
        const collections = await db.listCollections({ name: "itemproducts" }).toArray();
        if (collections.length > 0) {
            await db.renameCollection("itemproducts", "nfrproducts");
            console.log("Renamed collection 'itemproducts' to 'nfrproducts'.");
        } else {
            console.log("Collection 'itemproducts' not found (already renamed or empty).");
        }

        // 4. Update productType in any other places? 
        // AgencyProduct doesn't store type. 
        // NFRProduct (local) doesn't store type usually (implied by collection).
        // But if they have any internal type field:
        // Checking NFRProduct schema... it doesn't have a 'type' field.
        // Checking ProductManagement.jsx... it sends 'type' in body? 
        // But schema doesn't seem to store it.

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
