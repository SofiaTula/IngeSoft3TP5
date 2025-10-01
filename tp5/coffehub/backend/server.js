const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const path = require("path");

const app = express();
app.use(express.json());

// CORS solo a tus front QA/PROD
const allowedOrigins = [
  "https://coffeehub-front-qa.azurewebsites.net",
  "https://coffeehub-front-prod.azurewebsites.net"
];
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Conexión DB con variables de Azure
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "coffeehub",
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a MySQL:", err.message);
  } else {
    console.log("✅ Conectado a MySQL en", process.env.DB_HOST || "localhost");
  }
});

// Endpoints
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

// Servir frontend compilado (opcional)
app.use(express.static(path.join(__dirname, "../frontend")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ CoffeeHub corriendo en http://localhost:${PORT}`);
});
