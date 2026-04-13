const multer = require("multer");
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

function getPublicId(url){
  try {
    const parts = url.split("/");
    const file = parts.slice(-2).join("/"); // folder + filename
    return file.split(".")[0]; // sin extensión
  } catch {
    return null;
  }
}

// storage imágenes
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "locker-products",
    allowed_formats: ["jpg", "png", "jpeg", "webp"]
  }
});

const upload = multer({ storage });

// LOGIN ADMIN
router.post("/login", (req, res) => {
  const { user, pass } = req.body;
  if (user === "admin" && pass === "admin123") {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false });
});

// CREAR PRODUCTO
router.post("/products", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, price_minor, price_major, category_id } = req.body;

    // 🧾 insertar producto (imagen principal opcional)
    const [result] = await db.query(
      `INSERT INTO products (name, description, price_minor, price_major, image, category_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        description,
        price_minor,
        price_major,
        req.files[0]?.path || null, // 👈 imagen principal
        category_id
      ]
    );

    const productId = result.insertId;

    // 🖼 guardar TODAS las imágenes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.query(
          "INSERT INTO product_images (product_id, image) VALUES (?, ?)",
          [productId, file.path]
        );
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR CREANDO PRODUCTO:", err);
    res.status(500).json(err);
  }
});

// DELETE PRODUCTO
router.delete("/products/:id", async (req, res) => {
  try {

    const productId = req.params.id;

    // traer producto + imágenes
    const [products] = await db.query(
      "SELECT image FROM products WHERE id = ?",
      [productId]
    );

    const [images] = await db.query(
      "SELECT image FROM product_images WHERE product_id = ?",
      [productId]
    );

    // juntar TODAS las imágenes
    const allImages = [
      ...products.map(p => p.image),
      ...images.map(i => i.image)
    ].filter(Boolean);

    // borrar de Cloudinary
    for (const img of allImages) {
      const publicId = getPublicId(img);

      if(publicId){
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // borrar de DB
    await db.query("DELETE FROM product_images WHERE product_id = ?", [productId]);
    await db.query("DELETE FROM products WHERE id = ?", [productId]);

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR BORRANDO PRODUCTO:", err);
    res.status(500).json(err);
  }
});

// UPDATE PRODUCTO
router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  try {

    const { name, description, price_minor, price_major, category_id } = req.body;
    const productId = req.params.id;

    // 🧾 actualizar producto (imagen principal opcional)
    let mainImage;

// si sube nuevas imágenes → usar nueva
if (req.files && req.files.length > 0) {
  mainImage = req.files[0].path;
} else {
  // mantener imagen actual
  const [rows] = await db.query(
    "SELECT image FROM products WHERE id = ?",
    [productId]
  );

  mainImage = rows[0]?.image || null;
}

    await db.query(
      `UPDATE products 
       SET name=?, description=?, price_minor=?, price_major=?, image=?, category_id=? 
       WHERE id=?`,
      [
        name,
        description,
        price_minor,
        price_major,
        mainImage,
        category_id,
        productId
      ]
    );

    if (req.files && req.files.length > 0) {

  // 🧹 borrar imágenes anteriores SOLO si hay nuevas
  await db.query(
    "DELETE FROM product_images WHERE product_id = ?",
    [productId]
  );

  // 🖼 insertar nuevas imágenes
  for (const file of req.files) {
    await db.query(
      "INSERT INTO product_images (product_id, image) VALUES (?, ?)",
      [productId, file.path]
    );
  }
}

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR ACTUALIZANDO PRODUCTO:", err);
    res.status(500).json(err);
  }
});

// UPLOAD
router.post("/upload", upload.array("images", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const paths = req.files.map(f => f.path);

  res.json({ paths });
});

// USERS LIST
router.get("/users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id,name,email,role,approved FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE USER
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name,email,password,role,approved) VALUES (?,?,?,?,1)",
      [name, email, hash, role]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE USER
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, role, approved } = req.body;

    await db.query(
      "UPDATE users SET name=?, email=?, role=?, approved=? WHERE id=?",
      [name, email, role, approved, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// RESET PASSWORD
router.put("/users/:id/reset-password", async (req, res) => {
  try {
    const hash = await bcrypt.hash("123456", 10);

    await db.query(
      "UPDATE users SET password=?, force_password_change=1 WHERE id=?",
      [hash, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE USER
router.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
