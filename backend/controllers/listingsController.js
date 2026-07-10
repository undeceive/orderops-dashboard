/**
 * backend/controllers/listingsController.js
 *
 * Controller functions for marketplace listings.
 */

const db = require("../db/database");

function getAllListings(req, res) {
  db.all(
    `
    SELECT
      marketplace_listings.id,
      marketplace_listings.product_id,
      marketplace_listings.marketplace,
      marketplace_listings.marketplace_sku,
      marketplace_listings.listing_url,
      marketplace_listings.listing_price,
      marketplace_listings.listing_inventory,
      marketplace_listings.listing_status,
      marketplace_listings.sync_status,
      marketplace_listings.last_checked,
      marketplace_listings.updated_at,
      products.sku,
      products.product_name,
      products.brand,
      products.base_price,
      products.inventory_count,
      products.image_status
    FROM marketplace_listings
    JOIN products ON products.id = marketplace_listings.product_id
    ORDER BY marketplace_listings.updated_at DESC
    `,
    [],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          message: "Failed to fetch marketplace listings",
          error: error.message,
        });
      }

      res.json({
        count: rows.length,
        listings: rows,
      });
    }
  );
}

function createListing(req, res) {
  const {
    product_id,
    marketplace,
    marketplace_sku,
    listing_url,
    listing_price,
    listing_inventory,
    listing_status,
    sync_status,
  } = req.body;

  if (!product_id || !marketplace) {
    return res.status(400).json({
      message: "product_id and marketplace are required",
    });
  }

  db.run(
    `
    INSERT INTO marketplace_listings (
      product_id,
      marketplace,
      marketplace_sku,
      listing_url,
      listing_price,
      listing_inventory,
      listing_status,
      sync_status,
      last_checked
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `,
    [
      product_id,
      marketplace,
      marketplace_sku || null,
      listing_url || null,
      listing_price ?? 0,
      listing_inventory ?? 0,
      listing_status || "Active",
      sync_status || "Not Checked",
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to create marketplace listing",
          error: error.message,
        });
      }

      res.status(201).json({
        message: "Marketplace listing created",
        listing_id: this.lastID,
      });
    }
  );
}

module.exports = {
  getAllListings,
  createListing,
};
