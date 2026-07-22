/**
 * backend/controllers/importController.js
 *
 * CSV import controller for marketplace listings.
 *
 * This file handles importing a CSV file and turning each CSV row into:
 * - an internal product
 * - a marketplace listing
 * - sync issues when something does not match
 *
 * Important:
 * This version avoids creating duplicate listings and duplicate open issues
 * when the same CSV is imported more than once.
 */

const fs = require("fs");
const csv = require("csv-parser");
const db = require("../db/database");

/**
 * Convert CSV text values into numbers.
 */
function getNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * Clean text from the CSV by removing extra spaces.
 */
function normalizeText(value) {
  return String(value || "").trim();
}

/**
 * Promise wrapper for db.run().
 *
 * SQLite uses callbacks by default.
 * This helper lets us use async/await so the import code is easier to read.
 */
function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (error) {
      if (error) return reject(error);
      resolve(this);
    });
  });
}

/**
 * Promise wrapper for db.get().
 *
 * Used when we expect one database row back.
 */
function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) return reject(error);
      resolve(row);
    });
  });
}

/**
 * Insert or update a product using its SKU.
 *
 * If the SKU already exists, the product gets updated.
 * If the SKU does not exist, a new product gets created.
 */
async function upsertProduct(row) {
  const sku = normalizeText(row.sku);
  const productName = normalizeText(row.product_name);
  const brand = normalizeText(row.brand);
  const category = normalizeText(row.category);
  const basePrice = getNumber(row.base_price);
  const inventoryCount = getNumber(row.inventory_count);
  const imageStatus = normalizeText(row.image_status) || "Not Checked";

  if (!sku || !productName) {
    throw new Error("CSV row is missing sku or product_name");
  }

  await dbRun(
    `
    INSERT INTO products (
      sku,
      product_name,
      brand,
      category,
      base_price,
      inventory_count,
      image_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(sku) DO UPDATE SET
      product_name = excluded.product_name,
      brand = excluded.brand,
      category = excluded.category,
      base_price = excluded.base_price,
      inventory_count = excluded.inventory_count,
      image_status = excluded.image_status,
      updated_at = CURRENT_TIMESTAMP
    `,
    [
      sku,
      productName,
      brand || null,
      category || null,
      basePrice,
      inventoryCount,
      imageStatus,
    ]
  );

  return dbGet("SELECT * FROM products WHERE sku = ?", [sku]);
}

/**
 * Insert or update a marketplace listing.
 *
 * The unique business key here is:
 * - product_id
 * - marketplace
 * - marketplace_sku
 *
 * If that same listing already exists, update it instead of creating duplicates.
 */
