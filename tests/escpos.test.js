const { validateEscPosData, parseRawData, buildTextReceipt, COMMANDS } = require('../src/utils/escpos');

describe('validateEscPosData', () => {
  it('returns valid for a non-empty Buffer', () => {
    const result = validateEscPosData(Buffer.from([0x1b, 0x40]));
    expect(result.valid).toBe(true);
  });

  it('returns invalid for an empty Buffer', () => {
    const result = validateEscPosData(Buffer.alloc(0));
    expect(result.valid).toBe(false);
    expect(result.reason).toMatch(/empty/i);
  });

  it('returns invalid for a non-buffer', () => {
    const result = validateEscPosData('not a buffer');
    expect(result.valid).toBe(false);
  });
});

describe('parseRawData', () => {
  it('returns Buffer as-is', () => {
    const buf = Buffer.from([0x01, 0x02]);
    expect(parseRawData(buf)).toBe(buf);
  });

  it('decodes base64', () => {
    const original = Buffer.from('hello');
    const b64 = original.toString('base64');
    expect(parseRawData(b64, 'base64')).toEqual(original);
  });

  it('decodes hex', () => {
    const original = Buffer.from([0xde, 0xad]);
    const hex = 'dead';
    expect(parseRawData(hex, 'hex')).toEqual(original);
  });

  it('decodes text', () => {
    expect(parseRawData('hello', 'text')).toEqual(Buffer.from('hello', 'utf8'));
  });

  it('throws on unknown encoding', () => {
    expect(() => parseRawData('x', 'binary')).toThrow(/Unknown encoding/);
  });
});

describe('buildTextReceipt', () => {
  it('returns a Buffer', () => {
    const buf = buildTextReceipt(['Hello', 'World']);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it('includes INIT command at start', () => {
    const buf = buildTextReceipt(['Test']);
    const init = COMMANDS.INIT;
    expect(buf.slice(0, init.length)).toEqual(init);
  });

  it('includes the text lines', () => {
    const buf = buildTextReceipt(['Receipt Line']);
    expect(buf.toString()).toContain('Receipt Line');
  });
});