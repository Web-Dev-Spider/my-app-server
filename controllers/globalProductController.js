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
            productType,
            variant,
            category,
            businessType, // Added
            capacityKg,
            isFiber,
            isReturnable,
            hsnCode,
            taxRate,
            openingStock
        } = req.body;

        const newProduct = new GlobalProduct({
            name,
            productCode,
            productType,
            variant: (productType === 'CYLINDER' || productType === 'PR' || productType === 'FTL') ? variant : undefined,
            category,
            businessType, // Added
            capacityKg: productType === 'CYLINDER' ? capacityKg : undefined,
            isFiber,
            isReturnable: productType === 'CYLINDER', // Default logic
            hsnCode,
            taxRate,
            openingStock: (productType === 'CYLINDER' || productType === 'PR' || productType === 'FTL') ? openingStock : 0,
            createdBy: 'SUPER_ADMIN'
        });

        await newProduct.save({ session });

        // Auto-sync disabled as per user request (they want manually add products to set opening stock)
        // const agencies = await Agency.find({ isActive: true });
        // const agencyProducts = agencies.map(agency => ({
        //     agencyId: agency._id,
        //     globalProductId: newProduct._id,
        //     localName: newProduct.name,
        //     currentPurchasePrice: 0,
        //     currentSalePrice: 0,
        //     priceEffectiveDate: new Date(),
        //     isActive: true
        // }));
        // if (agencyProducts.length > 0) {
        //     await AgencyProduct.insertMany(agencyProducts, { session });
        // }

        await session.commitTransaction();
        session.endSession();
        res.status(201).json({ success: true, message: "Global Product created", product: newProduct });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all global products
const getGlobalProducts = async (req, res) => {
    try {
        const products = await GlobalProduct.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, products });
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
        const query = { isActive: true };
        if (type) query.type = type;

        const categories = await ProductCategory.find(query).sort({ name: 1 });
        res.status(200).json({ success: true, categories });
    } catch (error) {
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
// Get schema configuration (product types, variants) from the schema itself
const getProductSchemaConfig = async (req, res) => {
    try {
        const productTypes = GlobalProduct.schema.path('productType').enumValues;
        const variants = GlobalProduct.schema.path('variant').enumValues;

        res.status(200).json({
            success: true,
            productTypes,
            variants
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
