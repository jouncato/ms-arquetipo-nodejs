import { config } from 'dotenv';

// Cargar variables de entorno
config();

/**
 * Configuración centralizada de la aplicación
 */
export async function loadConfig() {
  const environment = process.env.NODE_ENV || 'development';
  
  return {
    environment,
    server: {
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '127.0.0.1'
    },
    logging: {
      level: process.env.LOG_LEVEL || (environment === 'production' ? 'info' : 'debug'),
      prettyPrint: environment !== 'production'
    },
    database: {
      enabled: process.env.DATABASE_ENABLED === 'true',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME || 'microservice_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      ssl: process.env.DB_SSL === 'true',
      poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
      poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10)
    },
    cors: {
      origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS === 'true'
    },
    rateLimit: {
      enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
      max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute'
    },
    auth: {
      jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  };
}

/**
 * Validar configuración requerida
 */
export function validateConfig(config) {
  const required = [];
  
  if (config.environment === 'production') {
    if (!process.env.JWT_SECRET) required.push('JWT_SECRET');
    if (config.database.enabled && !process.env.DB_PASSWORD) required.push('DB_PASSWORD');
  }
  
  if (required.length > 0) {
    throw new Error(`Missing required environment variables: ${required.join(', ')}`);
  }
}