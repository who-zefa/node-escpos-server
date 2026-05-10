const logger = require('../utils/logger');
const registry = require('./printerRegistry');
const { parseRawData, validateEscPosData } = require('../utils/escpos');

/**
 * PrintService — High-level print orchestration.
 *
 * Handles:
 * - Resolving the target printer from the registry
 * - Parsing and validating raw ESC/POS data
 * - Managing connect/print/disconnect lifecycle
 */
class PrintService {
  /**
   * Send raw ESC/POS data to a named printer.
   *
   * @param {object} options
   * @param {string} options.printer   - Registered printer name
   * @param {string} options.data      - Raw ESC/POS data
   * @param {'hex'|'base64'|'text'} [options.encoding='base64'] - Data encoding
   * @returns {Promise<{ success: boolean, bytes: number, printer: string }>}
   */
  async printRaw({ printer: printerName, data, encoding = 'base64' }) {
    // Resolve printer
    const printer = registry.get(printerName);
    if (!printer) {
      throw new Error(`Printer '${printerName}' is not registered. Use GET /printers to list available printers.`);
    }

    // Parse data
    let buffer;
    try {
      buffer = parseRawData(data, encoding);
    } catch (err) {
      throw new Error(`Failed to parse print data (encoding='${encoding}'): ${err.message}`);
    }

    // Validate
    const { valid, reason } = validateEscPosData(buffer);
    if (!valid) {
      throw new Error(`Invalid ESC/POS data: ${reason}`);
    }

    // Connect → Print → Disconnect
    let wasConnected = printer.connected;
    try {
      if (!printer.connected) {
        await printer.connect();
      }

      await printer.print(buffer);

      logger.info(`Print job complete`, {
        printer: printerName,
        bytes: buffer.length,
        encoding,
      });

      return {
        success: true,
        bytes: buffer.length,
        printer: printerName,
      };
    } finally {
      // Only disconnect if we established the connection in this call
      if (!wasConnected && printer.connected) {
        await printer.disconnect();
      }
    }
  }

  /**
   * Print a simple text job — useful for quick tests.
   * @param {string} printerName
   * @param {string[]} lines
   * @returns {Promise<object>}
   */
  async printText(printerName, lines) {
    const { buildTextReceipt } = require('../utils/escpos');
    const buffer = buildTextReceipt(lines);
    return this.printRaw({
      printer: printerName,
      data: buffer.toString('base64'),
      encoding: 'base64',
    });
  }
}

module.exports = new PrintService();