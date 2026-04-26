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

    const debug = {
      inputPassword: password,
      dbPassword: user.password,
      hasPassword: !!user.password,
    };

    const match = await bcrypt.compare(password, user.password);

    return res.json({
      debug,              // 👈 esto lo ves en frontend
      match,              // 👈 true/false
      id: user.id,
      nombre: user.name,
      email: user.email,
      tipo: user.role,
      force_password_change: user.force_password_change
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;