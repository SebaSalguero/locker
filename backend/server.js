const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// servir frontend
app.use(express.static(path.join(__dirname, "../public")));

// rutas API
app.use("/api/admin", require("./routes/admin"));
app.use("/api/products", require("./routes/products"));
app.use("/api/login", require("./routes/login"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/register", require("./routes/register"));
app.use("/api/users", require("./routes/users"));

// test
app.get("/ping", (req, res) => {
  res.send("Servidor OK");
});

// 🔥 UN SOLO LISTEN (correcto para Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});