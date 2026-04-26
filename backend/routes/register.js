const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  try {
    const { nombre, email, password, tipo } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (name, email, password, role, approved) 
       VALUES ($1, $2, $3, $4, false)
       RETURNING id`,
      [nombre, email, hash, tipo || "minorista"]
    );

    res.json({
      id: result.rows[0].id,
      nombre,
      email,
      tipo: tipo || "minorista"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);

    // 🔥 PostgreSQL duplicate key
    if (err.code === "23505") {
      return res.status(400).json({ error: "Email ya registrado" });
    }

    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;