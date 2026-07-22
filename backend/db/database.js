/**
 * backend/db/database.js
 *
 * Creates and exports the SQLite database connection.
 *
 * SQLite stores data in a local file instead of a separate database server.
 * For this project, that file is:
 *
 * ./db/orderops.sqlite
 */

const sqlite3 = require("sqlite3").verbose();

/**
 * Local SQLite database file path.
 *
 * This file is created automatically if it does not already exist.
 */
const DATABASE_PATH = "./db/orderops.sqlite";

/**
 * Open the database connection.
 *
 * Other backend files import this connection when they need to:
 * - read products
 * - create orders
 * - create marketplace listings
 * - create or resolve sync issues
 */
const db = new sqlite3.Database(DATABASE_PATH, (error) => {
  if (error) {
    console.error("Database connection error:", error.message);
    return;
  }

  console.log(`Connected to SQLite database at ${DATABASE_PATH}`);
});

module.exports = db;
