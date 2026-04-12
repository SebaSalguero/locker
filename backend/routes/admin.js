const multer = require("multer");
const path = require("path");
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

// storage imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/uploads"));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
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
        req.files[0]?.filename || null, // 👈 imagen principal
        category_id
      ]
    );

    const productId = result.insertId;

    // 🖼 guardar TODAS las imágenes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.query(
          "INSERT INTO product_images (product_id, image) VALUES (?, ?)",
          [productId, file.filename]
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
    await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPDATE PRODUCTO
router.put("/products/:id", async (req, res) => {
  try {
    const { name, description, price_minor, price_major, image, category_id } = req.body;

    await db.query(
      `UPDATE products SET name=?, description=?, price_minor=?, price_major=?, image=?, category_id=? WHERE id=?`,
      [name, description, price_minor, price_major, image, category_id, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

// UPLOAD
router.post("/upload", upload.array("images", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const filenames = req.files.map(f => f.filename);

  res.json({ filenames });
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
