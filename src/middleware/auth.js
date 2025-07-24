import jwt from 'jsonwebtoken';

/**
 * JWT Authentication middleware
 */
export class AuthMiddleware {
  constructor(config) {
    this.jwtSecret = config.auth.jwtSecret;
    this.jwtExpiresIn = config.auth.jwtExpiresIn;
  }

  /**
   * Verify JWT token middleware
   */
  async verifyToken(request, reply) {
    try {
      const token = this.extractToken(request);
      
      if (!token) {
        return reply.status(401).send({
          error: {
            message: 'Access token required',
            statusCode: 401
          }
        });
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      request.user = decoded;
      
    } catch (error) {
      const message = error.name === 'TokenExpiredError' 
        ? 'Token expired' 
        : 'Invalid token';
        
      return reply.status(401).send({
        error: {
          message,
          statusCode: 401
        }
      });
    }
  }

  /**
   * Role-based authorization middleware
   */
  requireRole(roles) {
    return async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({
          error: {
            message: 'Authentication required',
            statusCode: 401
          }
        });
      }

      const userRoles = Array.isArray(request.user.roles) 
        ? request.user.roles 
        : [request.user.role];
      
      const hasRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRole) {
        return reply.status(403).send({
          error: {
            message: 'Insufficient permissions',
            statusCode: 403
          }
        });
      }
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(payload) {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  /**
   * Extract token from request headers
   */
  extractToken(request) {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Setup authentication hooks for Fastify
   */
  async setupAuth(fastify, config) {
    await fastify.register(import('@fastify/jwt'), {
      secret: config.auth.jwtSecret
    });

    fastify.decorate('authenticate', async (request, reply) => {
      await this.verifyToken(request, reply);
    });

    fastify.decorate('requireRole', (roles) => {
      return this.requireRole(roles);
    });
  }
}