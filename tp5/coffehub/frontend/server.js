// server.js - Servidor Express para servir el frontend con variables de entorno
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Puerto desde variable de entorno (Azure usa PORT)
const PORT = process.env.PORT || 8080;

// URL del backend desde variable de entorno
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// Middleware para inyectar variables en HTML
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path === '/') {
    const filePath = req.path === '/' 
      ? path.join(__dirname, 'index.html')
      : path.join(__dirname, req.path);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        return next();
      }

      // Inyectar variable en el <head>
      const injected = data.replace(
        '</head>',
        `<script>window.BACKEND_URL = '${BACKEND_URL}';</script></head>`
      );

      res.type('html').send(injected);
    });
  } else {
    next();
  }
});

// Servir archivos estáticos
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`✅ Frontend corriendo en puerto ${PORT}`);
  console.log(`🔗 Backend configurado en: ${BACKEND_URL}`);
});
