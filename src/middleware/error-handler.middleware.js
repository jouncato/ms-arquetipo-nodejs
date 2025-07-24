/**
 * Centralized error handling middleware
 */
export class ErrorHandler {
  /**
   * Setup global error handlers for Fastify
   */
  static setupErrorHandlers(fastify, config) {
    // Custom error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      const errorId = request.id || 'unknown';
      
      // Log error with context
      request.log.error({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          statusCode: error.statusCode
        },
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
          headers: this.sanitizeHeaders(request.headers)
        },
        errorId
      }, `Request error: ${error.message}`);

      // Determine status code
      const statusCode = this.getStatusCode(error);
      
      // Create error response
      const errorResponse = this.createErrorResponse(
        error, 
        statusCode, 
        config.environment, 
        errorId
      );

      reply.status(statusCode).send(errorResponse);
    });

    // Handle 404 errors
    fastify.setNotFoundHandler(async (request, reply) => {
      const errorResponse = {
        error: {
          message: `Route ${request.method} ${request.url} not found`,
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: request.url,
          errorId: request.id
        }
      };

      reply.status(404).send(errorResponse);
    });

    // Handle validation errors
    fastify.setSchemaErrorFormatter((errors, dataVar) => {
      const formattedErrors = errors.map(error => ({
        field: error.instancePath || error.schemaPath,
        message: error.message,
        value: error.data
      }));

      return new Error(JSON.stringify({
        type: 'validation',
        message: 'Request validation failed',
        details: formattedErrors
      }));
    });
  }

  /**
   * Determine HTTP status code from error
   */
  static getStatusCode(error) {
    if (error.statusCode) return error.statusCode;
    
    switch (error.name) {
      case 'ValidationError':
        return 400;
      case 'UnauthorizedError':
      case 'JsonWebTokenError':
        return 401;
      case 'ForbiddenError':
        return 403;
      case 'NotFoundError':
        return 404;
      case 'ConflictError':
        return 409;
      case 'RateLimitError':
        return 429;
      default:
        return 500;
    }
  }

  /**
   * Create standardized error response
   */
  static createErrorResponse(error, statusCode, environment, errorId) {
    const baseResponse = {
      error: {
        message: statusCode >= 500 ? 'Internal Server Error' : error.message,
        statusCode,
        timestamp: new Date().toISOString(),
        errorId
      }
    };

    // Add detailed error info in development
    if (environment === 'development') {
      baseResponse.error.details = {
        name: error.name,
        originalMessage: error.message,
        stack: error.stack
      };

      // Add validation details if available
      if (error.message && this.isJsonString(error.message)) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.type === 'validation') {
            baseResponse.error.validation = parsed.details;
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }

    return baseResponse;
  }

  /**
   * Sanitize sensitive headers for logging
   */
  static sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Check if string is valid JSON
   */
  static isJsonString(str) {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden access') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
  }
}