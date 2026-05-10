const logger = require('../utils/logger');
const UsbPrinter = require('../printers/UsbPrinter');
const NetworkPrinter = require('../printers/NetworkPrinter');

/**
 * PrinterRegistry — Central registry for all configured printers.
 *
 * Printers can be registered by name and retrieved for print operations.
 * Supports hot-registration at runtime via the API.
 */
class PrinterRegistry {
  constructor() {
    /** @type {Map<string, import('../printers/BasePrinter')>} */
    this._printers = new Map();
  }

  /**
   * Register a printer instance under a given name.
   * @param {string} name
   * @param {import('../printers/BasePrinter')} printer
   */
  register(name, printer) {
    if (this._printers.has(name)) {
      logger.warn(`Printer '${name}' is already registered. Overwriting.`);
    }
    this._printers.set(name, printer);
    logger.info(`Printer registered: ${name} (${printer.constructor.name})`);
  }

  /**
   * Retrieve a printer by name.
   * @param {string} name
   * @returns {import('../printers/BasePrinter')|undefined}
   */
  get(name) {
    return this._printers.get(name);
  }

  /**
   * Return info for all registered printers.
   * @returns {object[]}
   */
  list() {
    return Array.from(this._printers.values()).map((p) => p.getInfo());
  }

  /**
   * Unregister a printer by name.
   * @param {string} name
   * @returns {boolean}
   */
  remove(name) {
    return this._printers.delete(name);
  }

  /**
   * Check if a printer is registered.
   * @param {string} name
   * @returns {boolean}
   */
  has(name) {
    return this._printers.has(name);
  }

  /**
   * Create and register a printer from a plain config object.
   * @param {object} config
   * @param {'usb'|'network'} config.type
   * @param {string} config.name
   * @param {object} config  - remaining fields forwarded to adapter
   * @returns {import('../printers/BasePrinter')}
   */
  createFromConfig(config) {
    const { type, name } = config;

    let printer;
    switch (type) {
      case 'usb':
        printer = new UsbPrinter(config);
        break;
      case 'network':
        printer = new NetworkPrinter(config);
        break;
      default:
        throw new Error(`Unknown printer type: '${type}'. Supported: usb, network`);
    }

    this.register(name, printer);
    return printer;
  }
}

// Singleton instance shared across the app
const registry = new PrinterRegistry();

// Auto-register printers from environment if provided
(function autoRegisterFromEnv() {
  const networkHost = process.env.NETWORK_PRINTER_HOST;
  if (networkHost) {
    try {
      registry.createFromConfig({
        type: 'network',
        name: process.env.DEFAULT_PRINTER || 'default-network',
        host: networkHost,
        port: parseInt(process.env.NETWORK_PRINTER_PORT, 10) || 9100,
      });
    } catch (err) {
      logger.warn('Failed to auto-register network printer from env', { error: err.message });
    }
  }

  const usbVendorId = process.env.USB_VENDOR_ID;
  const usbProductId = process.env.USB_PRODUCT_ID;
  if (usbVendorId && usbProductId) {
    try {
      registry.createFromConfig({
        type: 'usb',
        name: process.env.DEFAULT_PRINTER || 'default-usb',
        vendorId: parseInt(usbVendorId, 16),
        productId: parseInt(usbProductId, 16),
      });
    } catch (err) {
      logger.warn('Failed to auto-register USB printer from env', { error: err.message });
    }
  }
})();

module.exports = registry;