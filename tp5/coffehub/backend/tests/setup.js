// tests/setup.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde .env.test
dotenv.config({ path: join(__dirname, '../.env.test') });

// Configuración de entorno
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '4001';

// Verificar que MONGODB_URI esté definida
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI no está definida en .env.test');
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas correctamente');
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('📝 PORT:', process.env.PORT);
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? 'Definida ✅' : 'No definida ❌');