const multer = require("multer");
const path = require("path");

const express = require("express");
const router = express.Router();
const db = require("../db");

const storage = multer.diskStorage({

  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/uploads"));
  },

  filename: function (req, file, cb) {

    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1E9);

    cb(null, unique + path.extname(file.originalname));

  }

});

const upload = multer({ storage: storage });

// login admin simple
router.post("/login", (req, res) => {
  console.log("BODY:", req.body);

  const { user, pass } = req.body;

  if (user === "admin" && pass === "admin123") {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false });
});

// agregar producto
router.post("/products", (req, res) => {
  const { name, description, price_minor, price_major, image, category_id } = req.body;

  const sql = `
  INSERT INTO products (name, description, price_minor, price_major, image, category_id)
  VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [name, description, price_minor, price_major, image, category_id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    }
  );
});

router.delete("/products/:id", (req, res) => {

  const id = req.params.id;

  const sql = "DELETE FROM products WHERE id = ?";

  db.query(sql, [id], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error eliminando producto" });
    }

    res.json({ success: true });

  });

});

router.put("/products/:id", (req, res) => {

  const id = req.params.id;

  const { name, description, price_minor, price_major, image, category_id } = req.body;

  const sql = `
  UPDATE products
  SET name=?, description=?, price_minor=?, price_major=?, image=?, category_id=?
  WHERE id=?
  `;

  db.query(
    sql,
    [name, description, price_minor, price_major, image, category_id, id],
    (err) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Error actualizando producto" });
      }

      res.json({ success: true });

    }
  );

});

router.post("/upload", upload.single("image"), (req, res) => {

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  res.json({
    filename: req.file.filename
  });

});

const bcrypt = require("bcrypt");

// LISTAR
router.get("/users", (req, res) => {

  db.query(
    "SELECT id, name, email, role, approved FROM users",
    (err, result) => {

      if (err) return res.status(500).json(err);

      res.json(result);
    }
  );

});

// CREAR
router.post("/users", async (req, res) => {

  const { name, email, password, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password,role,approved) VALUES (?,?,?,?,1)",
    [name, email, hash, role],
    err => {

      if (err) return res.status(500).json(err);

      res.json({ success: true });

    }
  );

});

// EDITAR
router.put("/users/:id", (req, res) => {

  const { name, email, role, approved } = req.body;

  db.query(
    "UPDATE users SET name=?, email=?, role=?, approved=? WHERE id=?",
    [name, email, role, approved, req.params.id],
    err => {

      if (err) return res.status(500).json(err);

      res.json({ success: true });

    }
  );

});

// RESET PASSWORD
router.put("/users/:id/reset", async (req, res) => {

  const hash = await bcrypt.hash("1234", 10);

  db.query(
    "UPDATE users SET password=? WHERE id=?",
    [hash, req.params.id],
    err => {

      if (err) return res.status(500).json(err);

      res.json({ success: true });

    }
  );

});

// aprobar usuario
router.put("/approve-user/:id", (req, res) => {

  const { id } = req.params;

  db.query(
    "UPDATE users SET approved=1 WHERE id=?",
    [id],
    () => res.json({ success:true })
  );

});

// eliminar usuario
router.delete("/users/:id", (req, res) => {

  const { id } = req.params;

  db.query(
    "DELETE FROM users WHERE id=?",
    [id],
    () => res.json({ success:true })
  );

});



// RESET PASSWORD
router.put("/users/:id/reset-password", async (req, res) => {

  const userId = req.params.id;
  const defaultPassword = "123456";

  try {
    const hash = await bcrypt.hash(defaultPassword, 10);

    db.query(
      "UPDATE users SET password = ?, force_password_change = 1 WHERE id = ?",
      [hash, userId],
      (err) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Error al resetear contraseña" });
        }

        res.json({ success: true });

      }
    );

  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  }

});

module.exports = router;
