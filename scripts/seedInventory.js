const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const CylinderProduct = require("../models/inventory/CylinderProduct");
const ProductCategory = require("../models/inventory/ProductCategory");

const cylinderCategories = ["domestic", "commercial", "ftl"];
const nfrCategories = ["Suraksha Hose", "LPG Stove", "Lighter", "Apron", "Trolley", "Fire Ball", "Other"];
const prCategories = ["Domestic PR", "FTL PR", "FTL POS Resell PR"];

const products = [
    {
        name: "14.2Kg Domestic",
        productCode: "M00067",
        capacityKg: 14.2,
        category: "domestic",
        productType: "CYLINDER",
        isFiber: false,
        hsnCode: "27111900",
        taxRate: 5
    },
    {
        name: "Domestic PR (Non Valuated)",
        productCode: "PR001",
        category: "Domestic PR",
        productType: "PR",
        taxRate: 18
    },
    {
        name: "FTL PR",
        productCode: "PR002",
        category: "FTL PR",
        productType: "PR",
        taxRate: 18
    },
    {
        name: "FTL POS Resell PR",
        productCode: "PR003",
        category: "FTL POS Resell PR",
        productType: "PR",
        taxRate: 18
    },
    {
        name: "5Kg Domestic",
        productCode: "M00068",
        capacityKg: 5,
        category: "domestic",
        productType: "CYLINDER",
        isFiber: false,
        hsnCode: "27111900",
        taxRate: 5
    },
    {
        name: "19Kg Commercial",
        productCode: "M00449",
        capacityKg: 19,
        category: "commercial",
        productType: "CYLINDER",
        isFiber: false,
        hsnCode: "27111900",
        taxRate: 18
    },
    {
        name: "19Kg Xtra Tej",
        productCode: "M00450",
        capacityKg: 19,
        category: "commercial",
        productType: "CYLINDER",
        isFiber: false,
        hsnCode: "27111900",
        taxRate: 18
    },
    {
        name: "5Kg FTL",
        productCode: "M00069",
        capacityKg: 5,
        category: "ftl",
        productType: "CYLINDER",
        isFiber: false,
        hsnCode: "27111900",
        taxRate: 18
    },
    {
        name: "10Kg Fiber Domestic",
        productCode: "M00070",
        capacityKg: 10,
        category: "domestic",
        productType: "CYLINDER",
        isFiber: true,
        hsnCode: "27111900",
        taxRate: 5
    },
    {
        name: "Suraksha Hose 1.5M",
        productCode: "H001",
        category: "Suraksha Hose",
        productType: "NFR",
        taxRate: 18,
        hsnCode: "4009"
    },
    {
        name: "Lighter Standard",
        productCode: "L001",
        category: "Lighter",
        productType: "NFR",
        taxRate: 18,
        hsnCode: "9613"
    },
    {
        name: "Trolley Heavy",
        productCode: "T001",
        category: "Trolley",
        productType: "NFR",
        taxRate: 18
    },
    {
        name: "LPG Stove 2B",
        productCode: "S002",
        category: "LPG Stove",
        productType: "NFR",
        taxRate: 18
    },
    {
        name: "Fire Ball",
        productCode: "F001",
        category: "Fire Ball",
        productType: "NFR",
        taxRate: 18
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        const Agency = require("../models/Agency");
        const GlobalProduct = require("../models/inventory/GlobalProduct");
        const AgencyProduct = require("../models/inventory/AgencyProduct");

        // Seed Categories
        console.log("Seeding Categories...");
        for (const cat of cylinderCategories) {
            await ProductCategory.findOneAndUpdate(
                { name: cat, type: 'CYLINDER' },
                { name: cat, type: 'CYLINDER', description: `${cat} cylinder category`, isActive: true },
                { upsert: true }
            );
        }
        for (const cat of nfrCategories) {
            await ProductCategory.findOneAndUpdate(
                { name: cat, type: 'NFR' },
                { name: cat, type: 'NFR', description: `${cat} NFR category`, isActive: true },
                { upsert: true }
            );
        }
        for (const cat of prCategories) {
            await ProductCategory.findOneAndUpdate(
                { name: cat, type: 'PR' },
                { name: cat, type: 'PR', description: `${cat} category`, isActive: true },
                { upsert: true }
            );
        }

        // Find an agency to seed for
        const agency = await Agency.findOne();
        if (!agency) {
            console.error("No agency found to seed AgencyProducts.");
            process.exit(1);
        }
        console.log(`Seeding for Agency: ${agency.name}`);

        // Upsert Global Products
        for (const product of products) {
            const globalProduct = await GlobalProduct.findOneAndUpdate(
                { productCode: product.productCode },
                {
                    ...product,
                    isReturnable: product.productType === 'CYLINDER', // Assume only cylinders are strictly returnable for now
                    createdBy: 'SUPER_ADMIN'
                },
                { upsert: true, new: true }
            );
            console.log(`Seeded Global Product: ${product.name}`);

            // Link to Agency
            await AgencyProduct.findOneAndUpdate(
                { agencyId: agency._id, globalProductId: globalProduct._id },
                {
                    agencyId: agency._id,
                    globalProductId: globalProduct._id,
                    localName: product.name,
                    isActive: true,
                    currentPurchasePrice: 100, // Dummy
                    currentSalePrice: product.productType === 'PR' && product.category.includes('Domestic') ? 0 : 150, // Domestic PR has 0 sale value
                    priceEffectiveDate: new Date()
                },
                { upsert: true, new: true }
            );
            console.log(`Linked to Agency: ${product.name}`);
        }

        console.log("Global products and Categories seeded successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
