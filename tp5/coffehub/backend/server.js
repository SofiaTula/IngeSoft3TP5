// ☕ CoffeeHub Backend - MongoDB
// ================================
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 4000;

// ================================
// 🔗 MongoDB Connection
// ================================
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
    
    console.log('✅ Conectado a MongoDB Atlas - Base de datos: ${dbName}');
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
  "https://coffehub-front-qa-a5cvgbfkhbf7huep.brazilsouth-01.azurewebsites.net",
  "https://coffehub-front-prod-fvhhcggshqf8hygq.brazilsouth-01.azurewebsites.net",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn('CORS bloqueado para: ${origin}');
    return callback(new Error('CORS no permitido para: ${origin}'));
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

// GET un producto por ID
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    
    const product = await productsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!product) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    res.json(product);
  } catch (err) {
    console.error("Error al obtener producto:", err);
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

// PUT actualizar producto
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, origin, type, price, roast, rating, description } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    
    const updateData = {
      name,
      origin,
      type,
      price: parseFloat(price),
      roast,
      rating: parseFloat(rating),
      description: description || "Sin descripción",
      updatedAt: new Date()
    };
    
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    res.json({ 
      _id: id,
      ...updateData,
      message: "Producto actualizado exitosamente" 
    });
  } catch (err) {
    console.error("Error al actualizar producto:", err);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// DELETE eliminar producto
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    
    const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    res.json({ 
      message: "Producto eliminado exitosamente",
      deletedId: id 
    });
  } catch (err) {
    console.error("Error al eliminar producto:", err);
    res.status(500).json({ error: "Error al eliminar producto" });
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
    console.log('✅ CoffeeHub Backend corriendo en puerto ${PORT}');
    console.log('🔗 Orígenes permitidos:', allowedOrigins);
  });
}).catch(err => {
  console.error("❌ No se pudo iniciar el servidor:", err);
  process.exit(1);
});