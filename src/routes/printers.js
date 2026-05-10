const express = require('express');
const router = express.Router();
const registry = require('../services/printerRegistry');
const logger = require('../utils/logger');

/**
 * GET /printers
 * List all registered printers and their status.
 */
router.get('/', (req, res) => {
  const printers = registry.list();
  res.json({ printers });
});

/**
 * GET /printers/:name
 * Get info for a specific printer.
 */
router.get('/:name', (req, res) => {
  const printer = registry.get(req.params.name);
  if (!printer) {
    return res.status(404).json({ error: `Printer '${req.params.name}' not found` });
  }
  res.json(printer.getInfo());
});

/**
 * POST /printers
 * Register a new printer at runtime.
 *
 * Body:
 * {
 *   "type": "usb" | "network",
 *   "name": "my-printer",
 *   // USB: vendorId, productId
 *   // Network: host, port
 * }
 */
router.post('/', (req, res) => {
  const { type, name, ...rest } = req.body;

  if (!type || !name) {
    return res.status(400).json({ error: 'Both "type" and "name" are required' });
  }

  if (registry.has(name)) {
    return res.status(409).json({ error: `Printer '${name}' is already registered` });
  }

  try {
    const printer = registry.createFromConfig({ type, name, ...rest });
    logger.info(`Printer registered via API: ${name}`);
    res.status(201).json({ message: 'Printer registered', printer: printer.getInfo() });
  } catch (err) {
    logger.error('Failed to register printer', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /printers/:name
 * Unregister a printer.
 */
router.delete('/:name', (req, res) => {
  const removed = registry.remove(req.params.name);
  if (!removed) {
    return res.status(404).json({ error: `Printer '${req.params.name}' not found` });
  }
  logger.info(`Printer unregistered: ${req.params.name}`);
  res.json({ message: `Printer '${req.params.name}' unregistered` });
});

module.exports = router;