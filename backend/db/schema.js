/**
 * backend/db/schema.js
 *
 * Defines the database tables for OrderOps Dashboard.
 *
 * OrderOps is a marketplace sync dashboard inspired by real e-commerce work:
 * keeping product listings, prices, inventory, images, and marketplace statuses
 * consistent across sales channels like Walmart, Amazon, eBay, and Shopify.
 */

const db = require("./database");

/**
 * initializeDatabase()
 *
 * Creates all required tables if they do not already exist.
 *
 * This lets the app start safely even when the SQLite database file is new.
 */
function initializeDatabase() {
  db.serialize(() => {
    /**
     * products
     *
     * Stores the internal product record.
     *
     * This is the company-side view of a product:
     * - SKU
     * - product name
     * - brand/category
     * - base price
     * - inventory count
     * - image status
     */
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        sku TEXT NOT NULL UNIQUE,
        product_name TEXT NOT NULL,
        brand TEXT,
        category TEXT,

        base_price REAL DEFAULT 0,
        inventory_count INTEGER DEFAULT 0,

        image_url TEXT,
        image_status TEXT DEFAULT 'Not Checked',

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    /**
     * marketplace_listings
     *
     * Stores the marketplace version of a product.
     *
     * Example:
     * One product can have separate listings on:
     * - Walmart
     * - Amazon
     * - eBay
     * - Shopify
     *
     * This table lets us compare marketplace price/inventory/status
     * against the internal product record.
     */
    db.run(`
      CREATE TABLE IF NOT EXISTS marketplace_listings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        product_id INTEGER NOT NULL,

        marketplace TEXT NOT NULL,
        marketplace_sku TEXT,
        listing_url TEXT,

        listing_price REAL DEFAULT 0,
        listing_inventory INTEGER DEFAULT 0,

        listing_status TEXT DEFAULT 'Active',
        sync_status TEXT DEFAULT 'Not Checked',

        last_checked TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    /**
     * sync_issues
     *
     * Stores problems that need attention.
     *
     * Examples:
     * - Price Mismatch
     * - Inventory Mismatch
     * - Missing Image
     * - Active Listing With No Stock
     *
     * This is what makes the dashboard useful as a daily work board.
     */
    db.run(`
      CREATE TABLE IF NOT EXISTS sync_issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        product_id INTEGER NOT NULL,
        listing_id INTEGER,

        issue_type TEXT NOT NULL,
        issue_severity TEXT DEFAULT 'Medium',
        issue_status TEXT DEFAULT 'Open',
        issue_notes TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        resolved_at TEXT,

        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id)
      )
    `);

    /**
     * orders
     *
     * Stores marketplace orders that need tracking.
     *
     * This can help identify orders that are:
     * - pending
     * - ready to ship
     * - shipped
     * - delayed
     */
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        marketplace TEXT NOT NULL,
        marketplace_order_id TEXT NOT NULL UNIQUE,
        customer_name TEXT,

        order_status TEXT DEFAULT 'Pending',
        total_amount REAL DEFAULT 0,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

module.exports = { initializeDatabase };
