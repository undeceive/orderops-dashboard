/**
 * backend/controllers/productsController.js
 *
 * Controller functions for product CRUD operations.
 *
 * CRUD means:
 * - Create
 * - Read
 * - Update
 * - Delete
 *
 * These functions are called by the product routes in:
 * backend/routes/productsRoutes.js
 */

const db = require("../db/database");

/**
 * GET /api/products
 *
 * Fetches all products from the SQLite database.
 *
 * The frontend uses this data to show:
 * - product count
 * - total inventory
 * - product table
 * - image status
 */
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

/**
 * GET /api/products/:id
 *
 * Fetches one product by its database ID.
 *
 * This is useful if the app later gets a product detail page.
 */
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

/**
 * POST /api/products
 *
 * Creates a new internal product record.
 *
 * Required fields:
 * - sku
 * - product_name
 *
 * Optional fields:
 * - brand
 * - category
 * - base_price
 * - inventory_count
 * - image_url
 * - image_status
 */
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

  /**
   * Basic validation.
   *
   * A product needs at least a SKU and product name.
   * Without these, the product would not be useful for marketplace tracking.
   */
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

      /**
       * this.lastID is provided by SQLite.
       * It gives us the database ID of the product that was just created.
       */
      res.status(201).json({
        message: "Product created",
        product_id: this.lastID,
      });
    }
  );
}

/**
 * PUT /api/products/:id
 *
 * Updates an existing product.
 *
 * This replaces the product fields with the values sent in the request body.
 */
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

      /**
       * this.changes tells us how many database rows were updated.
       * If it is 0, the product ID did not exist.
       */
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

/**
 * DELETE /api/products/:id
 *
 * Deletes a product by ID.
 *
 * In a real company version, we may want to archive products instead
 * of permanently deleting them.
 */
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
