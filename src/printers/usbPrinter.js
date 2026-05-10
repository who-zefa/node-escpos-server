const BasePrinter = require('./BasePrinter');
const logger = require('../utils/logger');

/**
 * UsbPrinter — ESC/POS printer adapter for USB-connected thermal printers.
 *
 * Uses the `usb` npm package to communicate with raw USB endpoints.
 * The printer must expose a bulk-out endpoint (typical for ESC/POS printers).
 *
 * @example
 * const printer = new UsbPrinter({ vendorId: 0x04b8, productId: 0x0202 });
 * await printer.connect();
 * await printer.print(rawEscPosBuffer);
 * await printer.disconnect();
 */
class UsbPrinter extends BasePrinter {
  /**
   * @param {object} config
   * @param {number} config.vendorId   - USB Vendor ID (decimal or 0x hex)
   * @param {number} config.productId  - USB Product ID (decimal or 0x hex)
   * @param {string} [config.name]     - Friendly name
   */
  constructor(config = {}) {
    super({ name: config.name || 'USB Printer', ...config });

    if (!config.vendorId || !config.productId) {
      throw new Error('UsbPrinter requires vendorId and productId in config.');
    }

    this.vendorId = config.vendorId;
    this.productId = config.productId;
    this._device = null;
    this._endpoint = null;
  }

  /**
   * Open the USB device and claim the printer interface.
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      // Dynamic import so the module load doesn't crash if `usb` is unavailable
      const usb = require('usb');

      const device = usb.findByIds(this.vendorId, this.productId);
      if (!device) {
        this._fail(
          `USB device not found (vendorId=0x${this.vendorId.toString(16)}, productId=0x${this.productId.toString(16)})`
        );
      }

      device.open();

      // Find the first interface with a bulk-out endpoint
      let endpoint = null;
      for (const iface of device.interfaces) {
        iface.claim();
        for (const ep of iface.endpoints) {
          if (ep.direction === 'out') {
            endpoint = ep;
            break;
          }
        }
        if (endpoint) break;
      }

      if (!endpoint) {
        device.close();
        this._fail('No bulk-out endpoint found on USB device.');
      }

      this._device = device;
      this._endpoint = endpoint;
      this.connected = true;

      logger.info(`USB printer connected: ${this.name}`, {
        vendorId: `0x${this.vendorId.toString(16)}`,
        productId: `0x${this.productId.toString(16)}`,
      });
    } catch (err) {
      if (err.message.includes('USB device not found') || err.message.includes('No bulk-out')) {
        throw err;
      }
      this._fail('Failed to connect to USB printer', err);
    }
  }

  /**
   * Release interface and close the USB device.
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (!this._device) return;

    try {
      await new Promise((resolve, reject) => {
        if (this._endpoint) {
          this._endpoint.stopPoll?.();
        }
        this._device.close();
        resolve();
      });

      this.connected = false;
      this._device = null;
      this._endpoint = null;
      logger.info(`USB printer disconnected: ${this.name}`);
    } catch (err) {
      this._fail('Failed to disconnect USB printer', err);
    }
  }

  /**
   * Send raw ESC/POS data to the printer via bulk transfer.
   * @param {Buffer} data
   * @returns {Promise<void>}
   */
  async print(data) {
    if (!this.connected || !this._endpoint) {
      this._fail('Printer is not connected. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this._endpoint.transfer(data, (err) => {
        if (err) {
          logger.error(`USB transfer failed: ${this.name}`, { error: err.message });
          reject(new Error(`USB transfer error: ${err.message}`));
        } else {
          logger.info(`Printed ${data.length} bytes via USB: ${this.name}`);
          resolve();
        }
      });
    });
  }

  /**
   * @returns {object}
   */
  getInfo() {
    return {
      ...super.getInfo(),
      vendorId: `0x${this.vendorId.toString(16)}`,
      productId: `0x${this.productId.toString(16)}`,
    };
  }
}

module.exports = UsbPrinter;