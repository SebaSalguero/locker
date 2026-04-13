const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔥 GET banners activos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM banners WHERE active = true ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error banners:", err);
    res.status(500).json(err);
  }
});

// 🔥 CREAR banner (admin)
router.post("/", async (req, res) => {
  try {
    const { image_url, link } = req.body;

    await db.query(
      "INSERT INTO banners (image_url, link) VALUES (?, ?)",
      [image_url, link]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error creando banner:", err);
    res.status(500).json(err);
  }
});

module.exports = router;