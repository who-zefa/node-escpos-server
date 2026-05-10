const net = require('net');
const BasePrinter = require('./BasePrinter');
const logger = require('../utils/logger');

/**
 * NetworkPrinter — ESC/POS printer adapter for TCP/IP-connected thermal printers.
 *
 * Communicates over a raw TCP socket (typical port: 9100).
 * Works with WiFi and wired-LAN ESC/POS printers.
 *
 * @example
 * const printer = new NetworkPrinter({ host: '192.168.1.100', port: 9100 });
 * await printer.connect();
 * await printer.print(rawEscPosBuffer);
 * await printer.disconnect();
 */
class NetworkPrinter extends BasePrinter {
  /**
   * @param {object} config
   * @param {string} config.host           - Printer IP address or hostname
   * @param {number} [config.port=9100]    - TCP port (default 9100)
   * @param {number} [config.timeout=5000] - Connection timeout in ms
   * @param {string} [config.name]         - Friendly name
   */
  constructor(config = {}) {
    super({ name: config.name || `Network Printer (${config.host})`, ...config });

    if (!config.host) {
      throw new Error('NetworkPrinter requires a host in config.');
    }

    this.host = config.host;
    this.port = config.port || 9100;
    this.timeout = config.timeout || parseInt(process.env.PRINTER_TIMEOUT_MS, 10) || 5000;
    this._socket = null;
  }

  /**
   * Open a TCP connection to the printer.
   * @returns {Promise<void>}
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();

      socket.setTimeout(this.timeout);

      socket.once('connect', () => {
        this._socket = socket;
        this.connected = true;
        logger.info(`Network printer connected: ${this.name}`, {
          host: this.host,
          port: this.port,
        });
        resolve();
      });

      socket.once('timeout', () => {
        socket.destroy();
        reject(new Error(`Connection timed out: ${this.host}:${this.port}`));
      });

      socket.once('error', (err) => {
        this.connected = false;
        reject(new Error(`Network connection error [${this.host}:${this.port}]: ${err.message}`));
      });

      socket.connect(this.port, this.host);
    });
  }

  /**
   * Close the TCP socket.
   * @returns {Promise<void>}
   */
  async disconnect() {
    return new Promise((resolve) => {
      if (!this._socket) {
        resolve();
        return;
      }

      this._socket.once('close', () => {
        this._socket = null;
        this.connected = false;
        logger.info(`Network printer disconnected: ${this.name}`);
        resolve();
      });

      this._socket.destroy();
    });
  }

  /**
   * Send raw ESC/POS data over the TCP socket.
   * @param {Buffer} data
   * @returns {Promise<void>}
   */
  async print(data) {
    if (!this.connected || !this._socket) {
      this._fail('Printer is not connected. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      this._socket.write(data, (err) => {
        if (err) {
          logger.error(`Network print failed: ${this.name}`, { error: err.message });
          reject(new Error(`Network write error: ${err.message}`));
        } else {
          logger.info(`Printed ${data.length} bytes via network: ${this.name}`);
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
      host: this.host,
      port: this.port,
    };
  }
}

module.exports = NetworkPrinter;