// ================================
// ☕ CoffeeHub Backend - DEBUG VERSION
// ================================
import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";

const app = express();
const PORT = process.env.PORT || 4000;

// ================================
// 🐛 DEBUG: Mostrar variables de entorno
// ================================
console.log("\n" + "=".repeat(60));
console.log("🐛 DEBUG - Variables de entorno:");
console.log("=".repeat(60));
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("MONGODB_URI existe:", !!process.env.MONGODB_URI);
console.log("MONGODB_URI length:", process.env.MONGODB_URI?.length || 0);
// NO imprimir la URI completa por seguridad, solo primeros caracteres
if (process.env.MONGODB_URI) {
  console.log("MONGODB_URI preview:", process.env.MONGODB_URI.substring(0, 30) + "...");
}
console.log("=".repeat(60) + "\n");

// ================================
// 🔗 MongoDB Connection
// ================================
const MONGODB_URI = process.env.MONGODB_URI || 
  "mongodb+srv://coffeehub_user:coffeehub@cluster0.zapqwxx.mongodb.net/coffeehub?retryWrites=true&w=majority&appName=Cluster0";

let db;
let productsCollection;
let mongoClient;
let connectionError = null;

async function connectDB() {
  try {
    console.log("🔄 Intentando conectar a MongoDB...");
    
    mongoClient = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    await mongoClient.connect();
    console.log("✅ Cliente MongoDB conectado");
    
    db = mongoClient.db("coffeehub");
    console.log("✅ Base de datos 'coffeehub' seleccionada");
    
    productsCollection = db.collection("products");
    console.log("✅ Colección 'products' seleccionada");
    
    // Ping para verificar
    await db.admin().ping();
    console.log("✅ Ping a MongoDB exitoso");
    
    // Contar documentos
    const count = await productsCollection.countDocuments();
    console.log(`📊 Documentos en 'products': ${count}`);
    
    return mongoClient;
  } catch (error) {
    connectionError = error;
    console.error("\n" + "❌".repeat(30));
    console.error("❌ ERROR CONECTANDO A MONGODB:");
    console.error("❌".repeat(30));
    console.error("Mensaje:", error.message);
    console.error("Código:", error.code);
    console.error("Stack:", error.stack);
    console.error("❌".repeat(30) + "\n");
    
    // NO hacer exit, dejar que el servidor corra para ver logs
    return null;
  }
}

