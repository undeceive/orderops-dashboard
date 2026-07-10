/**
 * backend/controllers/syncIssuesController.js
 *
 * Controller functions for product/listing sync issues.
 */

const db = require("../db/database");

function getAllSyncIssues(req, res) {
  db.all(
    `
    SELECT
      sync_issues.id,
      sync_issues.product_id,
      sync_issues.listing_id,
      sync_issues.issue_type,
      sync_issues.issue_severity,
      sync_issues.issue_status,
      sync_issues.issue_notes,
      sync_issues.created_at,
      sync_issues.resolved_at,
      products.sku,
      products.product_name,
      marketplace_listings.marketplace,
      marketplace_listings.marketplace_sku
    FROM sync_issues
    JOIN products ON products.id = sync_issues.product_id
    LEFT JOIN marketplace_listings ON marketplace_listings.id = sync_issues.listing_id
    ORDER BY
      CASE sync_issues.issue_status
        WHEN 'Open' THEN 1
        WHEN 'In Progress' THEN 2
        WHEN 'Resolved' THEN 3
        ELSE 4
      END,
      sync_issues.created_at DESC
    `,
    [],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          message: "Failed to fetch sync issues",
          error: error.message,
        });
      }

      res.json({
        count: rows.length,
        issues: rows,
      });
    }
  );
}

function createSyncIssue(req, res) {
  const {
    product_id,
    listing_id,
    issue_type,
    issue_severity,
    issue_status,
    issue_notes,
  } = req.body;

  if (!product_id || !issue_type) {
    return res.status(400).json({
      message: "product_id and issue_type are required",
    });
  }

  db.run(
    `
    INSERT INTO sync_issues (
      product_id,
      listing_id,
      issue_type,
      issue_severity,
      issue_status,
      issue_notes
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      product_id,
      listing_id || null,
      issue_type,
      issue_severity || "Medium",
      issue_status || "Open",
      issue_notes || null,
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to create sync issue",
          error: error.message,
        });
      }

      res.status(201).json({
        message: "Sync issue created",
        issue_id: this.lastID,
      });
    }
  );
}

function resolveSyncIssue(req, res) {
  const { id } = req.params;

  db.run(
    `
    UPDATE sync_issues
    SET
      issue_status = 'Resolved',
      resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [id],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to resolve sync issue",
          error: error.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: "Sync issue not found",
        });
      }

      res.json({
        message: "Sync issue resolved",
        issue_id: Number(id),
      });
    }
  );
}

module.exports = {
  getAllSyncIssues,
  createSyncIssue,
  resolveSyncIssue,
};
