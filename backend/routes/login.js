const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const result = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [username]
    );

    if (!result.rows.length) {
      return res.status(401).json({ error: "Usuario no existe" });
    }

    const user = result.rows[0];

    // 👇 ACÁ ES DONDE VA EL DEBUG
    console.log("PASSWORD INPUT:", password);
    console.log("PASSWORD DB:", user.password);
    console.log("TYPE DB:", typeof user.password);

    if (!user.password) {
      return res.status(500).json({ error: "Usuario sin contraseña válida" });
    }

    const match = await bcrypt.compare(password, user.password);

    console.log("MATCH RESULT:", match); // 👈 este va acá (después del compare)

    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    return res.json({
      id: user.id,
      nombre: user.name,
      email: user.email,
      tipo: user.role,
      force_password_change: user.force_password_change
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;