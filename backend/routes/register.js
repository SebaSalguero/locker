const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {

  const { nombre, email, password, tipo } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const hash = await bcrypt.hash(password, 10);

  const sql = `
    INSERT INTO users (name, email, password, role, approved)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [nombre, email, hash, tipo || "minorista", 1],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Email ya registrado" });
      }

      // ✅ devolver usuario creado
      const user = {
        id: result.insertId,
        nombre: nombre,
        email: email,
        tipo: tipo || "minorista"
      };

      res.json(user);

    }
  );

});

module.exports = router;