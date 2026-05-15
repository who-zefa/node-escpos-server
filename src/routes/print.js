const express = require('express');
const router = express.Router();
const printService = require('../services/printService');
const logger = require('../utils/logger');

/**
 * POST /print/raw
 * Send raw ESC/POS data to a registered printer.
 *
 * Body:
 * {
 *   "printer": "PT210",
 *   "data": "<base64-encoded-escpos-data>",
 *   "encoding": "base64"   // optional: "base64" (default) | "hex" | "text"
 * }
 */
router.post('/raw', async (req, res) => {
  const { printer, data, encoding } = req.body;

  if (!printer) {
    return res.status(400).json({ error: '"printer" field is required' });
  }
  if (!data) {
    return res.status(400).json({ error: '"data" field is required' });
  }

  try {
    const result = await printService.printRaw({ printer, data, encoding });
    res.json(result);
  } catch (err) {
    logger.error('Print job failed', { error: err.message, printer });
    const status = err.message.includes('not registered') ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /print/text
 * Print plain-text lines (server builds the ESC/POS packet).
 * Useful for quick testing without a full POS system.
 *
 * Body:
 * {
 *   "printer": "PT210",
 *   "lines": ["Hello World", "---", "Total: $10.00"]
 * }
 */
router.post('/text', async (req, res) => {
  const { printer, lines, beep } = req.body;

  if (!printer) {
    return res.status(400).json({ error: '"printer" field is required' });
  }

  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: '"lines" must be a non-empty array of strings' });
  }

  try {
    const result = await printService.printText(printer, lines, { beep });
    res.json(result);
  } catch (err) {
    logger.error('Text print job failed', { error: err.message, printer });

    const status = err.message.includes('not registered') ? 404 : 500;

    res.status(status).json({ error: err.message });
  }
});

module.exports = router;