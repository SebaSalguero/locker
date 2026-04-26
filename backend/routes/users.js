const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

// 🔐 CAMBIAR PASSWORD
router.put("/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const result = await db.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await db.query(
      "UPDATE users SET password = $1, force_password_change = 0 WHERE id = $2",
      [hash, userId]
    );

    res.json({ success: true });

  } catch (err) {
      console.error("🔥 CHANGE PASSWORD ERROR:", err);

      res.status(500).json({
      success: false,
      message: err.message,
      code: err.code
      });
  }
});

// 👤 LISTAR USUARIOS
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, name, email, role, approved FROM users"
    );

    res.json(result.rows);

  } catch (err) {
    console.error("USERS ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;