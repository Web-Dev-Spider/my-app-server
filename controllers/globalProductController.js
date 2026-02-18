const GlobalProduct = require("../models/inventory/GlobalProduct");
const AgencyProduct = require("../models/inventory/AgencyProduct");
const Agency = require("../models/Agency");
const mongoose = require("mongoose");

// Create a new global product
const createGlobalProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const {
            name,
            productCode,
            productType,   // CYLINDER, PR, NFR
            category,      // Domestic, Commercial, NFR, FTL
            subcategory,   // NFR subcategory (e.g., Suraksha Hose, LPG Stove)
            valuationType, // DEPOSIT, VALUATED, NFR
            capacityKg,
            isFiber,
            isReturnable,
            hsnCode,
            taxRate,
            unit
        } = req.body;

        const newProduct = new GlobalProduct({
            name,
            productCode,
            productType,
            category,
            subcategory: (productType === 'NFR') ? subcategory : undefined,
            valuationType,
            capacityKg: (productType === 'CYLINDER') ? capacityKg : undefined,
            isFiber: isFiber || false,
            isReturnable: isReturnable || false,
            hsnCode,
            taxRate,
            unit: unit || 'NOS',
            createdBy: 'SUPER_ADMIN'
        });

        await newProduct.save({ session });

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Global Product created", product: newProduct });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Create Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all global products
const getGlobalProducts = async (req, res) => {
    try {
        const products = await GlobalProduct.find().sort({ createdAt: -1 });

        // productType now exists natively in schema, just add businessType alias for FE
        const mappedProducts = products.map(p => {
            const obj = p.toObject();
            return {
                ...obj,
                businessType: obj.valuationType // Alias for UI
            };
        });

        res.status(200).json({ success: true, products: mappedProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a global product
const updateGlobalProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await GlobalProduct.findByIdAndUpdate(id, updates, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.status(200).json({ success: true, message: "Global Product updated", product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a global product (Soft delete or check dependencies)
const deleteGlobalProduct = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if involved in transactions? 
        // For now, simple soft delete by deactivating
        const product = await GlobalProduct.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Also deactivate agency mappings
        await AgencyProduct.updateMany({ globalProductId: id }, { isEnabled: false });

        res.status(200).json({ success: true, message: "Global Product deactivated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const ProductCategory = require("../models/inventory/ProductCategory");

// ... (existing exports)

// Category Management
const getCategories = async (req, res) => {
    try {
        const { type } = req.query;
        // Build query object. Always include isActive: true.
        const query = { isActive: true };

        // ProductType in UI maps to 'type' in ProductCategory schema
        if (type) {
            query.type = type;
        }

        // console.log("Fetching categories with query:", query); // Debug

        const categories = await ProductCategory.find(query).sort({ name: 1 });
        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error("Get Categories Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, type, description } = req.body;

        // Upsert to handle existing
        const category = await ProductCategory.findOneAndUpdate(
            { name: name, type: type },
            { name, type, description, isActive: true },
            { upsert: true, new: true }
        );

        res.status(201).json({ success: true, message: "Category created", category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, description } = req.body;

        const category = await ProductCategory.findByIdAndUpdate(
            id,
            { name, type, description },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, message: "Category updated", category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by deactivating
        const category = await ProductCategory.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        res.status(200).json({ success: true, message: "Category deactivated" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// Get schema configuration (product types, categories) from the schema itself
const getProductSchemaConfig = async (req, res) => {
    try {
        const productTypes = GlobalProduct.schema.path('productType').enumValues;
        const categories = GlobalProduct.schema.path('category').enumValues;

        res.status(200).json({
            success: true,
            productTypes,
            categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createGlobalProduct,
    getGlobalProducts,
    updateGlobalProduct,
    deleteGlobalProduct,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getProductSchemaConfig
};
