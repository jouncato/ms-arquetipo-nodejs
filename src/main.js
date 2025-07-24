#!/usr/bin/env node

/**
 * Main application entry point
 * Initializes and starts the microservice with proper error handling
 */

import { createServer } from './infrastructure/server/server.js';
import { createLogger } from './infrastructure/logging/logger.js';
import { loadConfig, validateConfig } from './infrastructure/config/config.js';

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

/**
 * Initialize and start the microservice
 */
async function start() {
  let logger;
  
  try {
    // Load and validate configuration
    const config = await loadConfig();
    validateConfig(config);
    
    // Initialize logger
    logger = createLogger(config.logging);
    
    // Create and configure server
    const server = await createServer(config, logger);
    
    // Start server
    const address = await server.listen({
      port: config.server.port,
      host: config.server.host
    });
    
    logger.info(`Microservice started successfully`);
    logger.info(`Server listening on: ${address}`);
    logger.info(`Environment: ${config.environment}`);
    logger.info(`Database enabled: ${config.database.enabled}`);
    
    if (config.environment !== 'production') {
      logger.info(`API Documentation: http://${config.server.host}:${config.server.port}/docs`);
    }
    
    // Setup graceful shutdown
    setupGracefulShutdown(server, logger);
    
  } catch (error) {
    const errorLogger = logger || console;
    errorLogger.error('Failed to start microservice:', error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server, logger) {
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    
    try {
      // Stop accepting new requests
      await server.close();
      
      // Close database connections
      if (server.pg) {
        await server.pg.end();
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
      
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  // Register shutdown handlers
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Handle process warnings
  process.on('warning', (warning) => {
    logger.warn('Process warning:', warning);
  });
}

// Start the application
start();