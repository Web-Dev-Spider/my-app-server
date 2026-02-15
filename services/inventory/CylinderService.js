const CylinderTransaction = require('../../models/inventory/CylinderTransaction');
const mongoose = require('mongoose');

class CylinderService {

    /**
     * Create a generic cylinder transaction
     * @private
     */
    async _createTransaction(data, session = null) {
        const transaction = new CylinderTransaction({
            transactionDate: new Date(),
            ...data
        });

        if (session) {
            return await transaction.save({ session });
        }
        return await transaction.save();
    }

    /**
     * Refill Delivery: 
     * 1. Filled Cylinder: Agency -> Customer
     * 2. Empty Cylinder: Customer -> Agency
     */
    async refillDelivery({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        // Outgoing Filled
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'FILLED',
            quantity, // Outgoing is positive quantity in transaction context usually
            fromLocation: 'AGENCY',
            toLocation: 'CUSTOMER',
            referenceType: 'VOUCHER', // or INVOICE based on context
            voucherNo,
            createdBy
        }, session);

        // Incoming Empty
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'EMPTY',
            quantity,
            fromLocation: 'CUSTOMER', // Returning from customer
            toLocation: 'AGENCY',
            referenceType: 'VOUCHER',
            voucherNo,
            createdBy
        }, session);
    }

    /**
     * New Connection Delivery:
     * 1. Filled Cylinder: Agency -> Customer
     * (Note: PR issue is handled separately or implied)
     */
    async newConnectionDelivery({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'FILLED',
            quantity,
            fromLocation: 'AGENCY',
            toLocation: 'CUSTOMER',
            referenceType: 'VOUCHER',
            voucherNo,
            createdBy
        }, session);
    }

    /**
     * Defective Replacement From Customer:
     * 1. Defective Cylinder: Customer -> Agency
     * 2. Filled Cylinder: Agency -> Customer
     */
    async defectiveReplacementFromCustomer({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        // Incoming Defective
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'DEFECTIVE',
            quantity,
            fromLocation: 'CUSTOMER',
            toLocation: 'AGENCY',
            referenceType: 'DAC_NOTE', // Defective Acceptance Note
            voucherNo,
            createdBy
        }, session);

        // Outgoing Filled Replacement
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'FILLED',
            quantity,
            fromLocation: 'AGENCY',
            toLocation: 'CUSTOMER',
            referenceType: 'VOUCHER',
            voucherNo,
            createdBy,
            remarks: 'Replacement for defective cylinder'
        }, session);
    }

    /**
     * Receive From Plant:
     * 1. Filled Cylinder: Plant -> Agency
     */
    async receiveFromPlant({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'FILLED',
            quantity,
            fromLocation: 'PLANT',
            toLocation: 'AGENCY',
            referenceType: 'VOUCHER', // Or Purchase Receipt
            voucherNo,
            createdBy
        }, session);
    }

    /**
     * Send Empty To Plant:
     * 1. Empty Cylinder: Agency -> Plant
     */
    async sendEmptyToPlant({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'EMPTY',
            quantity,
            fromLocation: 'AGENCY',
            toLocation: 'PLANT',
            referenceType: 'VOUCHER',
            voucherNo,
            createdBy
        }, session);
    }

    /**
     * Return Defective To Plant (with Price Return/Credit):
     * 1. Defective: Agency -> Plant
     * Note: "when the plant receives the defective cylinder, they would return the price... so change accordingly."
     * This implies a return for credit, not a direct swap. The replacement filled cylinder would be a separate purchase.
     */
    async returnDefectiveToPlant({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        // Outgoing Defective (Return to Vendor)
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'DEFECTIVE',
            quantity,
            fromLocation: 'AGENCY',
            toLocation: 'PLANT',
            referenceType: 'VOUCHER', // Debit Note / Return Voucher
            voucherNo,
            createdBy,
            remarks: 'Defective returned to plant for credit'
        }, session);
    }

    /**
     * Initialize Opening Stock:
     * Creates initial stock entries for Filled, Empty, and Defective cylinders.
     */
    async initializeStock({ agencyId, cylinderProductId, filled, empty, defective, createdBy, session }) {
        const commonData = {
            agencyId,
            cylinderProductId,
            fromLocation: 'PLANT', // Source for initial stock
            toLocation: 'AGENCY',
            referenceType: 'VOUCHER', // Opening Balance
            voucherNo: 'OPENING-STOCK',
            createdBy
        };

        if (filled > 0) {
            await this._createTransaction({ ...commonData, condition: 'FILLED', quantity: filled }, session);
        }
        if (empty > 0) {
            await this._createTransaction({ ...commonData, condition: 'EMPTY', quantity: empty }, session);
        }
        if (defective > 0) {
            await this._createTransaction({ ...commonData, condition: 'DEFECTIVE', quantity: defective }, session);
        }
    }

    /**
     * Inter-Agency Transfer:
     * Cylinders moving between agencies.
     * direction: 'OUT' (Agency -> Other) | 'IN' (Other -> Agency)
     */
    async interAgencyTransfer({ agencyId, otherAgencyId, cylinderProductId, condition, quantity, direction, voucherNo, createdBy, session }) {
        const fromLocation = direction === 'OUT' ? 'AGENCY' : 'OTHER_AGENCY';
        const toLocation = direction === 'OUT' ? 'OTHER_AGENCY' : 'AGENCY';

        // Additional validation could be added here to ensure valid condition

        await this._createTransaction({
            agencyId,
            relatedAgencyId: otherAgencyId,
            cylinderProductId,
            condition, // Any condition (Filled/Empty/Defective) passed by caller
            quantity,
            fromLocation,
            toLocation,
            referenceType: 'VOUCHER',
            voucherNo,
            createdBy
        }, session);
    }

    /**
     * Connection Termination (Surrender):
     * 1. Empty Cylinder: Customer -> Agency
     * Note: "One non-valuated pr and empty cylinder with the customer will be added to the agency stock."
     * This function handles the Cylinder part. The PR part should be handled by PRService or similar.
     */
    async connectionTermination({ agencyId, cylinderProductId, quantity, voucherNo, createdBy, session }) {
        // Return Empty Cylinder to Agency Stock
        await this._createTransaction({
            agencyId,
            cylinderProductId,
            condition: 'EMPTY', // Assuming returned cylinder is empty
            quantity,
            fromLocation: 'CUSTOMER',
            toLocation: 'AGENCY',
            referenceType: 'VOUCHER', // TV (Termination Voucher)
            voucherNo,
            createdBy,
            remarks: 'Connection Termination / Surrender'
        }, session);

        // TODO: Update PR Stock (Non-Valuated PR +1)
        // Since PRTransaction model is not explicitly defined in requirements yet, 
        // we acknowledge this requirement here. A separate PRTransaction or Stock update call would go here.
    }
}

module.exports = new CylinderService();
