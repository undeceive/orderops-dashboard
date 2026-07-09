/**
 * backend/routes/ordersRoutes.js
 *
 * Order API routes.
 */

const express = require("express");

const {
  getAllOrders,
  getOrderById,
  createOrder,
} = require("../controllers/ordersController");

const router = express.Router();

router.get("/", getAllOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);

module.exports = router;
