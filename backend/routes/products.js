const express = require("express");
const router = express.Router();
const db = require("../db");

// obtener productos
router.get("/", (req, res) => {

  const sql = `
  SELECT 
  products.*, 
  categories.name AS category
  FROM products
  LEFT JOIN categories
  ON products.category_id = categories.id
  `;

  db.query(sql, (err, results) => {

  if(err){
    console.error(err)
    return res.status(500).json(err)
  }

  res.json(results)

  })

});

module.exports = router;
