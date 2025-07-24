import pino from 'pino';

/**
 * Crea y configura el logger principal usando Pino
 */
export function createLogger(config) {
  const options = {
    level: config.level,
    formatters: {
      level: (label) => ({ level: label.toUpperCase() })
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'localhost'
    }
  };

  // Configurar pretty print para desarrollo
  if (config.prettyPrint) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname'
      }
    };
  }

  return pino(options);
}