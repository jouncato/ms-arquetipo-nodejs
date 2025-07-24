import { userRoutes } from '../../interfaces/controllers/user.controller.js';

/**
 * Configuración central de todas las rutas del microservicio
 */
export async function setupRoutes(fastify) {
  // Registrar rutas de usuarios
  await fastify.register(userRoutes, { prefix: '/api/v1/users' });

  // Documentación Swagger (opcional)
  if (process.env.NODE_ENV !== 'production') {
    await fastify.register(import('@fastify/swagger'), {
      swagger: {
        info: {
          title: 'Microservice API',
          description: 'API documentation for microservice archetype',
          version: '1.0.0'
        },
        host: 'localhost:3000',
        schemes: ['http', 'https'],
        consumes: ['application/json'],
        produces: ['application/json']
      }
    });

    await fastify.register(import('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false
      }
    });
  }
}