// ==========================================
// 🎭 Mock de MongoDB para tests unitarios
// ==========================================

import { jest } from '@jest/globals';

/**
 * Crea un mock de la colección de MongoDB
 */
export function createMockCollection() {
  const mockData = [];

  return {
    // Mock de find()
    find: jest.fn().mockReturnValue({
      toArray: jest.fn().mockImplementation(() => {
        return Promise.resolve([...mockData]);
      })
    }),

    // Mock de findOne() - MEJORADO
    findOne: jest.fn().mockImplementation((query) => {
      if (!query || Object.keys(query).length === 0) {
        return Promise.resolve(mockData[0] || null);
      }

      const result = mockData.find(item => {
        return Object.keys(query).every(key => {
          if (key === '_id') {
            return item._id.toString() === query._id.toString();
          }
          return item[key] === query[key];
        });
      });
      
      return Promise.resolve(result || null);
    }),

    // Mock de insertOne()
    insertOne: jest.fn().mockImplementation((doc) => {
      const newDoc = {
        ...doc,
        _id: new Date().getTime().toString()
      };
      mockData.push(newDoc);
      return Promise.resolve({
        insertedId: newDoc._id,
        acknowledged: true
      });
    }),

    // Mock de updateOne()
    updateOne: jest.fn().mockImplementation((query, update) => {
      const index = mockData.findIndex(item => {
        if (query._id) {
          return item._id.toString() === query._id.toString();
        }
        return true;
      });

      if (index !== -1) {
        mockData[index] = {
          ...mockData[index],
          ...update.$set
        };
        return Promise.resolve({
          matchedCount: 1,
          modifiedCount: 1,
          acknowledged: true
        });
      }

      return Promise.resolve({
        matchedCount: 0,
        modifiedCount: 0,
        acknowledged: true
      });
    }),

    // Mock de deleteOne()
    deleteOne: jest.fn().mockImplementation((query) => {
      const index = mockData.findIndex(item => {
        if (query._id) {
          return item._id.toString() === query._id.toString();
        }
        return true;
      });

      if (index !== -1) {
        mockData.splice(index, 1);
        return Promise.resolve({
          deletedCount: 1,
          acknowledged: true
        });
      }

      return Promise.resolve({
        deletedCount: 0,
        acknowledged: true
      });
    }),

    // Mock de countDocuments()
    countDocuments: jest.fn().mockImplementation(() => {
      return Promise.resolve(mockData.length);
    }),

    // Helpers para tests
    __mockData: mockData,
    __reset: () => mockData.splice(0, mockData.length),
    __setMockData: (data) => {
      mockData.splice(0, mockData.length, ...data);
    }
  };
}

/**
 * Crea un mock del cliente de MongoDB
 */
export function createMockMongoClient() {
  const mockCollection = createMockCollection();

  return {
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    db: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnValue(mockCollection)
    }),
    __mockCollection: mockCollection
  };
}

/**
 * Mock de ObjectId - MEJORADO
 */
export class MockObjectId {
  constructor(id) {
    this.id = id || new Date().getTime().toString().padStart(24, '0');
  }

  toString() {
    return this.id;
  }

  static isValid(id) {
    if (typeof id !== 'string') return false;
    if (id.length !== 24) return false;
    return /^[a-f0-9]{24}$/i.test(id);
  }
}