/**
 * backend/controllers/productsController.js
 *
 * Controller functions for product CRUD operations.
 */

const db = require("../db/database");

function getAllProducts(req, res) {
  db.all(
    `
    SELECT
      id,
      sku,
      product_name,
      brand,
      category,
      base_price,
      inventory_count,
      image_url,
      image_status,
      created_at,
      updated_at
    FROM products
    ORDER BY created_at DESC
    `,
    [],
    (error, rows) => {
      if (error) {
        return res.status(500).json({
          message: "Failed to fetch products",
          error: error.message,
        });
      }

      res.json({
        count: rows.length,
        products: rows,
      });
    }
  );
}

function getProductById(req, res) {
  const { id } = req.params;

  db.get(
    `
    SELECT
      id,
      sku,
      product_name,
      brand,
      category,
      base_price,
      inventory_count,
      image_url,
      image_status,
      created_at,
      updated_at
    FROM products
    WHERE id = ?
    `,
    [id],
    (error, row) => {
      if (error) {
        return res.status(500).json({
          message: "Failed to fetch product",
          error: error.message,
        });
      }

      if (!row) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json(row);
    }
  );
}

function createProduct(req, res) {
  const {
    sku,
    product_name,
    brand,
    category,
    base_price,
    inventory_count,
    image_url,
    image_status,
  } = req.body;

  if (!sku || !product_name) {
    return res.status(400).json({
      message: "sku and product_name are required",
    });
  }

  db.run(
    `
    INSERT INTO products (
      sku,
      product_name,
      brand,
      category,
      base_price,
      inventory_count,
      image_url,
      image_status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      sku,
      product_name,
      brand || null,
      category || null,
      base_price ?? 0,
      inventory_count ?? 0,
      image_url || null,
      image_status || "Not Checked",
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to create product",
          error: error.message,
        });
      }

      res.status(201).json({
        message: "Product created",
        product_id: this.lastID,
      });
    }
  );
}

function updateProduct(req, res) {
  const { id } = req.params;

  const {
    sku,
    product_name,
    brand,
    category,
    base_price,
    inventory_count,
    image_url,
    image_status,
  } = req.body;

  if (!sku || !product_name) {
    return res.status(400).json({
      message: "sku and product_name are required",
    });
  }

  db.run(
    `
    UPDATE products
    SET
      sku = ?,
      product_name = ?,
      brand = ?,
      category = ?,
      base_price = ?,
      inventory_count = ?,
      image_url = ?,
      image_status = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `,
    [
      sku,
      product_name,
      brand || null,
      category || null,
      base_price ?? 0,
      inventory_count ?? 0,
      image_url || null,
      image_status || "Not Checked",
      id,
    ],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to update product",
          error: error.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        message: "Product updated",
        product_id: Number(id),
      });
    }
  );
}

function deleteProduct(req, res) {
  const { id } = req.params;

  db.run(
    `
    DELETE FROM products
    WHERE id = ?
    `,
    [id],
    function (error) {
      if (error) {
        return res.status(500).json({
          message: "Failed to delete product",
          error: error.message,
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      res.json({
        message: "Product deleted",
        product_id: Number(id),
      });
    }
  );
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
