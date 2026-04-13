const express = require("express");
const router = express.Router();
const db = require("../db");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");

const upload = multer({ dest: "uploads/" });

// ==========================
// GET banners
// ==========================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM banners WHERE active = true ORDER BY created_at DESC"
    );

    res.json(rows);

  } catch (err) {
    console.error("Error obteniendo banners:", err);
    res.status(500).json(err);
  }
});


// ==========================
// POST subir banner
// ==========================
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { link } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "No se envió imagen" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners"
    });

    await db.query(
      "INSERT INTO banners (image_url, public_id, link) VALUES (?, ?, ?)",
      [result.secure_url, result.public_id, link]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Error subiendo banner:", err);
    res.status(500).json(err);
  }
});


// ==========================
// DELETE banner + cloudinary
// ==========================
router.delete("/:id", async (req, res) => {
  try {

    // 🔥 buscar banner
    const [rows] = await db.query(
      "SELECT * FROM banners WHERE id = ?",
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }

    const banner = rows[0];

    // 🔥 borrar imagen de cloudinary
    if (banner.public_id) {
      await cloudinary.uploader.destroy(banner.public_id);
    }

    // 🔥 borrar de DB
    await db.query(
      "DELETE FROM banners WHERE id = ?",
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Error eliminando banner:", err);
    res.status(500).json(err);
  }
});

module.exports = router;