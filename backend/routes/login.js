const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", (req, res) => {

  const { username, password } = req.body;

  console.log("📥 INPUT:", { username, password });

  if (!username || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";

  db.query(sql, [username], async (err, result) => {

    if (err) {
      console.error("❌ DB ERROR:", err);
      return res.status(500).json(err);
    }

    console.log("📦 RESULT:", result);

    if (!result || result.length === 0) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    const user = result[0];

    if (!user.password) {
      return res.status(500).json({ error: "Usuario sin contraseña válida" });
    }

    const hash = user.password.toString();

    try {
      const match = await bcrypt.compare(password, hash);

      console.log("✅ MATCH:", match);

      if (!match) {
        return res.status(401).json({ error: "Contraseña incorrecta" });
      }

      if (user.force_password_change) {
        return res.json({
          force_password_change: true,
          id: user.id,
          email: user.email,
          nombre: user.name,
          tipo: user.role
        });
      }

res.json({
  id: user.id,
  nombre: user.name,
  email: user.email,
  tipo: user.role
});

    } catch (error) {
      console.error("💥 BCRYPT ERROR:", error);
      return res.status(500).json({ error: "Error interno" });
    }

  });

});

module.exports = router;