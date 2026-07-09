/**
 * backend/controllers/ordersController.js
 *
 * Controller functions for marketplace orders.
 */

const db = require("../db/database");

function getAllOrders(req, res) {
  db.all(
    `
    SELECT
      id,
      marketplace,
      marketplace_order_id,
      customer_name,
      order_status,
      total_amount,
      created_at,
      updated_at
    FROM orders
    ORDER BY created_at DESC
    `,
    [],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          message: "Failed to fetch orders",
          error: error.message,
        });
      }

      res.json({
        count: rows.length,
        orders: rows,
      });
    }
  );
}

function getOrderById(req, res) {
  const { id } = req.params;

  db.get(
    `
    SELECT
      id,
      marketplace,
      marketplace_order_id,
      customer_name,
      order_status,
      total_amount,
      created_at,
      updated_at
    FROM orders
    WHERE id = ?
    `,
    [id],
    (error, row) => {
      if (error) {
        return res.status(500).json({
          message: "Failed to fetch order",
          error: error.message,
        });
      }

      if (!row) {
        return res.status(404).json({
          message: "Order not found",
        });
      }

      res.json(row);
    }
  );
}

function createOrder(req, res) {
  const {
    marketplace,
    marketplace_order_id,
    customer_name,
    order_status,
    total_amount,
  } = req.body;

  if (!marketplace || !marketplace_order_id) {
    return res.status(400).json({
      message: "marketplace and marketplace_order_id are required",
    });
  }

  db.run(
    `
    INSERT INTO orders (
      marketplace,
      marketplace_order_id,
      customer_name,
      order_status,
      total_amount
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      marketplace,
      marketplace_order_id,
      customer_name || null,
      order_status || "Pending",
      total_amount ?? 0,
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to create order",
          error: error.message,
        });
      }

      res.status(201).json({
        message: "Order created",
        order_id: this.lastID,
      });
    }
  );
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
};
