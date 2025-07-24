import Fastify from 'fastify';
import { setupRoutes } from './routes.js';
import { setupMiddlewares } from './middlewares.js';
import { setupDatabase } from '../database/connection.js';

/**
 * Crea y configura una instancia del servidor Fastify
 * @param {Object} config - Configuración del servidor
 * @param {Object} logger - Logger instance
 * @returns {Promise<FastifyInstance>} Instancia configurada del servidor
 */
export async function createServer(config, logger) {
  // Crear instancia de Fastify con configuración
  const fastify = Fastify({
    logger: config.logging.level === 'silent' ? false : logger,
    disableRequestLogging: config.logging.level === 'silent',
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId'
  });

  try {
    // Configurar base de datos si está habilitada
    if (config.database.enabled) {
      await setupDatabase(fastify, config.database);
    }

    // Configurar middlewares globales
    await setupMiddlewares(fastify, config);

    // Configurar rutas
    await setupRoutes(fastify);

    // Health check básico
    fastify.get('/health', {
      schema: {
        description: 'Health check endpoint',
        tags: ['Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              version: { type: 'string' }
            }
          }
        }
      }
    }, async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      };
    });

    // Hook para logging de respuestas
    fastify.addHook('onResponse', async (request, reply) => {
      const responseTime = reply.elapsedTime;
      request.log.info({
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: `${responseTime}ms`
      }, `${request.method} ${request.url} - ${reply.statusCode} - ${responseTime}ms`);
    });

    // Hook para manejo de errores
    fastify.setErrorHandler(async (error, request, reply) => {
      request.log.error({
        error: error.message,
        stack: error.stack,
        method: request.method,
        url: request.url
      }, 'Request error');

      const statusCode = error.statusCode || 500;
      const response = {
        error: {
          message: statusCode === 500 ? 'Internal Server Error' : error.message,
          statusCode,
          timestamp: new Date().toISOString(),
          path: request.url
        }
      };

      reply.status(statusCode).send(response);
    });

    return fastify;

  } catch (error) {
    logger.error('Error configurando servidor:', error);
    throw error;
  }
}