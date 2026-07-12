const app = require('./app');
const connectDB = require('./config/db');
const { PORT } = require('./config/env');
const logger = require('./utils/logger');

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`🚀 TransitOps server running on http://localhost:${PORT}`);
    logger.info(`📡 API base: http://localhost:${PORT}/api/v1`);
    logger.info(`💚 Health check: http://localhost:${PORT}/health`);
  });
};

startServer().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
