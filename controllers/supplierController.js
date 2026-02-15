const Supplier = require('../models/inventory/Supplier');

// Create Supplier
const createSupplier = async (req, res) => {
    try {
        const { name, gstNumber, contactPerson, contactNumber, email, address } = req.body;
        const check = await Supplier.findOne({ name, agencyId: req.user.agencyId });
        if (check) return res.status(400).json({ success: false, message: 'Supplier already exists with this name' });

        const supplier = new Supplier({
            agencyId: req.user.agencyId,
            name, gstNumber, contactPerson, contactNumber, email, address
        });
        await supplier.save();
        res.status(201).json({ success: true, message: 'Supplier added successfully', supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Suppliers
const getSuppliers = async (req, res) => {
    try {
        const filters = { agencyId: req.user.agencyId };
        if (req.query.active === 'true') filters.isActive = true;

        const suppliers = await Supplier.find(filters).sort({ createdAt: -1 });
        res.status(200).json({ success: true, suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        delete updates.agencyId; // Prevent changing agency ownership

        const supplier = await Supplier.findOneAndUpdate(
            { _id: id, agencyId: req.user.agencyId },
            updates,
            { new: true }
        );

        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.status(200).json({ success: true, message: 'Supplier updated successfully', supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle Status (Activate / Deactivate)
const toggleSupplierStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const supplier = await Supplier.findOneAndUpdate(
            { _id: id, agencyId: req.user.agencyId },
            { isActive },
            { new: true }
        );

        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });

        const action = isActive ? 'activated' : 'deactivated';
        res.status(200).json({ success: true, message: `Supplier ${action} successfully`, supplier });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Supplier (Hard delete or soft delete logic based on requirement, but usually better to deactivate if used in transactions)
// However, if strict user request for 'delete', checking usage first is good practice.
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        // Ideally check if used in transactions
        const supplier = await Supplier.findOneAndDelete({ _id: id, agencyId: req.user.agencyId });

        if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
        res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    updateSupplier,
    toggleSupplierStatus,
    deleteSupplier
};
