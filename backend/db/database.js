/**
 * backend/db/database.js
 *
 * Creates and exports the SQLite database connection.
 * SQLite stores the app data in a local .sqlite file.
 */

// Import sqlite3 and enable verbose mode for clearer database error messages.
const sqlite3 = require("sqlite3").verbose();

// Path to the SQLite database file.
// This file will be created automatically when the backend starts.
const DATABASE_PATH = "./db/orderops.sqlite";

// Open a connection to the SQLite database.
const db = new sqlite3.Database(DATABASE_PATH, (error) => {
  // If there is a database connection problem, show the error.
  if (error) {
    console.error("Database connection error:", error.message);
    return;
  }

  // If the connection works, print a success message.
  console.log(`Connected to SQLite database at ${DATABASE_PATH}`);
});

// Export the database connection so other files can use it.
module.exports = db;
