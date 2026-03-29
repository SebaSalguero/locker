const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");


// 🔐 CAMBIAR PASSWORD
router.put("/change-password", async (req, res) => {

  const { userId, currentPassword, newPassword } = req.body;

  db.query(
    "SELECT * FROM users WHERE id=?",
    [userId],
    async (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      const user = result[0];

      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const match = await bcrypt.compare(currentPassword, user.password);

      if (!match) {
        return res.status(401).json({ error: "Incorrecta" });
      }

      const hash = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET password = ?, force_password_change = 0 WHERE id = ?",
        [hash, userId],
        () => res.json({ success: true })
      );

    }
  );

});


// 👤 OBTENER USUARIOS
router.get("/", (req, res) => {

  db.query(
    "SELECT id, name, email, role, approved FROM users",
    (err, result) => {

      if (err) {
        console.error("❌ ERROR USERS:", err);
        return res.status(500).json(err);
      }

      res.json(result);
    }
  );

});


module.exports = router;