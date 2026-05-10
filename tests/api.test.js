const request = require('supertest');

// Mock the usb module so tests run without physical hardware
jest.mock('usb', () => ({}), { virtual: true });

let app;

beforeAll(() => {
  jest.resetModules();
  // Clear env printer auto-registration
  delete process.env.NETWORK_PRINTER_HOST;
  delete process.env.USB_VENDOR_ID;
  app = require('../src/server');
});

describe('GET /health', () => {
  it('returns status running', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('running');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('printers');
  });
});

describe('GET /printers', () => {
  it('returns a printers array', async () => {
    const res = await request(app).get('/printers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.printers)).toBe(true);
  });
});

describe('POST /printers', () => {
  it('registers a network printer', async () => {
    const res = await request(app).post('/printers').send({
      type: 'network',
      name: 'test-register',
      host: '192.168.1.200',
      port: 9100,
    });
    expect(res.status).toBe(201);
    expect(res.body.printer.name).toBe('test-register');
  });

  it('returns 400 when type or name is missing', async () => {
    const res = await request(app).post('/printers').send({ host: '192.168.1.1' });
    expect(res.status).toBe(400);
  });

  it('returns 409 for duplicate printer name', async () => {
    await request(app).post('/printers').send({
      type: 'network',
      name: 'dup-printer',
      host: '10.0.0.1',
    });
    const res = await request(app).post('/printers').send({
      type: 'network',
      name: 'dup-printer',
      host: '10.0.0.1',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /print/raw', () => {
  it('returns 400 when printer field is missing', async () => {
    const res = await request(app).post('/print/raw').send({ data: 'abc' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when data field is missing', async () => {
    const res = await request(app).post('/print/raw').send({ printer: 'test' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unregistered printer', async () => {
    const res = await request(app).post('/print/raw').send({
      printer: 'ghost-printer',
      data: Buffer.from([0x1b, 0x40]).toString('base64'),
    });
    expect(res.status).toBe(404);
  });
});

describe('POST /print/text', () => {
  it('returns 400 when lines is missing', async () => {
    const res = await request(app).post('/print/text').send({ printer: 'test' });
    expect(res.status).toBe(400);
  });
});