const mongoose = require("mongoose");
const StockLedger = require("../models/StockLedger");
const LocationStockTransaction = require("../models/LocationStockTransaction");
const AgencyProduct = require("../models/inventory/AgencyProduct");

/**
 * executeStockMovement
 *
 * Atomically transfers stock between two locations using mongoose sessions.
 * Called by every stock API — never write direct ledger updates outside this function.
 *
 * @param {Object} params
 * @param {ObjectId} params.agencyId
 * @param {ObjectId} params.sourceLocationId      - null for PURCHASE (stock enters system)
 * @param {ObjectId} params.destinationLocationId - null for CUSTOMER_SALE (stock leaves system)
 * @param {String}   params.transactionType       - from StockTransaction enum
 * @param {Array}    params.lines                 - [{ agencyProductId, stockField, quantity, unitPrice, productLabel }]
 * @param {ObjectId} params.createdBy             - userId
 * @param {Object}   params.meta                  - { driverName, driverPhone, driverUserId, shift, remarks, parentTransactionId }
 * @param {Boolean}  params.allowOverdraft        - admin override flag
 *
 * @returns {Object} { success: true, transaction, warnings }
 * @throws  {Error}  if insufficient stock and allowOverdraft is false
 */
async function executeStockMovement(params) {
  const {
    agencyId,
    sourceLocationId,
    destinationLocationId,
    transactionType,
    lines,
    createdBy,
    meta = {},
    allowOverdraft = false,
  } = params;

  const session = await mongoose.startSession();
  let transaction = null;
  const warnings = [];

  try {
    await session.withTransaction(async () => {
      // 1. Validate and process each line
      const processedLines = [];

      for (const line of lines) {
        const { agencyProductId, stockField, quantity, unitPrice = 0, productLabel = "" } = line;

        // a. Debit source location if sourceLocationId exists
        if (sourceLocationId !== null) {
          const sourceLedger = await StockLedger.findOne(
            { agencyId, agencyProductId, locationId: sourceLocationId },
            null,
            { session },
          );

          const availableQuantity = sourceLedger ? sourceLedger.stock[stockField] || 0 : 0;

          if (availableQuantity < quantity && !allowOverdraft) {
            throw new Error(
              `Insufficient stock at source location. Product: ${productLabel}, Field: ${stockField}, ` +
                `Available: ${availableQuantity}, Required: ${quantity}`,
            );
          }

          if (availableQuantity < quantity && allowOverdraft) {
            warnings.push({
              productLabel,
              stockField,
              available: availableQuantity,
              requested: quantity,
              overdraft: quantity - availableQuantity,
            });
            line.isOverride = true;
          }

          // Debit source ledger
          await StockLedger.findOneAndUpdate(
            { agencyId, agencyProductId, locationId: sourceLocationId },
            {
              $inc: { [`stock.${stockField}`]: -quantity },
              $set: { lastMovementAt: new Date() },
            },
            { session, upsert: true, new: true },
          );
        }

        // b. Credit destination location if destinationLocationId exists
        if (destinationLocationId !== null) {
          await StockLedger.findOneAndUpdate(
            { agencyId, agencyProductId, locationId: destinationLocationId },
            {
              $inc: { [`stock.${stockField}`]: +quantity },
              $set: { lastMovementAt: new Date() },
            },
            { session, upsert: true, new: true },
          );
        }

        // c. For PURCHASE: increment AgencyProduct aggregate (new stock entering system)
        if (transactionType === "PURCHASE") {
          await AgencyProduct.findByIdAndUpdate(
            agencyProductId,
            {
              $inc: { [`stock.${stockField}`]: +quantity },
            },
            { session, new: true },
          );
        }

        // d. For CUSTOMER_SALE: decrement AgencyProduct aggregate (stock leaving system)
        if (transactionType === "CUSTOMER_SALE") {
          await AgencyProduct.findByIdAndUpdate(
            agencyProductId,
            {
              $inc: { [`stock.${stockField}`]: -quantity },
            },
            { session, new: true },
          );
        }

        // Calculate line totals
        line.totalValue = quantity * unitPrice;
        line.productLabel = productLabel;
        processedLines.push(line);
      }

      // 2. Calculate transaction totals
      const totalQuantity = processedLines.reduce((sum, line) => sum + line.quantity, 0);
      const totalValue = processedLines.reduce((sum, line) => sum + line.totalValue, 0);

      // 3. Create StockTransaction document
      transaction = new LocationStockTransaction({
        agencyId,
        sourceLocationId,
        destinationLocationId,
        transactionType,
        lines: processedLines,
        totalQuantity,
        totalValue,
        createdBy,
        driverName: meta.driverName || null,
        driverPhone: meta.driverPhone || null,
        driverUserId: meta.driverUserId || null,
        tripNumber: meta.tripNumber || 1,
        remarks: meta.remarks || null,
        parentTransactionId: meta.parentTransactionId || null,
        status: "CONFIRMED",
      });

      await transaction.save({ session });

      // 4. Update lastMovementAt on all affected ledger documents
      // (already done in the debit/credit operations above)
    });

    return {
      success: true,
      transaction,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    await session.endSession();
    throw error;
  } finally {
    await session.endSession();
  }
}

module.exports = { executeStockMovement };
