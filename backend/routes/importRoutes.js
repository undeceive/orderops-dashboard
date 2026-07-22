/**
 * backend/routes/importRoutes.js
 *
 * Routes for importing marketplace data from CSV files.
 *
 * This route lets the user upload a CSV file from the frontend or curl.
 * The uploaded file is handled by multer, then passed to the import controller.
 */

const express = require("express");
const multer = require("multer");

const {
  importListingsCsv,
} = require("../controllers/importController");

const router = express.Router();

/**
 * multer stores uploaded files temporarily inside the uploads folder.
 *
 * Example upload field name:
 * file
 */
const upload = multer({ dest: "uploads/" });

/**
 * POST /api/import/listings
 *
 * Uploads a marketplace listings CSV file.
 */
router.post("/listings", upload.single("file"), importListingsCsv);

module.exports = router;
