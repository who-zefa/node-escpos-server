require('dotenv').config();

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const healthRoutes = require('./routes/health');
const printerRoutes = require('./routes/printers');
const printRoutes = require('./routes/print');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Routes
app.use('/health', healthRoutes);
app.use('/printers', printerRoutes);
app.use('/print', printRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, HOST, () => {
  logger.info(`Node ESC/POS Server running at http://${HOST}:${PORT}`);
  logger.info('Press Ctrl+C to stop');
});

module.exports = app;