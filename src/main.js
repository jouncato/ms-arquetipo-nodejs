#!/usr/bin/env node

/**
 * Punto de entrada principal del microservicio
 * Configura y arranca el servidor Fastify con todas las dependencias
 */

import { createServer } from './infrastructure/server/server.js';
import { createLogger } from './infrastructure/logging/logger.js';
import { loadConfig } from './infrastructure/config/config.js';

// Manejo global de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Función principal para inicializar y arrancar el servidor
 */
async function start() {
  try {
    // Cargar configuración del entorno
    const config = await loadConfig();
    
    // Crear logger global
    const logger = createLogger(config.logging);
    
    // Crear e inicializar servidor
    const server = await createServer(config, logger);
    
    // Arrancar servidor
    await server.listen({
      port: config.server.port,
      host: config.server.host
    });
    
    logger.info(`🚀 Microservicio iniciado en ${config.server.host}:${config.server.port}`);
    logger.info(`📝 Documentación disponible en http://${config.server.host}:${config.server.port}/docs`);
    
    // Manejo graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`📡 Recibida señal ${signal}, cerrando servidor...`);
      try {
        await server.close();
        logger.info('✅ Servidor cerrado correctamente');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error cerrando servidor:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar aplicación
start();