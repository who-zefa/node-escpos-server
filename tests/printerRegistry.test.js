// Isolate from env-based auto-registration by mocking env
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  delete process.env.NETWORK_PRINTER_HOST;
  delete process.env.USB_VENDOR_ID;
  delete process.env.USB_PRODUCT_ID;
});

afterEach(() => {
  process.env = originalEnv;
});

describe('PrinterRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new (require('../src/services/printerRegistry').constructor || Object)();
    // Fresh registry for each test
    const { PrinterRegistry } = jest.requireActual('../src/services/printerRegistry').__proto__
      ? { PrinterRegistry: require('../src/services/printerRegistry').constructor }
      : {};

    // Re-require a fresh instance
    jest.resetModules();
    const mod = require('../src/services/printerRegistry');
    // Use the module's singleton but clear it
    registry = mod;
    // Remove all printers
    for (const name of [...mod._printers.keys()]) {
      mod.remove(name);
    }
  });

  it('registers and retrieves a printer', () => {
    const NetworkPrinter = require('../src/printers/NetworkPrinter');
    const printer = new NetworkPrinter({ name: 'test-net', host: '192.168.1.1' });
    registry.register('test-net', printer);
    expect(registry.get('test-net')).toBe(printer);
  });

  it('lists registered printers', () => {
    const NetworkPrinter = require('../src/printers/NetworkPrinter');
    registry.register('p1', new NetworkPrinter({ name: 'p1', host: '10.0.0.1' }));
    registry.register('p2', new NetworkPrinter({ name: 'p2', host: '10.0.0.2' }));
    const list = registry.list();
    expect(list.length).toBeGreaterThanOrEqual(2);
  });

  it('removes a registered printer', () => {
    const NetworkPrinter = require('../src/printers/NetworkPrinter');
    registry.register('remove-me', new NetworkPrinter({ name: 'remove-me', host: '10.0.0.3' }));
    expect(registry.remove('remove-me')).toBe(true);
    expect(registry.get('remove-me')).toBeUndefined();
  });

  it('returns false when removing a non-existent printer', () => {
    expect(registry.remove('ghost')).toBe(false);
  });

  it('creates a network printer from config', () => {
    const printer = registry.createFromConfig({
      type: 'network',
      name: 'config-net',
      host: '192.168.100.1',
      port: 9100,
    });
    expect(printer.constructor.name).toBe('NetworkPrinter');
    registry.remove('config-net');
  });

  it('throws on unknown printer type', () => {
    expect(() =>
      registry.createFromConfig({ type: 'bluetooth', name: 'bt', address: 'AA:BB' })
    ).toThrow(/Unknown printer type/);
  });
});