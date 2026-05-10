const logger = require('../utils/logger');

/**
 * BasePrinter — Abstract base class for all printer adapters.
 * Concrete adapters (USB, Network) must extend this class.
 */
class BasePrinter {
  /**
   * @param {object} config
   * @param {string} config.name - Human-readable printer name
   */
  constructor(config = {}) {
    if (new.target === BasePrinter) {
      throw new Error('BasePrinter is abstract and cannot be instantiated directly.');
    }
    this.name = config.name || 'Unknown Printer';
    this.connected = false;
    this.config = config;
  }

  /**
   * Connect to the printer.
   * Must be implemented by subclass.
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error(`${this.constructor.name}.connect() is not implemented`);
  }

  /**
   * Disconnect from the printer.
   * Must be implemented by subclass.
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error(`${this.constructor.name}.disconnect() is not implemented`);
  }

  /**
   * Send raw ESC/POS data to the printer.
   * Must be implemented by subclass.
   * @param {Buffer} data
   * @returns {Promise<void>}
   */
  async print(data) {
    throw new Error(`${this.constructor.name}.print() is not implemented`);
  }

  /**
   * Return printer status info.
   * @returns {object}
   */
  getInfo() {
    return {
      name: this.name,
      type: this.constructor.name,
      connected: this.connected,
      config: this._safeConfig(),
    };
  }

  /**
   * Strip sensitive config fields before exposing.
   * @returns {object}
   */
  _safeConfig() {
    const { password, secret, ...safe } = this.config;
    return safe;
  }

  /**
   * Convenience: log + throw a printer error.
   * @param {string} message
   * @param {Error} [cause]
   */
  _fail(message, cause) {
    const err = new Error(`[${this.name}] ${message}`);
    if (cause) err.cause = cause;
    logger.error(err.message, { cause: cause?.message });
    throw err;
  }
}

module.exports = BasePrinter;