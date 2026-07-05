/**
 * backend/db/schema.js
 *
 * Defines and initializes the database tables used by the backend.
 * This file keeps database structure separate from server startup logic.
 */

// Import the shared SQLite database connection.
const db = require("./database");

/**
 * Creates all required database tables if they do not already exist.
 *
 * This function is safe to run every time the server starts because
 * CREATE TABLE IF NOT EXISTS will not overwrite an existing table.
 */
function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        marketplace TEXT NOT NULL,
        order_number TEXT NOT NULL,
        order_date TEXT,
        customer_name TEXT,
        state TEXT,

        sku TEXT,
        item_name TEXT,
        quantity INTEGER DEFAULT 0,

        weight REAL DEFAULT 0,
        length REAL DEFAULT 0,
        width REAL DEFAULT 0,
        height REAL DEFAULT 0,

        carrier TEXT,
        shipping_status TEXT DEFAULT 'Pending',
        tracking_number TEXT,

        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

// Export the initializer so server.js can run it when the API starts.
module.exports = {
  initializeDatabase,
};
