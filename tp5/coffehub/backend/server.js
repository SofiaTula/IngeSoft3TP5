// ================================
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
let mongoClient;

async function connectDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    
    const dbName = new URL(MONGODB_URI).pathname.substring(1).split('?')[0];
    db = mongoClient.db(dbName);
    productsCollection = db.collection("products");
    
    console.log(`✅ Conectado a MongoDB Atlas - Base de datos: ${dbName}`);
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
}

// ================================
// 🛡️ FUNCIONES DE VALIDACIÓN
// ================================

/**
 * Valida los datos de un producto
 * @param {Object} productData - Datos del producto
 * @param {boolean} isUpdate - Si es una actualización (campos opcionales)
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateProduct(productData, isUpdate = false) {
  const errors = [];

  // Validar nombre
  if (!isUpdate || productData.name !== undefined) {
    if (!productData.name || typeof productData.name !== 'string') {
      errors.push('Name is required and must be a string');
    } else if (productData.name.trim() === '') {
      errors.push('Name cannot be empty or only whitespace');
    } else if (productData.name.length > 255) {
      errors.push('Name cannot exceed 255 characters');
    }
  }

  // Validar precio
  if (!isUpdate || productData.price !== undefined) {
    const price = parseFloat(productData.price);
    if (isNaN(price)) {
      errors.push('Price must be a valid number');
    } else if (price < 0) {
      errors.push('Price cannot be negative');
    } else if (price > 999999.99) {
      errors.push('Price cannot exceed 999,999.99');
    }
  }

  // Validar rating (si existe)
  if (productData.rating !== undefined && productData.rating !== null) {
    const rating = parseFloat(productData.rating);
    if (isNaN(rating)) {
      errors.push('Rating must be a valid number');
    } else if (rating < 0 || rating > 5) {
      errors.push('Rating must be between 0 and 5');
    }
  }

  // Validar origin
  if (!isUpdate || productData.origin !== undefined) {
    if (productData.origin && typeof productData.origin !== 'string') {
      errors.push('Origin must be a string');
    }
  }

  // Validar type
  if (!isUpdate || productData.type !== undefined) {
    if (productData.type && typeof productData.type !== 'string') {
      errors.push('Type must be a string');
    }
  }

  // Validar roast
  if (!isUpdate || productData.roast !== undefined) {
    if (productData.roast && typeof productData.roast !== 'string') {
      errors.push('Roast must be a string');
    }
  }

  // Validar description
  if (productData.description !== undefined && productData.description !== null) {
    if (typeof productData.description !== 'string') {
      errors.push('Description must be a string');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitiza los datos de un producto
 * @param {Object} productData - Datos del producto
 * @returns {Object} Datos sanitizados
 */
function sanitizeProduct(productData) {
  const sanitized = {};

  if (productData.name !== undefined) {
    sanitized.name = String(productData.name).trim();
  }

  if (productData.origin !== undefined) {
    sanitized.origin = String(productData.origin).trim();
  }

  if (productData.type !== undefined) {
    sanitized.type = String(productData.type).trim();
  }

  if (productData.price !== undefined) {
    sanitized.price = parseFloat(productData.price);
  }

  if (productData.roast !== undefined) {
    sanitized.roast = String(productData.roast).trim();
  }

  if (productData.rating !== undefined && productData.rating !== null) {
    sanitized.rating = parseFloat(productData.rating);
  }

  if (productData.description !== undefined) {
    sanitized.description = productData.description 
      ? String(productData.description).trim() 
      : "Sin descripción";
  }

  return sanitized;
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

// POST agregar producto (CON VALIDACIÓN)
app.post("/api/products", async (req, res) => {
  try {
    // 1. Sanitizar datos
    const sanitized = sanitizeProduct(req.body);
    
    // 2. Validar datos
    const validation = validateProduct(sanitized, false);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: "Datos inválidos",
        details: validation.errors 
      });
    }
    
    // 3. Crear producto
    const newProduct = {
      name: sanitized.name,
      origin: sanitized.origin || "Desconocido",
      type: sanitized.type || "Desconocido",
      price: sanitized.price,
      roast: sanitized.roast || "Medium",
      rating: sanitized.rating || 0,
      description: sanitized.description || "Sin descripción",
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

// PUT actualizar producto (CON VALIDACIÓN)
app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }
    
    // 1. Sanitizar datos
    const sanitized = sanitizeProduct(req.body);
    
    // 2. Validar datos (modo actualización)
    const validation = validateProduct(sanitized, true);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: "Datos inválidos",
        details: validation.errors 
      });
    }
    
    // 3. Preparar datos de actualización
    const updateData = {
      ...sanitized,
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
let server;

async function initializeApp() {
  try {
    await connectDB();
    
    if (process.env.NODE_ENV !== 'test') {
      server = app.listen(PORT, () => {
        console.log(`✅ CoffeeHub Backend corriendo en puerto ${PORT}`);
        console.log('🔗 Orígenes permitidos:', allowedOrigins);
      });
    }
  } catch (err) {
    console.error("❌ No se pudo iniciar el servidor:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  initializeApp();
}

export default app;
export { server, initializeApp, db, productsCollection, mongoClient };