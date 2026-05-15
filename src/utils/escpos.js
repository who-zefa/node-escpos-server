/**
 * ESC/POS Command Constants and Helper Utilities
 */

const ESC = 0x1b; // Escape character
const GS = 0x1d; // Group Separator
const LF = 0x0a; // Line Feed
const NUL = 0x00; // Null character
const BEEP = 0x07; // Beep

const COMMANDS = {
  // Initialization
  INIT: Buffer.from([ESC, 0x40]),

  // Line feed
  LF: Buffer.from([LF]),

  // Cut paper
  CUT_FULL: Buffer.from([GS, 0x56, 0x00]),
  CUT_PARTIAL: Buffer.from([GS, 0x56, 0x01]),

  // Text formatting
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  UNDERLINE_ON: Buffer.from([ESC, 0x2d, 0x01]),
  UNDERLINE_OFF: Buffer.from([ESC, 0x2d, 0x00]),
  INVERT_ON: Buffer.from([GS, 0x42, 0x01]),
  INVERT_OFF: Buffer.from([GS, 0x42, 0x00]),

  // Alignment
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  ALIGN_RIGHT: Buffer.from([ESC, 0x61, 0x02]),

  // Font sizes
  FONT_NORMAL: Buffer.from([GS, 0x21, 0x00]),
  FONT_DOUBLE_HEIGHT: Buffer.from([GS, 0x21, 0x01]),
  FONT_DOUBLE_WIDTH: Buffer.from([GS, 0x21, 0x10]),
  FONT_DOUBLE: Buffer.from([GS, 0x21, 0x11]),

  // Cash drawer
  CASH_DRAWER: Buffer.from([ESC, 0x70, 0x00, 0x19, 0xfa]),
  BEEP: Buffer.from([0x1B, 0x42, 0x03, 0x01]),
};

/**
 * Validate that a buffer contains plausible ESC/POS data.
 * Checks for at least one known ESC/POS command byte sequence.
 * @param {Buffer} data
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateEscPosData(data) {
  if (!Buffer.isBuffer(data) && !ArrayBuffer.isView(data)) {
    return { valid: false, reason: 'Data must be a Buffer or typed array' };
  }
  if (data.length === 0) {
    return { valid: false, reason: 'Data is empty' };
  }
  return { valid: true };
}

/**
 * Parse raw ESC/POS data from various input formats.
 * Accepts: Buffer, hex string, base64 string, or plain string (text).
 * @param {string|Buffer} input
 * @param {'hex'|'base64'|'text'|'buffer'} encoding
 * @returns {Buffer}
 */
function parseRawData(input, encoding = 'base64') {
  if (Buffer.isBuffer(input)) return input;

  switch (encoding) {
    case 'hex':
      return Buffer.from(input, 'hex');
    case 'base64':
      return Buffer.from(input, 'base64');
    case 'text':
      return Buffer.from(input, 'utf8');
    default:
      throw new Error(`Unknown encoding: ${encoding}`);
  }
}

/**
 * Build a simple text receipt as ESC/POS Buffer.
 * Useful for testing without a full POS system.
 * @param {string[]} lines
 * @returns {Buffer}
 */
function buildTextReceipt(lines, options = {}) {

  const parts = [COMMANDS.INIT];

  if (options.beep) {
    parts.push(COMMANDS.BEEP);
  }

  for (const line of lines) {
    parts.push(Buffer.from(line + '\n', 'utf8'));
  }

  parts.push(COMMANDS.CUT_FULL);

  return Buffer.concat(parts);
}

module.exports = {
  COMMANDS,
  ESC,
  GS,
  LF,
  NUL,
  BEEP,
  validateEscPosData,
  parseRawData,
  buildTextReceipt,
};