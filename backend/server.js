const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// 🔥 rutas API primero
app.use("/api/admin", require("./routes/admin"));
app.use("/api/products", require("./routes/products"));
app.use("/api/login", require("./routes/login"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/register", require("./routes/register"));
app.use("/api/users", require("./routes/users"));
app.use("/api/banners", require("./routes/banners"));

// 🔥 ruta SEO (ANTES del static)
app.get("/producto/:slugId", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/product.html"));
});

// 🔥 uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔥 static al FINAL
app.use(express.static(path.join(__dirname, "../public")));

// test
app.get("/ping", (req, res) => {
  res.send("Servidor OK");
});

// listen
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});

console.log("Cloudinary:", process.env.CLOUDINARY_CLOUD_NAME);