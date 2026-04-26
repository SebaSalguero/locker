const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [username]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    const user = result.rows[0];

    console.log("🔍 USER:", user);
    console.log("🔑 PASSWORD INPUT:", password);
    console.log("🧾 PASSWORD DB:", user.password);

    if (!user.password) {
      return res.status(500).json({
        error: "Usuario sin password en DB",
        debug: user
      });
    }

    const match = await bcrypt.compare(password, user.password);

    console.log("✅ MATCH:", match);

    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    return res.json({
      ok: true,
      id: user.id,
      nombre: user.name,
      email: user.email,
      tipo: user.role
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});
module.exports = router;