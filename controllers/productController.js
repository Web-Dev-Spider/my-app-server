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
                    productType: gp.productType,
                    name: ap.localName || gp.name,
                    productCode: gp.productCode,
                    itemCode: ap.itemCode,
                    capacityKg: gp.capacityKg,
                    category: gp.category,
                    subcategory: gp.subcategory,
                    valuationType: gp.valuationType,
                    unit: gp.unit || 'NOS',
                    hsnCode: gp.hsnCode,
                    taxRate: gp.taxRate,
                    currentPurchasePrice: ap.purchasePrice,
                    currentSalePrice: ap.currentSalePrice,
                    priceEffectiveDate: ap.priceEffectiveDate,
                    isActive: ap.isEnabled,
                    isGlobal: true,
                    isFiber: gp.isFiber,
                    isReturnable: gp.isReturnable,
                    stock: ap.stock
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
        console.log(`[getUnmappedGlobalProducts] Fetching for agency: ${agencyId}`);

        // 1. Get all AgencyProducts (mapped global products)
        // Use lean() for performance
        const agencyProducts = await AgencyProduct.find({ agencyId }).select('globalProductId').lean();

        const mappedGlobalIds = agencyProducts
            .map(p => p.globalProductId ? p.globalProductId.toString() : null)
            .filter(Boolean);

        console.log(`[getUnmappedGlobalProducts] Found ${mappedGlobalIds.length} mapped products.`);

        // DEBUG: Check totals
        const totalGlobal = await GlobalProduct.countDocuments({});
        const totalActive = await GlobalProduct.countDocuments({ isActive: true });
        console.log(`[getUnmappedGlobalProducts] DEBUG: Total Global: ${totalGlobal}, Total Active: ${totalActive}`);

        // 2. Find global products NOT in the mapped list
        // Use limit to prevent timeouts if list is huge
        const unmappedProducts = await GlobalProduct.find({
            _id: { $nin: mappedGlobalIds },
            isActive: true
        })
            .select('name productCode productType variant category capacityKg businessType') // Select only essential fields + businessType
            .sort({ name: 1 })
            .limit(500) // Increase limit reasonably, but keep it safe
            .lean();

        console.log(`[getUnmappedGlobalProducts] Returning ${unmappedProducts.length} unmapped products.`);

        res.status(200).json({ success: true, products: unmappedProducts });
    } catch (error) {
        console.error("[getUnmappedGlobalProducts] Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Map a Global Product to the Agency
const mapGlobalProduct = async (req, res) => {
    try {
        const {
            globalProductId,
            currentPurchasePrice,
            currentSalePrice,
            openingStockFilled,
            openingStockEmpty,
            openingStockDefective,
            openingStockSound,
            openingStockDefectivePR,
            // NFR-specific fields from frontend
            localName,
            itemCode,
            priceEffectiveDate
        } = req.body;

        const agencyId = req.user.agencyId;

        // Verify Global Product exists
        const globalProduct = await GlobalProduct.findById(globalProductId);
        if (!globalProduct) return res.status(404).json({ success: false, message: "Global product not found" });

        // Check if already mapped
        const existingMapping = await AgencyProduct.findOne({ agencyId, globalProductId });
        if (existingMapping) return res.status(409).json({ success: false, message: "Product already added to agency" });

        // Prepare Opening Stock Object based on product type
        let openingStockData = {};
        let stockData = {};

        if (globalProduct.productType === 'CYLINDER') {
            // Cylinders have detailed opening stock
            openingStockData = {
                filled: { quantity: Number(openingStockFilled) || 0, price: Number(currentPurchasePrice) || 0 },
                empty: { quantity: Number(openingStockEmpty) || 0 },
                defective: { quantity: Number(openingStockDefective) || 0 }
            };
            // Initial Live Stock matches Opening Stock
            stockData = {
                filled: Number(openingStockFilled) || 0,
                empty: Number(openingStockEmpty) || 0,
                defective: Number(openingStockDefective) || 0
            };
        } else if (globalProduct.productType === 'PR') {
            // PRs have sound/defective
            openingStockData = {
                sound: { quantity: Number(openingStockSound) || 0, price: Number(currentPurchasePrice) || 0 },
                defectivePR: { quantity: Number(openingStockDefectivePR) || 0 }
            };
            stockData = {
                sound: Number(openingStockSound) || 0,
                defectivePR: Number(openingStockDefectivePR) || 0
            };
        } else {
            // NFR / FTL items (quantity only)
            openingStockData = { simple: { quantity: Number(openingStockFilled) || 0, purchasePrice: Number(currentPurchasePrice) || 0, sellingPrice: Number(currentSalePrice) || 0 } };
            stockData = { quantity: Number(openingStockFilled) || 0 };
        }

        // Create Mapping
        const newMapping = new AgencyProduct({
            agencyId,
            globalProductId,
            itemCode: itemCode || globalProduct.productCode,
            localName: localName || globalProduct.name,
            purchasePrice: Number(currentPurchasePrice) || 0,
            currentSalePrice: Number(currentSalePrice) || 0,
            priceEffectiveDate: priceEffectiveDate || new Date(),
            isEnabled: true,
            openingStock: openingStockData,
            stock: {
                filled: stockData.filled || 0,
                empty: stockData.empty || 0,
                defective: stockData.defective || 0,
                sound: stockData.sound || 0,
                defectivePR: stockData.defectivePR || 0,
                quantity: stockData.quantity || 0
            }
        });

        await newMapping.save();

        // Also create an OPENING_STOCK transaction? 
        // Ideally yes, but for now we just set the initial state. 
        // The user can create transactions later or we can auto-create here.
        // Let's keep it simple for now as requested.

        res.status(201).json({ success: true, message: "Product added to agency inventory", product: newMapping });
    } catch (error) {
        console.error("Map Error:", error);
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
