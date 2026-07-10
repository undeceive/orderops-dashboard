/**
 * backend/routes/syncIssuesRoutes.js
 *
 * Sync issue API routes.
 */

const express = require("express");

const {
  getAllSyncIssues,
  createSyncIssue,
  resolveSyncIssue,
} = require("../controllers/syncIssuesController");

const router = express.Router();

router.get("/", getAllSyncIssues);
router.post("/", createSyncIssue);
router.patch("/:id/resolve", resolveSyncIssue);

module.exports = router;
