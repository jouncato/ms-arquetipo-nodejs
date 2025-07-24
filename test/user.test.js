import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createServer } from '../src/infrastructure/server/server.js';
import { loadConfig } from '../src/infrastructure/config/config.js';
import { createLogger } from '../src/infrastructure/logging/logger.js';

describe('User API Tests', () => {
  let server;
  let config;

  beforeEach(async () => {
    // Configuración para testing
    config = await loadConfig();
    config.logging.level = 'silent';
    config.database.enabled = false; // Usar mock para testing
    
    const logger = createLogger(config.logging);
    server = await createServer(config, logger);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      assert.strictEqual(response.statusCode, 200);
      const payload = JSON.parse(response.payload);
      assert.strictEqual(payload.status, 'healthy');
      assert.ok(payload.timestamp);
      assert.ok(typeof payload.uptime === 'number');
    });
  });

  describe('User Routes', () => {
    test('should validate required fields on user creation', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'invalid-email'
          // Missing name
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('should validate email format', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'invalid-email',
          name: 'Test User'
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('should validate name length', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'test@example.com',
          name: 'a' // Too short
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });
  });
});

// Mock implementation for testing without database
class MockUserRepository {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  async create(user) {
    const newUser = { ...user, id: this.nextId++ };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async findById(id) {
    return this.users.get(id) || null;
  }

  async findByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findAll(options = {}) {
    return Array.from(this.users.values());
  }

  async update(id, userData) {
    const user = this.users.get(id);
    if (!user) return null;
    
    const updatedUser = { ...user, ...userData, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id) {
    return this.users.delete(id);
  }
}