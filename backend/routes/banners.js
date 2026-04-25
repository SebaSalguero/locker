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
    const result = await db.query(
      "SELECT * FROM banners WHERE active = true ORDER BY created_at DESC"
    );

    res.json(result.rows);

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

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      folder: "banners"
    });

    await db.query(
      "INSERT INTO banners (image_url, public_id, link) VALUES ($1, $2, $3)",
      [uploadResult.secure_url, uploadResult.public_id, link || null]
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

    const result = await db.query(
      "SELECT * FROM banners WHERE id = $1",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }

    const banner = result.rows[0];

    // 🔥 borrar imagen de cloudinary
    if (banner.public_id) {
      await cloudinary.uploader.destroy(banner.public_id);
    }

    // 🔥 borrar de DB
    await db.query(
      "DELETE FROM banners WHERE id = $1",
      [req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Error eliminando banner:", err);
    res.status(500).json(err);
  }
});


// ==========================
// PUT editar banner
// ==========================
router.put("/:id", upload.single("image"), async (req, res) => {
  try {
    const { link } = req.body;

    // buscar banner actual
    const result = await db.query(
      "SELECT * FROM banners WHERE id = $1",
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Banner no encontrado" });
    }

    const banner = result.rows[0];

    let image_url = banner.image_url;
    let public_id = banner.public_id;

    // 👉 si mandan nueva imagen
    if (req.file) {
      if (banner.public_id) {
        await cloudinary.uploader.destroy(banner.public_id);
      }

      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "banners"
      });

      image_url = uploadResult.secure_url;
      public_id = uploadResult.public_id;
    }

    // 👉 actualizar DB
    await db.query(
      "UPDATE banners SET image_url = $1, public_id = $2, link = $3 WHERE id = $4",
      [image_url, public_id, link || null, req.params.id]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Error editando banner:", err);
    res.status(500).json(err);
  }
});

module.exports = router;