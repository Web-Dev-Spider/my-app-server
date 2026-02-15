const CylinderProduct = require('../models/inventory/CylinderProduct');
const NFRProduct = require('../models/inventory/NFRProduct');
const PRProduct = require('../models/inventory/PRProduct');
const GlobalProduct = require('../models/inventory/GlobalProduct');
const AgencyProduct = require('../models/inventory/AgencyProduct');

// Create Product
const createProduct = async (req, res) => {
    try {
        const { type, ...data } = req.body;
        data.agencyId = req.user.agencyId;

        let product;
        if (type === 'cylinder') {
            product = new CylinderProduct(data);
        } else if (type === 'nfr' || type === 'item') {
            product = new NFRProduct(data);
        } else if (type === 'pr') {
            product = new PRProduct(data);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        await product.save();
        res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Products
const getProducts = async (req, res) => {
    try {
        const { type } = req.query;
        let products = [];
        const filter = { agencyId: req.user.agencyId };
        const agencyProductFilter = { agencyId: req.user.agencyId };

        if (req.query.active === 'true') {
            filter.isActive = true;
            agencyProductFilter.isEnabled = true;
        }

        const fetchLocalProducts = async () => {
            if (type === 'cylinder') {
                const cyls = await CylinderProduct.find(filter).sort({ createdAt: -1 }).lean();
                return cyls.map(p => ({ ...p, type: 'cylinder' }));
            } else if (type === 'nfr' || type === 'item') {
                const items = await NFRProduct.find(filter).sort({ createdAt: -1 }).lean();
                return items.map(p => ({ ...p, type: 'nfr' }));
            } else if (type === 'pr') {
                const prs = await PRProduct.find(filter).sort({ createdAt: -1 }).lean();
                return prs.map(p => ({ ...p, type: 'pr' }));
            } else {
                const [cylinders, items, prs] = await Promise.all([
                    CylinderProduct.find(filter).sort({ createdAt: -1 }).lean(),
                    NFRProduct.find(filter).sort({ createdAt: -1 }).lean(),
                    PRProduct.find(filter).sort({ createdAt: -1 }).lean()
                ]);
                return [
                    ...cylinders.map(p => ({ ...p, type: 'cylinder' })),
                    ...items.map(p => ({ ...p, type: 'nfr' })),
                    ...prs.map(p => ({ ...p, type: 'pr' }))
                ];
            }
        };

        const fetchAgencyProducts = async () => {
            const agencyProducts = await AgencyProduct.find(agencyProductFilter)
                .populate('globalProductId')
                .lean();

            return agencyProducts.map(ap => {
                if (!ap.globalProductId) return null;
                const gp = ap.globalProductId;
                let mappedType = 'nfr';
                if (gp.productType === 'CYLINDER') mappedType = 'cylinder';
                else if (gp.productType === 'PR') mappedType = 'pr';

                return {
                    _id: ap._id,
                    type: mappedType,
                    name: ap.localName || gp.name,
                    productCode: gp.productCode,
                    capacityKg: gp.capacityKg,
                    category: gp.category,
                    unit: 'NOS', // GlobalProduct schema missing unit, default
                    hsnCode: gp.hsnCode,
                    taxRate: gp.taxRate,
                    currentPurchasePrice: ap.currentPurchasePrice,
                    currentSalePrice: ap.currentSalePrice,
                    isActive: ap.isEnabled,
                    priceEffectiveDate: ap.priceEffectiveDate,
                    isGlobal: true,
                    isFiber: gp.isFiber
                };
            }).filter(p => p !== null && (!type || p.type === type || (type === 'nfr' && p.type === 'item'))); // Allow item/nfr mapping if strictly needed or just precise match
        };

        const [localProds, agencyProds] = await Promise.all([
            fetchLocalProducts(),
            fetchAgencyProducts()
        ]);

        products = [...localProds, ...agencyProds];

        // Type filtering for Agency Products specifically if passed in query (double check)
        if (type) {
            if (type === 'nfr') {
                // Include only NFR (and legacy item which map to nfr)
                products = products.filter(p => p.type === 'nfr');
            } else {
                products = products.filter(p => p.type === type);
            }
        }

        // Sort combined list by name
        products.sort((a, b) => a.name.localeCompare(b.name));

        res.status(200).json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, ...updates } = req.body;
        delete updates.agencyId; // Prevent changing agency

        let product;
        if (type === 'cylinder') {
            product = await CylinderProduct.findOneAndUpdate(
                { _id: id, agencyId: req.user.agencyId },
                updates,
                { new: true }
            );
        } else if (type === 'nfr' || type === 'item') {
            product = await NFRProduct.findOneAndUpdate(
                { _id: id, agencyId: req.user.agencyId },
                updates,
                { new: true }
            );
        } else if (type === 'pr') {
            product = await PRProduct.findOneAndUpdate(
                { _id: id, agencyId: req.user.agencyId },
                updates,
                { new: true }
            );
        } else {
            return res.status(400).json({ success: false, message: 'Invalid product type for update' });
        }

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, message: 'Product updated successfully', product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle Product Status
const toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, isActive } = req.body;

        let product;
        const query = { _id: id, agencyId: req.user.agencyId };
        const update = { isActive };

        if (type === 'cylinder') {
            product = await CylinderProduct.findOneAndUpdate(query, update, { new: true });
        } else if (type === 'nfr' || type === 'item') {
            product = await NFRProduct.findOneAndUpdate(query, update, { new: true });
        } else if (type === 'pr') {
            product = await PRProduct.findOneAndUpdate(query, update, { new: true });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, message: `Product ${isActive ? 'activated' : 'deactivated'}`, product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Product
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // Pass type in query for delete

        let product;
        const query = { _id: id, agencyId: req.user.agencyId };

        if (type === 'cylinder') {
            product = await CylinderProduct.findOneAndDelete(query);
        } else if (type === 'nfr' || type === 'item') {
            product = await NFRProduct.findOneAndDelete(query);
        } else if (type === 'pr') {
            product = await PRProduct.findOneAndDelete(query);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Global Products that are not yet mapped to the agency
const getUnmappedGlobalProducts = async (req, res) => {
    try {
        const agencyId = req.user.agencyId;

        // Get IDs of global products already mapped
        const mappedProducts = await AgencyProduct.find({ agencyId }).select('globalProductId');
        const mappedProductIds = mappedProducts.map(p => p.globalProductId.toString());

        // Find global products NOT in the mapped list
        const unmappedProducts = await GlobalProduct.find({
            _id: { $nin: mappedProductIds },
            isActive: true
        }).sort({ name: 1 });

        res.status(200).json({ success: true, products: unmappedProducts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Map a Global Product to the Agency
const mapGlobalProduct = async (req, res) => {
    try {
        const { globalProductId, currentPurchasedPrice, currentSalePrice, openingStockFilled, openingStockEmpty, openingStockDefective } = req.body;
        const agencyId = req.user.agencyId;

        // Verify Global Product exists
        const globalProduct = await GlobalProduct.findById(globalProductId);
        if (!globalProduct) return res.status(404).json({ success: false, message: "Global product not found" });

        // Check if already mapped (double check)
        const existingMapping = await AgencyProduct.findOne({ agencyId, globalProductId });
        if (existingMapping) return res.status(409).json({ success: false, message: "Product already added to agency" });

        // Create Mapping
        const newMapping = new AgencyProduct({
            agencyId,
            globalProductId,
            localName: globalProduct.name, // Default to global name
            currentPurchasePrice: currentPurchasedPrice || 0,
            currentSalePrice: currentSalePrice || 0,
            isEnabled: true,
            openingStockFilled: openingStockFilled || 0,
            openingStockEmpty: openingStockEmpty || 0,
            openingStockDefective: openingStockDefective || 0,
        });

        await newMapping.save();

        res.status(201).json({ success: true, message: "Product added to agency inventory", product: newMapping });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    toggleProductStatus,
    deleteProduct,
    getUnmappedGlobalProducts,
    mapGlobalProduct
};
