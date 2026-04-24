const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
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
app.use("/api/orders", require("./routes/orders"));

// 🔥 ruta SEO (ANTES del static)


app.get("/producto/:slugId", async (req, res) => {

  const slugId = req.params.slugId;

  // 👉 sacar ID del slug (ej: zapatilla-nike-123 → 123)
  const id = slugId.split("-").pop();

  try {

    const [rows] = await db.query(`
      SELECT p.*, 
        (
          SELECT pi.image 
          FROM product_images pi 
          WHERE pi.product_id = p.id 
          LIMIT 1
        ) AS image
      FROM products p
      WHERE p.id = ?
    `, [id]);

    const product = rows[0];

    if (!product) {
      return res.status(404).send("Producto no encontrado");
    }

    // ⚠️ CAMBIAR POR TU DOMINIO REAL
    const url = `https://locker-xwso.onrender.com/producto/${slugId}`;

    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />

        <title>${product.name}</title>

        <meta property="og:title" content="${product.name}" />
        <meta property="og:description" content="${product.description || ""}" />
        <meta property="og:image" content="${product.image}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:type" content="product" />

        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        <!-- redirige a tu frontend -->
        <script>
          window.location.href = "/product.html?slug=${slugId}";
        </script>

      </head>
      <body></body>
      </html>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error servidor");
  }
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