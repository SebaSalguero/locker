const express = require("express");
const router = express.Router();
const db = require("../db");

// GET
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    await db.query(
      "INSERT INTO categories (name, slug) VALUES ($1, $2)",
      [name, slug]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM categories WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");

    await db.query(
      "UPDATE categories SET name=$1, slug=$2 WHERE id=$3",
      [name, slug, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;