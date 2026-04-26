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
    const file = parts.slice(-2).join("/");
    return file.split(".")[0];
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
    const { name, description, price_minor, price_major, category_id, stock } = req.body;
    const stockValue = Number(stock) || 0;

    const result = await db.query(
      `INSERT INTO products (name, description, price_minor, price_major, image, category_id, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        name,
        description,
        price_minor,
        price_major,
        req.files?.[0]?.path || null,
        Number(category_id),
        stockValue
      ]
    );

    const productId = result.rows[0].id;

    // guardar imágenes
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await db.query(
          "INSERT INTO product_images (product_id, image) VALUES ($1, $2)",
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

    const productRes = await db.query(
      "SELECT image FROM products WHERE id = $1",
      [productId]
    );

    const imagesRes = await db.query(
      "SELECT image FROM product_images WHERE product_id = $1",
      [productId]
    );

    const allImages = [
      ...productRes.rows.map(p => p.image),
      ...imagesRes.rows.map(i => i.image)
    ].filter(Boolean);

    for (const img of allImages) {
      const publicId = getPublicId(img);
      if(publicId){
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await db.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
    await db.query("DELETE FROM products WHERE id = $1", [productId]);

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR BORRANDO PRODUCTO:", err);
    res.status(500).json(err);
  }
});

// UPDATE PRODUCTO
router.put("/products/:id", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, price_minor, price_major, category_id, stock } = req.body;
    const productId = req.params.id;
    const stockValue = Number(stock) || 0;

    let mainImage;

    if (req.files && req.files.length > 0) {
      mainImage = req.files[0].path;
    } else {
      const result = await db.query(
        "SELECT image FROM products WHERE id = $1",
        [productId]
      );
      mainImage = result.rows[0]?.image || null;
    }

    await db.query(
      `UPDATE products 
       SET name=$1, description=$2, price_minor=$3, price_major=$4, image=$5, category_id=$6, stock=$7
       WHERE id=$8`,
      [
        name,
        description,
        price_minor,
        price_major,
        mainImage,
        Number(category_id),
        stockValue,
        productId
      ]
    );

    if (req.files && req.files.length > 0) {
      await db.query(
        "DELETE FROM product_images WHERE product_id = $1",
        [productId]
      );

      for (const file of req.files) {
        await db.query(
          "INSERT INTO product_images (product_id, image) VALUES ($1, $2)",
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
    const result = await db.query("SELECT id,name,email,role,approved FROM users");
    res.json(result.rows);
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
      "INSERT INTO users (name,email,password,role,approved) VALUES ($1,$2,$3,$4,1)",
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
      "UPDATE users SET name=$1, email=$2, role=$3, approved=$4 WHERE id=$5",
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

    console.log("RESET PASSWORD USER ID:", req.params.id);

    const result = await db.query(
      "UPDATE users SET password=$1, force_password_change=true WHERE id=$2 RETURNING id",
      [hash, req.params.id]
    );

    console.log("ROWS UPDATED:", result.rowCount);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 RESET PASSWORD ERROR:", err);

    res.status(500).json({
      success: false,
      error: err.message,
      code: err.code
    });
  }
});

// DELETE USER
router.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;