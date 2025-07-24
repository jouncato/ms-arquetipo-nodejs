/**
 * Configuración de conexión a PostgreSQL usando @fastify/postgres
 */
export async function setupDatabase(fastify, dbConfig) {
  await fastify.register(import('@fastify/postgres'), {
    connectionString: `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.name}`,
    ssl: dbConfig.ssl,
    pool: {
      min: dbConfig.poolMin,
      max: dbConfig.poolMax
    }
  });

  // Test de conexión
  fastify.addHook('onReady', async () => {
    try {
      const client = await fastify.pg.connect();
      await client.query('SELECT NOW()');
      client.release();
      fastify.log.info('✅ Database connected successfully');
    } catch (error) {
      fastify.log.error('❌ Database connection failed:', error);
      throw error;
    }
  });
}