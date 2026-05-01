const express = require("express");
const router = express.Router();
const db = require("../db");

// GET todos
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*, 
        c.name AS category,
        (
          SELECT pi.image 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          LIMIT 1
        ) AS image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("ERROR GET ALL:", err);
    res.status(500).json(err);
  }
});


// GET por ID
router.get("/:id", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*, 
        c.name AS category,
        (
          SELECT pi.image 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          LIMIT 1
        ) AS image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.visible = true
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const product = result.rows[0];

    let images = [];

    try {
      const imgResult = await db.query(
        "SELECT image FROM product_images WHERE product_id = $1",
        [req.params.id]
      );

      images = imgResult.rows.map(img => img.image);

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

// TOGGLE VISIBILIDAD
router.put("/:id/visibility", async (req, res) => {
  try {
    const { id } = req.params;
    const { visible } = req.body;

    await db.query(
      "UPDATE products SET visible = $1 WHERE id = $2",
      [visible, id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR TOGGLE VISIBILITY:", err);
    res.status(500).json(err);
  }
});

// GET TODOS (ADMIN - sin filtro)
router.get("/admin", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*, 
        c.name AS category,
        (
          SELECT pi.image 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          LIMIT 1
        ) AS image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `);

    res.json(result.rows);

  } catch (err) {
    console.error("ERROR ADMIN GET:", err);
    res.status(500).json(err);
  }
});

module.exports = router;