// ================================
// 🌐 CORS - Muy permisivo para debugging
// ================================
app.use(cors({
  origin: '*', // TEMPORAL: permitir todo para debugging
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));

app.use(express.json());

// ================================
// 🛡️ Middleware de logging detallado
// ================================
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${"─".repeat(60)}`);
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log(`Origin: ${req.get('origin') || 'N/A'}`);
  console.log(`User-Agent: ${req.get('user-agent') || 'N/A'}`);
  if (Object.keys(req.body).length > 0) {
    console.log(`Body:`, JSON.stringify(req.body, null, 2));
  }
  console.log("─".repeat(60));
  next();
});

// ================================
// 📦 Endpoints API
// ================================

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "CoffeeHub Backend API",
    version: "1.0.0-debug",
    endpoints: [
      "/api/health",
      "/api/debug",
      "/api/products",
      "/api/stats"
    ]
  });
});

// Health check super detallado
app.get("/api/health", async (req, res) => {
  console.log("🏥 Health check solicitado");
  
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      connected: false,
      error: null,
      details: {}
    }
  };

  try {
    if (!db) {
      health.database.connected = false;
      health.database.error = "Base de datos no inicializada";
      if (connectionError) {
        health.database.error += `: ${connectionError.message}`;
      }
    } else {
      await db.admin().ping();
      health.database.connected = true;
      
      const count = await productsCollection.countDocuments();
      health.database.details = {
        name: db.databaseName,
        productsCount: count
      };
    }
  } catch (error) {
    health.database.connected = false;
    health.database.error = error.message;
    console.error("❌ Error en health check:", error);
  }

  const statusCode = health.database.connected ? 200 : 503;
  console.log(`🏥 Health check: ${statusCode} -`, JSON.stringify(health, null, 2));
  res.status(statusCode).json(health);
});

// Debug endpoint con info del sistema
app.get("/api/debug", (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || "development",
    nodeVersion: process.version,
    platform: process.platform,
    hasMongoUri: !!process.env.MONGODB_URI,
    mongoUriLength: process.env.MONGODB_URI?.length || 0,
    dbConnected: !!db,
    collectionReady: !!productsCollection,
    connectionError: connectionError ? {
      message: connectionError.message,
      code: connectionError.code
    } : null,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// GET todos los productos
app.get("/api/products", async (req, res) => {
  console.log("📦 GET /api/products solicitado");
  
  try {
    if (!productsCollection) {
      console.error("❌ Colección no disponible");
      return res.status(503).json({ 
        error: "Base de datos no disponible",
        hint: "Revisa /api/health para más detalles"
      });
    }
    
    const products = await productsCollection.find({}).toArray();
    console.log(`✅ Productos obtenidos: ${products.length}`);
    res.json(products);
  } catch (err) {
    console.error("❌ Error al obtener productos:", err);
    res.status(500).json({ 
      error: "Error interno del servidor",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST agregar producto
app.post("/api/products", async (req, res) => {
  console.log("📝 POST /api/products solicitado");
  console.log("Body recibido:", req.body);
  
  const { name, origin, type, price, roast, rating, description } = req.body;
  
  if (!name || !origin || !type || price === undefined) {
    console.error("❌ Validación fallida: faltan campos");
    return res.status(400).json({ 
      error: "Faltan campos obligatorios",
      required: ["name", "origin", "type", "price"],
      received: Object.keys(req.body)
    });
  }
  
  try {
    if (!productsCollection) {
      console.error("❌ Colección no disponible");
      return res.status(503).json({ 
        error: "Base de datos no disponible" 
      });
    }
    
    const newProduct = {
      name: String(name),
      origin: String(origin),
      type: String(type),
      price: parseFloat(price),
      roast: String(roast || "Medium"),
      rating: parseFloat(rating || 0),
      description: String(description || "Sin descripción"),
      createdAt: new Date()
    };
    
    console.log("Insertando producto:", newProduct);
    const result = await productsCollection.insertOne(newProduct);
    console.log(`✅ Producto creado con ID: ${result.insertedId}`);
    
    res.status(201).json({ 
      _id: result.insertedId,
      ...newProduct 
    });
  } catch (err) {
    console.error("❌ Error al insertar producto:", err);
    res.status(500).json({ 
      error: "Error al crear producto",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// GET estadísticas
app.get("/api/stats", async (req, res) => {
  console.log("📊 GET /api/stats solicitado");
  
  try {
    if (!productsCollection) {
      console.error("❌ Colección no disponible");
      return res.status(503).json({ 
        error: "Base de datos no disponible" 
      });
    }
    
    const products = await productsCollection.find({}).toArray();
    console.log(`📊 Calculando stats para ${products.length} productos`);
    
    const total = products.length;
    const avgPrice = total > 0 
      ? (products.reduce((sum, p) => sum + (p.price || 0), 0) / total).toFixed(2)
      : 0;
    
    const origins = products.map(p => p.origin).filter(Boolean);
    const popularOrigin = origins.length > 0
      ? origins.sort((a, b) => 
          origins.filter(o => o === b).length - origins.filter(o => o === a).length
        )[0]
      : "N/A";

    const stats = {
      total,
      avgPrice: parseFloat(avgPrice),
      popularOrigin
    };
    
    console.log("✅ Stats calculadas:", stats);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error al obtener estadísticas:", err);
    res.status(500).json({ 
      error: "Error interno del servidor",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: "Ruta no encontrada",
    path: req.path,
    method: req.method
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error("❌ Error no manejado:", err);
  res.status(500).json({ 
    error: "Error del servidor",
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ================================
// 🚀 Iniciar servidor
// ================================
console.log("\n🚀 Iniciando CoffeeHub Backend (DEBUG MODE)...\n");

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log(`✅ Servidor escuchando en puerto ${PORT}`);
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
      console.log(`🐛 Debug: http://localhost:${PORT}/api/debug`);
      console.log(`📊 MongoDB: ${db ? "✅ Conectado" : "❌ Sin conexión"}`);
      console.log("=".repeat(60) + "\n");
    });
  })
  .catch(err => {
    console.error("❌ Error crítico al iniciar:", err);
    // NO hacer exit para poder ver logs
    app.listen(PORT, () => {
      console.log(`⚠️ Servidor iniciado SIN base de datos en puerto ${PORT}`);
      console.log(`🔍 Revisa /api/health y /api/debug para más info`);
    });
  });

// Manejo de señales
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM recibido');
  if (mongoClient) {
    mongoClient.close();
  }
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});