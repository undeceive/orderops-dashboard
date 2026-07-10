/**
 * backend/server.js
 *
 * Main Express server for OrderOps Dashboard.
 * Starts the API and initializes the SQLite database tables.
 */

const express = require("express");
const cors = require("cors");

const { PORT } = require("./config/env");
const { initializeDatabase } = require("./db/schema");
const productsRoutes = require("./routes/productsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const listingsRoutes = require("./routes/listingsRoutes");
const syncIssuesRoutes = require("./routes/syncIssuesRoutes");

const app = express();

app.use(cors());
app.use(express.json());

initializeDatabase();

app.get("/", (req, res) => {
  res.json({
    message: "OrderOps Dashboard API is running",
    project: "Marketplace Sync Dashboard",
  });
});

app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/sync-issues", syncIssuesRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "initialized",
  });
});

app.listen(PORT, () => {
  console.log(`OrderOps API running on port ${PORT}`);
});
