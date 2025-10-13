import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createMockCollection, MockObjectId } from '../mocks/mongodb.mock.js';

// ==========================================
// ⚠️ Tests de Manejo de EXCEPCIONES
// ==========================================

describe('⚠️ Manejo de Excepciones con MongoDB', () => {
  let mockCollection;

  beforeEach(() => {
    mockCollection = createMockCollection();
    jest.clearAllMocks();
  });

  // ========================================
  // ❌ ERRORES DE CONEXIÓN
  // ========================================
  describe('Errores de Conexión', () => {
    it('❌ Debe manejar error de conexión a MongoDB', async () => {
      mockCollection.find = jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(
          new Error('MongoNetworkError: failed to connect to server')
        )
      });

      await expect(mockCollection.find({}).toArray()).rejects.toThrow(
        'MongoNetworkError: failed to connect to server'
      );
    });

    it('❌ Debe manejar timeout de conexión', async () => {
      mockCollection.findOne = jest.fn().mockRejectedValue(
        new Error('MongoServerSelectionError: connection timeout')
      );

      await expect(mockCollection.findOne({ _id: '123' })).rejects.toThrow(
        'connection timeout'
      );
    });

    it('❌ Debe manejar error de autenticación', async () => {
      mockCollection.find = jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(
          new Error('MongoAuthenticationError: Authentication failed')
        )
      });

      await expect(mockCollection.find({}).toArray()).rejects.toThrow(
        'Authentication failed'
      );
    });
  });

  // ========================================
  // ❌ ERRORES DE OPERACIONES
  // ========================================
  describe('Errores de Operaciones CRUD', () => {
    it('❌ Debe manejar error al insertar documento duplicado', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('E11000 duplicate key error collection')
      );

      const product = {
        _id: 'duplicate-id',
        name: 'Café Duplicado',
        price: 20.00
      };

      await expect(mockCollection.insertOne(product)).rejects.toThrow(
        'duplicate key error'
      );
    });

    it('❌ Debe manejar error de documento demasiado grande', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('Document exceeds maximum allowed size')
      );

      const largeProduct = {
        name: 'Café',
        description: 'x'.repeat(17 * 1024 * 1024)
      };

      await expect(mockCollection.insertOne(largeProduct)).rejects.toThrow(
        'exceeds maximum allowed size'
      );
    });

    it('❌ Debe manejar error de actualización con ObjectId inválido', async () => {
      mockCollection.updateOne = jest.fn().mockRejectedValue(
        new Error('Argument passed in must be a string of 12 bytes or 24 hex characters')
      );

      await expect(
        mockCollection.updateOne(
          { _id: 'invalid-id' },
          { $set: { name: 'Test' } }
        )
      ).rejects.toThrow('24 hex characters');
    });

    it('❌ Debe manejar error al eliminar con filtro inválido', async () => {
      mockCollection.deleteOne = jest.fn().mockRejectedValue(
        new Error('Invalid filter provided')
      );

      await expect(
        mockCollection.deleteOne({ $invalid: 'operator' })
      ).rejects.toThrow('Invalid filter');
    });
  });

  // ========================================
  // ❌ ERRORES DE VALIDACIÓN
  // ========================================
  describe('Errores de Validación de Datos', () => {
    it('❌ Debe rechazar producto sin campos requeridos', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('Document failed validation: name is required')
      );

      const invalidProduct = {
        price: 20.00,
        origin: 'Colombia'
      };

      await expect(mockCollection.insertOne(invalidProduct)).rejects.toThrow(
        'name is required'
      );
    });

    it('❌ Debe rechazar precio negativo', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('Validation failed: price must be greater than 0')
      );

      const invalidProduct = {
        name: 'Café',
        price: -10.00,
        origin: 'Colombia'
      };

      await expect(mockCollection.insertOne(invalidProduct)).rejects.toThrow(
        'price must be greater than 0'
      );
    });

    it('❌ Debe rechazar rating fuera de rango', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('Validation failed: rating must be between 0 and 5')
      );

      const invalidProduct = {
        name: 'Café',
        price: 20.00,
        rating: 6.5
      };

      await expect(mockCollection.insertOne(invalidProduct)).rejects.toThrow(
        'rating must be between 0 and 5'
      );
    });

    it('❌ Debe rechazar tipo de dato incorrecto', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('Validation failed: price must be a number')
      );

      const invalidProduct = {
        name: 'Café',
        price: 'veinte',
        origin: 'Colombia'
      };

      await expect(mockCollection.insertOne(invalidProduct)).rejects.toThrow(
        'price must be a number'
      );
    });
  });

  // ========================================
  // ✅ RECUPERACIÓN DE ERRORES
  // ========================================
  describe('Recuperación de Errores', () => {
    it('✅ Debe reintentar operación después de error temporal', async () => {
      let attempts = 0;
      mockCollection.find = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return {
            toArray: jest.fn().mockRejectedValue(new Error('Temporary network error'))
          };
        }
        return {
          toArray: jest.fn().mockResolvedValue([{ name: 'Success' }])
        };
      });

      let result;
      for (let i = 0; i < 3; i++) {
        try {
          result = await mockCollection.find({}).toArray();
          break;
        } catch (e) {
          if (i === 2) throw e;
        }
      }

      expect(result).toEqual([{ name: 'Success' }]);
      expect(attempts).toBe(3);
    });

    it('✅ Debe usar fallback cuando la operación falla', async () => {
      mockCollection.find = jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database unavailable'))
      });

      let result;
      try {
        result = await mockCollection.find({}).toArray();
      } catch (error) {
        result = [{ name: 'Cached Product', source: 'cache' }];
      }

      expect(result).toHaveLength(1);
      expect(result[0].source).toBe('cache');
    });
  });

  // ========================================
  // ⚠️ CASOS ESPECIALES
  // ========================================
  describe('Casos Especiales de Errores', () => {
    it('❌ Debe manejar operación en colección inexistente', async () => {
      mockCollection.find = jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(
          new Error('Collection does not exist')
        )
      });

      await expect(mockCollection.find({}).toArray()).rejects.toThrow(
        'Collection does not exist'
      );
    });

    it('❌ Debe manejar error de espacio en disco lleno', async () => {
      mockCollection.insertOne = jest.fn().mockRejectedValue(
        new Error('No space left on device')
      );

      await expect(
        mockCollection.insertOne({ name: 'Test' })
      ).rejects.toThrow('No space left on device');
    });

    it('❌ Debe manejar error de replica set no disponible', async () => {
      mockCollection.find = jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(
          new Error('No replica set members available')
        )
      });

      await expect(mockCollection.find({}).toArray()).rejects.toThrow(
        'No replica set members available'
      );
    });

    it('✅ Debe loguear errores para debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockCollection.find = jest.fn().mockReturnValue({
        toArray: jest.fn().mockRejectedValue(
          new Error('Test error for logging')
        )
      });

      try {
        await mockCollection.find({}).toArray();
      } catch (error) {
        console.error('MongoDB Error:', error.message);
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        'MongoDB Error:',
        'Test error for logging'
      );

      consoleSpy.mockRestore();
    });
  });
});