import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { createMockCollection, MockObjectId } from '../mocks/mongodb.mock.js';
import { mockProducts, mockNewProduct } from '../fixtures/products.fixtures.js';

// ==========================================
// 🎭 Tests Unitarios con MOCKS de MongoDB
// ==========================================

describe('🎭 Tests con Mocks de MongoDB - Products API', () => {
  let mockCollection;

  beforeEach(() => {
    mockCollection = createMockCollection();
    mockCollection.__setMockData([...mockProducts]);
    jest.clearAllMocks();
  });

  // ========================================
  // ✅ TESTS DE LECTURA (GET)
  // ========================================
  describe('GET - Operaciones de Lectura', () => {
    it('✅ Debe obtener todos los productos', async () => {
      const result = await mockCollection.find({}).toArray();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('name', 'Café Colombia Premium');
      expect(mockCollection.find).toHaveBeenCalledWith({});
    });

    it('✅ Debe obtener un producto por ID', async () => {
      const productId = mockProducts[0]._id;
      const result = await mockCollection.findOne({ _id: productId });

      expect(result).not.toBeNull();
      expect(result._id).toBe(productId);
      expect(result.name).toBe('Café Colombia Premium');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: productId });
    });

    it('✅ Debe retornar null si el producto no existe', async () => {
      const fakeId = new MockObjectId('999999999999999999999999');
      const result = await mockCollection.findOne({ _id: fakeId });

      expect(result).toBeNull();
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: fakeId });
    });

    it('✅ Debe contar la cantidad de productos', async () => {
      const count = await mockCollection.countDocuments();

      expect(count).toBe(3);
      expect(mockCollection.countDocuments).toHaveBeenCalled();
    });
  });

  // ========================================
  // ✅ TESTS DE CREACIÓN (POST)
  // ========================================
  describe('POST - Operaciones de Creación', () => {
    it('✅ Debe crear un nuevo producto', async () => {
      const result = await mockCollection.insertOne(mockNewProduct);

      expect(result).toHaveProperty('insertedId');
      expect(result.acknowledged).toBe(true);
      expect(mockCollection.insertOne).toHaveBeenCalledWith(mockNewProduct);

      const allProducts = await mockCollection.find({}).toArray();
      expect(allProducts).toHaveLength(4);
    });

    it('✅ Debe generar un ID automáticamente al insertar', async () => {
      const productWithoutId = {
        name: 'Café Sin ID',
        origin: 'Perú',
        type: 'Arábica',
        price: 20.00,
        roast: 'Medium',
        rating: 4.5
      };

      const result = await mockCollection.insertOne(productWithoutId);

      expect(result.insertedId).toBeDefined();
      expect(typeof result.insertedId).toBe('string');
    });
  });

  // ========================================
  // ✅ TESTS DE ACTUALIZACIÓN (PUT)
  // ========================================
  describe('PUT - Operaciones de Actualización', () => {
    it('✅ Debe actualizar un producto existente', async () => {
      const productId = mockProducts[0]._id;
      const updateData = {
        $set: {
          name: 'Café Colombia ACTUALIZADO',
          price: 29.99
        }
      };

      const result = await mockCollection.updateOne(
        { _id: productId },
        updateData
      );

      expect(result.matchedCount).toBe(1);
      expect(result.modifiedCount).toBe(1);

      const updated = await mockCollection.findOne({ _id: productId });
      expect(updated.name).toBe('Café Colombia ACTUALIZADO');
      expect(updated.price).toBe(29.99);
    });

    it('✅ Debe retornar matchedCount=0 si el producto no existe', async () => {
      const fakeId = new MockObjectId('999999999999999999999999');
      const updateData = {
        $set: { name: 'No existe' }
      };

      const result = await mockCollection.updateOne(
        { _id: fakeId },
        updateData
      );

      expect(result.matchedCount).toBe(0);
      expect(result.modifiedCount).toBe(0);
    });
  });

  // ========================================
  // ✅ TESTS DE ELIMINACIÓN (DELETE)
  // ========================================
  describe('DELETE - Operaciones de Eliminación', () => {
    it('✅ Debe eliminar un producto existente', async () => {
      const productId = mockProducts[0]._id;
      
      const result = await mockCollection.deleteOne({ _id: productId });

      expect(result.deletedCount).toBe(1);

      const allProducts = await mockCollection.find({}).toArray();
      expect(allProducts).toHaveLength(2);
      
      const deleted = await mockCollection.findOne({ _id: productId });
      expect(deleted).toBeNull();
    });

    it('✅ Debe retornar deletedCount=0 si el producto no existe', async () => {
      const fakeId = new MockObjectId('999999999999999999999999');
      
      const result = await mockCollection.deleteOne({ _id: fakeId });

      expect(result.deletedCount).toBe(0);
    });
  });

  // ========================================
  // ✅ TESTS DE VALIDACIÓN DE MOCK
  // ========================================
  describe('Validación del Mock', () => {
    it('✅ Debe resetear datos del mock correctamente', () => {
      mockCollection.__reset();
      const data = mockCollection.__mockData;

      expect(data).toHaveLength(0);
    });

    it('✅ MockObjectId debe ser válido', () => {
      const id = new MockObjectId();
      
      expect(MockObjectId.isValid(id.toString())).toBe(true);
      expect(typeof id.toString()).toBe('string');
    });
  });
});