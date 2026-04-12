const express = require("express");
const router = express.Router();
const db = require("../db");

// GET todos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
    SELECT 
      p.*, 
      c.name AS category
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    `);
    res.json(rows);
  } catch (err) {
    console.error("ERROR GET ALL:", err);
    res.status(500).json(err);
  }
});


router.get("/:id", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );

    if (!products.length) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const product = products[0];

    let images = [];

    try {
      const [imgRows] = await db.query(
        "SELECT image FROM product_images WHERE product_id = ?",
        [req.params.id]
      );

      images = imgRows.map(img => img.image);
    } catch (err) {
      console.warn("No se pudieron cargar imágenes:", err.message);
    }

    product.images = images;

    res.json(product);

  } catch (err) {
    console.error("ERROR GET BY ID:", err);
    res.status(500).json(err);
  }
});

module.exports = router;