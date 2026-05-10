const express = require('express');
const router = express.Router();
const registry = require('../services/printerRegistry');

/**
 * GET /health
 * Returns server status and basic diagnostics.
 */
router.get('/', (req, res) => {
  const printers = registry.list();
  res.json({
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    printers: {
      registered: printers.length,
      connected: printers.filter((p) => p.connected).length,
    },
    version: require('../../package.json').version,
  });
});

module.exports = router;