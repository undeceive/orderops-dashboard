/**
 * backend/routes/listingsRoutes.js
 *
 * Marketplace listing API routes.
 */

const express = require("express");

const {
  getAllListings,
  createListing,
} = require("../controllers/listingsController");

const router = express.Router();

router.get("/", getAllListings);
router.post("/", createListing);

module.exports = router;
