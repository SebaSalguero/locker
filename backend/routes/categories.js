const express = require("express");
const router = express.Router();
const db = require("../db");

console.log("RUTA CATEGORIES CARGADA");

// obtener categorías
router.get("/", (req, res) => {

  const sql = "SELECT * FROM categories ORDER BY name";

  db.query(sql, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error obteniendo categorías" });
    }

    res.json(result);

  });

});


// crear categoría
router.post("/", (req, res) => {

  const { name } = req.body;

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const sql = "INSERT INTO categories (name, slug) VALUES (?, ?)";

  db.query(sql, [name, slug], (err) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error creando categoría" });
    }

    res.json({ success: true });

  });

});


// eliminar categoría
router.delete("/:id", (req, res) => {

  const id = req.params.id;

  const sql = "DELETE FROM categories WHERE id = ?";

  db.query(sql, [id], (err) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error eliminando categoría" });
    }

    res.json({ success: true });

  });

});


// editar categoría
router.put("/:id", (req, res) => {

  const id = req.params.id;
  const { name } = req.body;

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const sql = "UPDATE categories SET name=?, slug=? WHERE id=?";

  db.query(sql, [name, slug, id], (err) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error actualizando categoría" });
    }

    res.json({ success: true });

  });

});


module.exports = router;