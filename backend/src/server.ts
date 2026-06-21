import 'dotenv/config';
import { env } from './config/env';
import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { getAllowedOrigins } from './config/cors';
import { logger } from './config/logger';

const PORT = parseInt(env.PORT, 10);

async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on port ${PORT} (${env.NODE_ENV})`);
      logger.info(`API prefix: /api/${env.API_VERSION}`);
      logger.info(`CORS origins: ${getAllowedOrigins().join(', ')}`);
      logger.info('Health check: GET /health');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully`);
      server.close(async () => {
        await disconnectDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled rejection:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
