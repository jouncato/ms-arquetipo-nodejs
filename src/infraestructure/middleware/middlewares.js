/**
 * Configuración de middlewares globales para Fastify
 */

export async function setupMiddlewares(fastify, config) {
  // CORS
  await fastify.register(import('@fastify/cors'), {
    origin: config.cors.origins,
    credentials: config.cors.credentials
  });

  // Security headers
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false // Deshabilitar por defecto para APIs
  });

  // Rate limiting
  if (config.rateLimit.enabled) {
    await fastify.register(import('@fastify/rate-limit'), {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
      errorResponseBuilder: (request, context) => ({
        error: {
          message: 'Rate limit exceeded',
          statusCode: 429,
          retryAfter: Math.round(context.ttl / 1000)
        }
      })
    });
  }

  // Request ID y timing
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
    
    // Agregar request ID si no existe
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = generateRequestId();
    }
  });

  // Response headers comunes
  fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Request-ID', request.headers['x-request-id']);
    reply.header('X-Response-Time', `${Date.now() - request.startTime}ms`);
    return payload;
  });
}

/**
 * Genera un ID único para el request
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}