/**
 * Global middleware configuration for Fastify
 */

export async function setupMiddlewares(fastify, config) {
  // CORS middleware
  await fastify.register(import('@fastify/cors'), {
    origin: config.cors.origins,
    credentials: config.cors.credentials,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID']
  });

  // Security headers middleware
  await fastify.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  });

  // Rate limiting middleware
  if (config.rateLimit.enabled) {
    await fastify.register(import('@fastify/rate-limit'), {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.timeWindow,
      cache: 10000,
      allowList: ['127.0.0.1'],
      redis: config.redis?.enabled ? fastify.redis : undefined,
      errorResponseBuilder: (request, context) => ({
        error: {
          message: 'Too many requests',
          statusCode: 429,
          retryAfter: Math.round(context.ttl / 1000),
          timestamp: new Date().toISOString()
        }
      }),
      onExceeding: (request, key) => {
        fastify.log.warn(`Rate limit exceeded for ${key} from ${request.ip}`);
      }
    });
  }

  // Request context middleware
  fastify.addHook('onRequest', async (request, reply) => {
    // Add request start time
    request.startTime = Date.now();
    
    // Ensure request ID exists
    if (!request.headers['x-request-id']) {
      request.headers['x-request-id'] = generateRequestId();
    }

    // Add request context to logger
    request.log = request.log.child({
      requestId: request.headers['x-request-id'],
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent']
    });
  });

  // Response headers middleware
  fastify.addHook('onSend', async (request, reply, payload) => {
    // Add standard response headers
    reply.header('X-Request-ID', request.headers['x-request-id']);
    reply.header('X-Response-Time', `${Date.now() - request.startTime}ms`);
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    
    // Add cache control for API responses
    if (request.url.startsWith('/api/')) {
      reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    return payload;
  });

  // Request validation error handling
  fastify.setValidatorCompiler(({ schema, method, url, httpPart }) => {
    return function validate(data) {
      if (schema.type === 'object' && schema.properties) {
        const errors = [];
        
        // Check required fields
        if (schema.required) {
          for (const field of schema.required) {
            if (!(field in data)) {
              errors.push({
                field,
                message: `${field} is required`,
                code: 'REQUIRED_FIELD_MISSING'
              });
            }
          }
        }

        // Basic type validation
        for (const [key, value] of Object.entries(data)) {
          const fieldSchema = schema.properties[key];
          if (fieldSchema) {
            if (fieldSchema.type === 'string' && typeof value !== 'string') {
              errors.push({
                field: key,
                message: `${key} must be a string`,
                code: 'INVALID_TYPE'
              });
            }
            if (fieldSchema.type === 'number' && typeof value !== 'number') {
              errors.push({
                field: key,
                message: `${key} must be a number`,
                code: 'INVALID_TYPE'
              });
            }
            if (fieldSchema.format === 'email' && !isValidEmail(value)) {
              errors.push({
                field: key,
                message: `${key} must be a valid email`,
                code: 'INVALID_FORMAT'
              });
            }
          }
        }

        if (errors.length > 0) {
          return { error: errors };
        }
      }
      
      return { value: data };
    };
  });

  // Content-Type validation for POST/PUT requests
  fastify.addHook('preValidation', async (request, reply) => {
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers['content-type'];
      
      if (!contentType || !contentType.includes('application/json')) {
        reply.status(415).send({
          error: {
            message: 'Content-Type must be application/json',
            statusCode: 415,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  });
}

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}