/**
 * backend/db/schema.js
 *
 * Defines the database tables for OrderOps Dashboard.
 *
 * OrderOps is a marketplace sync dashboard inspired by a real business idea:
 * keeping product listings, prices, inventory, images, and platform statuses
 * consistent across multiple e-commerce sales channels.
 */

const db = require("./database");

function initializeDatabase() {
  db.serialize(() => {
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
