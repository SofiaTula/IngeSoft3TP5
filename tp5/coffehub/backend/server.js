// ================================
// ☕ CoffeeHub Backend - MongoDB
// ================================
// probando 
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 4000;

// ================================
// 🔗 MongoDB Connection
// ================================
// Ahora usa MONGODB_URI desde variables de entorno
// Cada ambiente (QA/PROD) tendrá su propia URI configurada en Azure
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ ERROR: MONGODB_URI no está definida");
  process.exit(1);
}

let db;
let productsCollection;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    // El nombre de la base de datos viene en la URI
    const dbName = new URL(MONGODB_URI).pathname.substring(1).split('?')[0];
    db = client.db(dbName);
    productsCollection = db.collection("products");
    
    console.log(`✅ Conectado a MongoDB Atlas - Base de datos: ${dbName}`);
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

// ================================
// 🌐 CORS
// ================================
const allowedOrigins = [
  "http://localhost:8080",
  "http://localhost:4000",
  "https://coffeehub-front-qa-a5cvgbfkhbf7huep.brazilsouth-01.azurewebsites.net",
  "https://coffeehub-front-prod-fvhhcggshqf8hygq.brazilsouth-01.azurewebsites.net",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`CORS bloqueado para: ${origin}`);
    return callback(new Error(`CORS no permitido para: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.options('*', cors());
app.use(express.json());

// ================================
// 📦 Endpoints API
// ================================

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    database: db ? "connected" : "disconnected",
    environment: process.env.NODE_ENV || "development"
  });
});

// GET todos los productos
app.get("/api/products", async (req, res) => {
  try {
    const products = await productsCollection.find({}).toArray();
    res.json(products);
  } catch (err) {
    console.error("Error al obtener productos:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST agregar producto
app.post("/api/products", async (req, res) => {
  const { name, origin, type, price, roast, rating, description } = req.body;
  
  try {
    const newProduct = {
      name,
      origin,
      type,
      price: parseFloat(price),
      roast,
      rating: parseFloat(rating),
      description: description || "Sin descripción",
      createdAt: new Date()
    };
    
    const result = await productsCollection.insertOne(newProduct);
    res.status(201).json({ 
      _id: result.insertedId,
      ...newProduct 
    });
  } catch (err) {
    console.error("Error al insertar producto:", err);
    res.status(500).json({ error: "Error al crear producto" });
  }
});

// GET estadísticas
app.get("/api/stats", async (req, res) => {
  try {
    const products = await productsCollection.find({}).toArray();
    
    const total = products.length;
    const avgPrice = total > 0 
      ? (products.reduce((sum, p) => sum + (p.price || 0), 0) / total).toFixed(2)
      : 0;
    
    // Encontrar origen más popular
    const origins = products.map(p => p.origin).filter(Boolean);
    const popularOrigin = origins.length > 0
      ? origins.sort((a, b) => 
          origins.filter(o => o === b).length - origins.filter(o => o === a).length
        )[0]
      : "N/A";

    res.json({
      total,
      avgPrice,
      popularOrigin
    });
  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ================================
// 🚀 Iniciar servidor
// ================================
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ CoffeeHub Backend corriendo en puerto ${PORT}`);
    console.log(`🔗 Orígenes permitidos:`, allowedOrigins);
  });
}).catch(err => {
  console.error("❌ No se pudo iniciar el servidor:", err);
  process.exit(1);
});