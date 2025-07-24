import { UserService } from '../../application/services/user.service.js';
import { PostgresUserRepository } from '../../infrastructure/repositories/user.repository.postgres.js';

/**
 * Controlador REST para usuarios
 */
export async function userRoutes(fastify, options) {
  // Crear instancias de servicios y repositorios
  const userRepository = new PostgresUserRepository(fastify.pg);
  const userService = new UserService(userRepository);

  // Schemas para validación
  const userSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      email: { type: 'string', format: 'email' },
      name: { type: 'string', minLength: 2 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };

  const createUserSchema = {
    body: {
      type: 'object',
      required: ['email', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string', minLength: 2 }
      }
    },
    response: {
      201: userSchema
    }
  };

  // GET /users - Listar usuarios
  fastify.get('/', {
    schema: {
      description: 'Get all users',
      tags: ['Users'],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          offset: { type: 'integer', minimum: 0, default: 0 }
        }
      },
      response: {
        200: {
          type: 'array',
          items: userSchema
        }
      }
    }
  }, async (request, reply) => {
    const { limit, offset } = request.query;
    const users = await userService.getAllUsers({ limit, offset });
    return users;
  });

  // GET /users/:id - Obtener usuario por ID
  fastify.get('/:id', {
    schema: {
      description: 'Get user by ID',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        200: userSchema,
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = await userService.getUserById(request.params.id);
      return user;
    } catch (error) {
      if (error.message === 'User not found') {
        reply.status(404).send({ error: error.message });
        return;
      }
      throw error;
    }
  });

  // POST /users - Crear usuario
  fastify.post('/', {
    schema: createUserSchema
  }, async (request, reply) => {
    try {
      const user = await userService.createUser(request.body);
      reply.status(201).send(user);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('Invalid')) {
        reply.status(400).send({ error: error.message });
        return;
      }
      throw error;
    }
  });

  // PUT /users/:id - Actualizar usuario
  fastify.put('/:id', {
    schema: {
      description: 'Update user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2 }
        }
      },
      response: {
        200: userSchema
      }
    }
  }, async (request, reply) => {
    try {
      const user = await userService.updateUser(request.params.id, request.body);
      return user;
    } catch (error) {
      if (error.message === 'User not found') {
        reply.status(404).send({ error: error.message });
        return;
      }
      if (error.message.includes('already exists') || error.message.includes('Invalid')) {
        reply.status(400).send({ error: error.message });
        return;
      }
      throw error;
    }
  });

  // DELETE /users/:id - Eliminar usuario
  fastify.delete('/:id', {
    schema: {
      description: 'Delete user',
      tags: ['Users'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        204: {},
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      await userService.deleteUser(request.params.id);
      reply.status(204).send();
    } catch (error) {
      if (error.message === 'User not found') {
        reply.status(404).send({ error: error.message });
        return;
      }
      throw error;
    }
  });
}