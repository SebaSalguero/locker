const express = require("express");
const router = express.Router();
const db = require("../db");

// 🧾 CREAR PEDIDO
router.post("/", async (req, res) => {
  try {
    const { user, cart } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Carrito vacío" });
    }

    let total = 0;

    cart.forEach(p => {
      total += p.price * p.qty;
    });

    const [result] = await db.query(
      `INSERT INTO orders 
      (user_id, customer_name, customer_email, total, status) 
      VALUES (?, ?, ?, ?, ?)`,
      [
        user?.id || null,
        user?.nombre || "Visitante",
        user?.email || null,
        total,
        "pendiente"
      ]
    );

    const orderId = result.insertId;

    // 📦 items
    for (const p of cart) {
      await db.query(
        `INSERT INTO order_items 
        (order_id, product_id, name, price, qty)
        VALUES (?, ?, ?, ?, ?)`,
        [orderId, p.id, p.name, p.price, p.qty]
      );
    }

    res.json({ success: true, orderId });

  } catch (err) {
    console.error("ERROR CREANDO ORDER:", err);
    res.status(500).json(err);
  }
});


// 📋 LISTAR TODOS (admin)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT o.*, u.name as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);

    res.json(rows);

  } catch (err) {
    res.status(500).json(err);
  }
});


// 🔍 DETALLE
router.get("/:id", async (req, res) => {
  try {

    const [orders] = await db.query(
      "SELECT * FROM orders WHERE id = ?",
      [req.params.id]
    );

    if (!orders.length) {
      return res.status(404).json({ error: "No encontrado" });
    }

    const [items] = await db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [req.params.id]
    );

    res.json({
      ...orders[0],
      items
    });

  } catch (err) {
    res.status(500).json(err);
  }
});


// 🔄 CAMBIAR ESTADO
router.put("/:id/status", async (req, res) => {
  try {

    const { status } = req.body;

    await db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, req.params.id]
    );

    // 🔥 DESCONTAR STOCK SOLO SI ES VENDIDO
    if (status === "vendido") {

      const [items] = await db.query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [req.params.id]
      );

      for (const item of items) {
        await db.query(
          "UPDATE products SET stock = stock - ? WHERE id = ?",
          [item.qty, item.product_id]
        );
      }
    }

    res.json({ success: true });

  } catch (err) {
    console.error("ERROR UPDATE STATUS:", err);
    res.status(500).json(err);
  }
});


// 👤 PEDIDOS DE USUARIO
router.get("/user/:id", async (req, res) => {
  try {

    const [rows] = await db.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [req.params.id]
    );

    res.json(rows);

  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/my/:userId", async (req, res) => {

  const { userId } = req.params;

  const [orders] = await db.query(`
    SELECT * FROM orders
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, [userId]);

  res.json(orders);

});

module.exports = router;