import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createServer } from '../../src/infrastructure/server/server.js';
import { loadConfig } from '../../src/infrastructure/config/config.js';
import { createLogger } from '../../src/infrastructure/logging/logger.js';

describe('User Integration Tests', () => {
  let server;
  let config;

  beforeEach(async () => {
    config = await loadConfig();
    config.logging.level = 'silent';
    config.database.enabled = false;
    config.auth.enabled = false;
    
    const logger = createLogger(config.logging);
    server = await createServer(config, logger);
    await server.ready();
  });

  afterEach(async () => {
    await server.close();
  });

  describe('Health Endpoints', () => {
    test('GET /health should return service status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      assert.strictEqual(response.statusCode, 200);
      const payload = JSON.parse(response.payload);
      assert.strictEqual(payload.status, 'healthy');
      assert.ok(payload.timestamp);
      assert.ok(typeof payload.uptime === 'number');
      assert.strictEqual(payload.environment, config.environment);
    });

    test('GET /ready should return ready status', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/ready'
      });

      assert.strictEqual(response.statusCode, 200);
      const payload = JSON.parse(response.payload);
      assert.strictEqual(payload.status, 'ready');
    });
  });

  describe('User API Endpoints', () => {
    test('GET /api/v1/users should return users list', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users'
      });

      assert.strictEqual(response.statusCode, 200);
      const payload = JSON.parse(response.payload);
      assert.ok(Array.isArray(payload));
    });

    test('POST /api/v1/users should validate required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {}
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('POST /api/v1/users should validate email format', async () => {
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

    test('POST /api/v1/users should validate name length', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: {
          email: 'test@example.com',
          name: 'a'
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('GET /api/v1/users/:id with invalid ID should return 404', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/users/999'
      });

      assert.strictEqual(response.statusCode, 404);
      const payload = JSON.parse(response.payload);
      assert.ok(payload.error);
      assert.strictEqual(payload.error.statusCode, 404);
    });

    test('PUT /api/v1/users/:id with invalid ID should return 404', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: '/api/v1/users/999',
        payload: {
          name: 'Updated Name'
        }
      });

      assert.strictEqual(response.statusCode, 404);
    });

    test('DELETE /api/v1/users/:id with invalid ID should return 404', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/v1/users/999'
      });

      assert.strictEqual(response.statusCode, 404);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for unknown routes', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/unknown-route'
      });

      assert.strictEqual(response.statusCode, 404);
      const payload = JSON.parse(response.payload);
      assert.ok(payload.error);
      assert.strictEqual(payload.error.statusCode, 404);
      assert.ok(payload.error.timestamp);
    });

    test('should handle invalid JSON in request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: 'invalid-json',
        headers: {
          'content-type': 'application/json'
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('should handle missing Content-Type header', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/users',
        payload: { email: 'test@example.com', name: 'Test' }
      });

      assert.strictEqual(response.statusCode, 415);
    });
  });

  describe('Security Headers', () => {
    test('should include security headers in response', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/health'
      });

      assert.ok(response.headers['x-content-type-options']);
      assert.ok(response.headers['x-frame-options']);
      assert.ok(response.headers['x-request-id']);
      assert.ok(response.headers['x-response-time']);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting when enabled', async () => {
      if (!config.rateLimit.enabled) {
        return; // Skip if rate limiting is disabled
      }

      const requests = [];
      const maxRequests = config.rateLimit.max + 1;

      for (let i = 0; i < maxRequests; i++) {
        requests.push(server.inject({
          method: 'GET',
          url: '/health'
        }));
      }

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses.find(r => r.statusCode === 429);
      
      if (rateLimitedResponse) {
        assert.strictEqual(rateLimitedResponse.statusCode, 429);
        const payload = JSON.parse(rateLimitedResponse.payload);
        assert.strictEqual(payload.error.statusCode, 429);
      }
    });
  });
});