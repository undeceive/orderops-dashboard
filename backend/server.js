/**
 * backend/server.js
 *
 * Main Express server for OrderOps Dashboard.
 *
 * This file is responsible for:
 * - Creating the Express app
 * - Enabling CORS so the React frontend can call the backend
 * - Allowing the API to receive JSON request bodies
 * - Initializing the SQLite database tables
 * - Connecting all API route files
 * - Starting the backend server on the configured port
 */

const express = require("express");
const cors = require("cors");

const { PORT } = require("./config/env");
const { initializeDatabase } = require("./db/schema");

// Route files keep the server organized.
// Each route file handles one major feature area.
const productsRoutes = require("./routes/productsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const listingsRoutes = require("./routes/listingsRoutes");
const syncIssuesRoutes = require("./routes/syncIssuesRoutes");

// Create the Express app.
const app = express();

/**
 * Middleware
 *
 * cors():
 * Allows the frontend running on another port, like localhost:5173,
 * to make requests to this backend on localhost:5000.
 *
 * express.json():
 * Allows the backend to read JSON request bodies from POST/PUT/PATCH requests.
 */
app.use(cors());
app.use(express.json());

/**
 * Initialize database tables before routes are used.
 *
 * This makes sure the required SQLite tables exist:
 * - products
 * - marketplace_listings
 * - sync_issues
 * - orders
 */
initializeDatabase();

/**
 * Root route.
 *
 * Useful for quickly testing that the API is online.
 */
app.get("/", (req, res) => {
  res.json({
    message: "OrderOps Dashboard API is running",
    project: "Marketplace Sync Dashboard",
  });
});

/**
 * API route groups.
 *
 * These connect URL paths to their route files.
 */
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/sync-issues", syncIssuesRoutes);

/**
 * Health check route.
 *
 * This is useful for confirming the backend and database initialized correctly.
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "initialized",
  });
});

/**
 * Start the server.
 */
app.listen(PORT, () => {
  console.log(`OrderOps API running on port ${PORT}`);
});
