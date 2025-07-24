import Fastify from 'fastify';
import { setupRoutes } from './routes.js';
import { setupMiddlewares } from '../middleware/middlewares.js';
import { setupDatabase } from '../database/database.js';
import { AuthMiddleware } from '../middleware/auth.middleware.js';
import { ErrorHandler } from '../middleware/error-handler.middleware.js';

/**
 * Create and configure Fastify server instance
 */
export async function createServer(config, logger) {
  const fastify = Fastify({
    logger: config.logging.level === 'silent' ? false : logger,
    disableRequestLogging: config.logging.level === 'silent',
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    genReqId: () => generateRequestId()
  });

  try {
    // Setup database connection
    if (config.database.enabled) {
      await setupDatabase(fastify, config.database);
    }

    // Setup authentication middleware
    if (config.auth?.enabled !== false) {
      const authMiddleware = new AuthMiddleware(config);
      await authMiddleware.setupAuth(fastify, config);
    }

    // Setup global middlewares
    await setupMiddlewares(fastify, config);

    // Setup error handlers
    ErrorHandler.setupErrorHandlers(fastify, config);

    // Setup routes
    await setupRoutes(fastify, config);

    // Health check endpoint
    fastify.get('/health', {
      schema: {
        description: 'Service health check',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              version: { type: 'string' },
              environment: { type: 'string' },
              database: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.environment,
        database: config.database.enabled ? 'connected' : 'disabled'
      };

      // Test database connection if enabled
      if (config.database.enabled && fastify.pg) {
        try {
          const client = await fastify.pg.connect();
          await client.query('SELECT 1');
          client.release();
          health.database = 'healthy';
        } catch (error) {
          health.database = 'unhealthy';
          health.status = 'degraded';
        }
      }

      return health;
    });

    // Ready check endpoint for Kubernetes
    fastify.get('/ready', async (request, reply) => {
      return { status: 'ready' };
    });

    // Request logging hook
    fastify.addHook('onResponse', async (request, reply) => {
      const responseTime = reply.elapsedTime;
      request.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: Math.round(responseTime),
        userAgent: request.headers['user-agent'],
        ip: request.ip
      }, `${request.method} ${request.url} - ${reply.statusCode} - ${Math.round(responseTime)}ms`);
    });

    // Request start time hook
    fastify.addHook('onRequest', async (request, reply) => {
      request.startTime = Date.now();
    });

    // CORS pre-flight hook
    fastify.addHook('preHandler', async (request, reply) => {
      if (request.method === 'OPTIONS') {
        reply.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        reply.send();
      }
    });

    return fastify;

  } catch (error) {
    logger.error('Error configuring server:', error);
    throw error;
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}