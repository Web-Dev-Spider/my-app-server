const StockLocation = require("../models/StockLocation");
const mongoose = require("mongoose");

/**
 * Returns the agency's default godown (oldest active GODOWN location).
 * If none exists, silently creates "Main Godown" and returns it.
 *
 * @param {ObjectId} agencyId
 * @param {Object} session - mongoose session (optional, for transactional safety)
 * @returns {Promise<StockLocation>} the default godown document
 */
const getOrCreateDefaultGodown = async (agencyId, session = null) => {
  try {
    // Try to find existing default godown (oldest active GODOWN)
    const query = StockLocation.findOne({
      agencyId,
      locationType: "GODOWN",
      isActive: true,
    }).sort({ createdAt: 1 });

    let defaultGodown = session ? await query.session(session) : await query;

    if (defaultGodown) {
      return defaultGodown;
    }

    // No godown exists, create Main Godown silently
    const newGodown = new StockLocation({
      agencyId,
      locationType: "GODOWN",
      name: "Main Godown",
      code: "GDN-01",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (session) {
      await newGodown.save({ session });
    } else {
      await newGodown.save();
    }

    return newGodown;
  } catch (error) {
    console.error("getOrCreateDefaultGodown Error:", error);
    throw error;
  }
};

module.exports = { getOrCreateDefaultGodown };
