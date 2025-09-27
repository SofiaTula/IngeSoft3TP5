const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Conexión a MySQL
const db = mysql.createConnection({
  host: "localhost",    // Cambia si usas Docker o un servidor remoto
  user: "root",         // Tu usuario de MySQL
  password: "",         // Tu contraseña
  database: "coffeehub" // Asegúrate de crear esta base antes
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err.message);
  } else {
    console.log("✅ Conectado a MySQL");
  }
});

// 📌 Crear tabla si no existe
db.query(`CREATE TABLE IF NOT EXISTS coffees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  origin VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  roast VARCHAR(50) NOT NULL,
  rating DECIMAL(2,1) NOT NULL,
  description TEXT
)`);

// 📌 Insertar cafés de ejemplo solo si la tabla está vacía
db.query("SELECT COUNT(*) as count FROM coffees", (err, rows) => {
  if (err) {
    console.error("❌ Error al contar cafés:", err.message);
    return;
  }

  if (rows[0].count === 0) {
    const samples = [
      ["Blue Mountain Supreme", "Jamaica", "Arábica", 85.99, "Medio", 4.9, "Un café excepcional con notas suaves de chocolate y nuez."],
      ["Ethiopian Yirgacheffe", "Etiopía", "Arábica", 24.99, "Claro", 4.7, "Café floral y afrutado con notas cítricas brillantes."],
      ["Colombian Supremo", "Colombia", "Arábica", 18.50, "Medio", 4.6, "Equilibrio perfecto entre acidez y cuerpo, con notas de caramelo."],
      ["Brazilian Santos", "Brasil", "Arábica", 15.99, "Medio-Oscuro", 4.3, "Café suave y cremoso con notas de chocolate."],
      ["Vietnamese Robusta", "Vietnam", "Robusta", 12.99, "Oscuro", 4.1, "Café intenso y fuerte con alto contenido de cafeína."],
      ["Hawaiian Kona", "Hawái", "Arábica", 65.00, "Medio", 4.8, "Café suave y aromático con notas de mantequilla y especias."]
    ];

    const sql = `INSERT INTO coffees (name, origin, type, price, roast, rating, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;

    samples.forEach(c => {
      db.query(sql, c, (err) => {
        if (err) console.error("❌ Error insertando café:", err.message);
      });
    });

    console.log("✅ Cafés de ejemplo cargados en MySQL");
  }
});

// 📌 Endpoints API
app.get("/coffees", (req, res) => {
  db.query("SELECT * FROM coffees", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/coffees", (req, res) => {
  const { name, origin, type, price, roast, rating, description } = req.body;
  const sql = `INSERT INTO coffees (name, origin, type, price, roast, rating, description)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, origin, type, price, roast, rating, description], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId, ...req.body });
  });
});

app.get("/stats", (req, res) => {
  db.query("SELECT COUNT(*) as total, AVG(price) as avgPrice FROM coffees", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = rows[0].total;
    const avgPrice = rows[0].avgPrice ? parseFloat(rows[0].avgPrice).toFixed(2) : 0;

    db.query("SELECT origin, COUNT(*) as count FROM coffees GROUP BY origin ORDER BY count DESC LIMIT 1", (err2, origins) => {
      if (err2) return res.status(500).json({ error: err2.message });
      const popularOrigin = origins.length > 0 ? origins[0].origin : "-";
      res.json({ total, avgPrice, popularOrigin });
    });
  });
});

// 📌 Servir frontend
app.use(express.static(path.join(__dirname, "../frontend")));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`✅ CoffeeHub corriendo en http://localhost:${PORT}`);
});