async function upsertListing(product, row) {
  const marketplace = normalizeText(row.marketplace);
  const marketplaceSku = normalizeText(row.marketplace_sku);
  const listingUrl = normalizeText(row.listing_url);
  const listingPrice = getNumber(row.listing_price);
  const listingInventory = getNumber(row.listing_inventory);
  const listingStatus = normalizeText(row.listing_status) || "Active";

  if (!marketplace) {
    throw new Error("CSV row is missing marketplace");
  }

  const existingListing = await dbGet(
    `
    SELECT *
    FROM marketplace_listings
    WHERE product_id = ?
      AND marketplace = ?
      AND marketplace_sku = ?
    `,
    [product.id, marketplace, marketplaceSku]
  );

  if (existingListing) {
    await dbRun(
      `
      UPDATE marketplace_listings
      SET
        listing_url = ?,
        listing_price = ?,
        listing_inventory = ?,
        listing_status = ?,
        sync_status = ?,
        last_checked = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [
        listingUrl || null,
        listingPrice,
        listingInventory,
        listingStatus,
        "Imported",
        existingListing.id,
      ]
    );

    return dbGet("SELECT * FROM marketplace_listings WHERE id = ?", [
      existingListing.id,
    ]);
  }

  const result = await dbRun(
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
      product.id,
      marketplace,
      marketplaceSku || null,
      listingUrl || null,
      listingPrice,
      listingInventory,
      listingStatus,
      "Imported",
    ]
  );

  return dbGet("SELECT * FROM marketplace_listings WHERE id = ?", [
    result.lastID,
  ]);
}

/**
 * Create a sync issue only if the same open issue does not already exist.
 *
 * This prevents duplicate "Price Mismatch" or "Inventory Mismatch" cards
 * every time the same CSV is uploaded.
 */
async function createSyncIssueIfMissing(product, listing, issueType, severity, notes) {
  const existingIssue = await dbGet(
    `
    SELECT id
    FROM sync_issues
    WHERE product_id = ?
      AND listing_id = ?
      AND issue_type = ?
      AND issue_status != 'Resolved'
    `,
    [product.id, listing.id, issueType]
  );

  if (existingIssue) {
    return null;
  }

  const result = await dbRun(
    `
    INSERT INTO sync_issues (
      product_id,
      listing_id,
      issue_type,
      issue_severity,
      issue_status,
      issue_notes
    )
    VALUES (?, ?, ?, ?, 'Open', ?)
    `,
    [product.id, listing.id, issueType, severity, notes]
  );

  return result.lastID;
}

/**
 * Compare product data against marketplace listing data.
 *
 * This is the main business logic.
 */
async function detectIssues(product, listing, row) {
  const createdIssues = [];

  const basePrice = getNumber(product.base_price);
  const inventoryCount = getNumber(product.inventory_count);
  const imageStatus = normalizeText(row.image_status).toLowerCase();
  const listingPrice = getNumber(listing.listing_price);
  const listingInventory = getNumber(listing.listing_inventory);
  const listingStatus = normalizeText(listing.listing_status).toLowerCase();

  if (basePrice !== listingPrice) {
    const issueId = await createSyncIssueIfMissing(
      product,
      listing,
      "Price Mismatch",
      "Medium",
      `${listing.marketplace} price is ${listingPrice}, but internal base price is ${basePrice}.`
    );

    if (issueId) createdIssues.push(issueId);
  }

  if (inventoryCount !== listingInventory) {
    const issueId = await createSyncIssueIfMissing(
      product,
      listing,
      "Inventory Mismatch",
      "High",
      `${listing.marketplace} inventory is ${listingInventory}, but internal inventory is ${inventoryCount}.`
    );

    if (issueId) createdIssues.push(issueId);
  }

  if (imageStatus === "missing") {
    const issueId = await createSyncIssueIfMissing(
      product,
      listing,
      "Missing Image",
      "High",
      `${listing.marketplace} listing is missing a product image.`
    );

    if (issueId) createdIssues.push(issueId);
  }

  if (inventoryCount === 0 && listingStatus === "active") {
    const issueId = await createSyncIssueIfMissing(
      product,
      listing,
      "Active Listing With No Stock",
      "High",
      `${listing.marketplace} listing is active even though internal stock is zero.`
    );

    if (issueId) createdIssues.push(issueId);
  }

  return createdIssues;
}

/**
 * POST /api/import/listings
 *
 * Main CSV import endpoint.
 */
function importListingsCsv(req, res) {
  if (!req.file) {
    return res.status(400).json({
      message: "CSV file is required. Use form field name: file",
    });
  }

  const rows = [];
  const filePath = req.file.path;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => rows.push(row))
    .on("end", async () => {
      let importedProducts = 0;
      let importedListings = 0;
      let createdIssues = 0;

      try {
        for (const row of rows) {
          const product = await upsertProduct(row);
          const listing = await upsertListing(product, row);
          const issues = await detectIssues(product, listing, row);

          importedProducts += 1;
          importedListings += 1;
          createdIssues += issues.length;
        }

        fs.unlinkSync(filePath);

        res.json({
          message: "CSV imported successfully",
          rows: rows.length,
          importedProducts,
          importedListings,
          createdIssues,
        });
      } catch (error) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        res.status(500).json({
          message: "Failed to import CSV",
          error: error.message,
        });
      }
    })
    .on("error", (error) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.status(500).json({
        message: "Failed to read CSV",
        error: error.message,
      });
    });
}

module.exports = {
  importListingsCsv,
};
