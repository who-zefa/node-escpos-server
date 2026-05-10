/**
 * Example: Send a raw ESC/POS receipt from Node.js
 *
 * Prerequisites:
 *   1. Node ESC/POS Server is running on localhost:3000
 *   2. A printer named "PT210" is registered (POST /printers first if needed)
 *
 * Run: node examples/send-raw-receipt.js
 */

const http = require('http');

// --- Build a minimal ESC/POS receipt manually ---
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

const receipt = Buffer.concat([
  Buffer.from([ESC, 0x40]),           // Initialize printer
  Buffer.from([ESC, 0x61, 0x01]),     // Center align
  Buffer.from([GS, 0x21, 0x11]),      // Double size
  Buffer.from('MY STORE\n', 'utf8'),
  Buffer.from([GS, 0x21, 0x00]),      // Normal size
  Buffer.from([ESC, 0x61, 0x00]),     // Left align
  Buffer.from('--------------------------------\n', 'utf8'),
  Buffer.from('Item A              $10.00\n', 'utf8'),
  Buffer.from('Item B               $5.00\n', 'utf8'),
  Buffer.from('--------------------------------\n', 'utf8'),
  Buffer.from([ESC, 0x45, 0x01]),     // Bold on
  Buffer.from('TOTAL               $15.00\n', 'utf8'),
  Buffer.from([ESC, 0x45, 0x00]),     // Bold off
  Buffer.from([LF, LF, LF]),          // Feed
  Buffer.from([GS, 0x56, 0x00]),      // Full cut
]);

const payload = JSON.stringify({
  printer: 'PT210',
  data: receipt.toString('base64'),
  encoding: 'base64',
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/print/raw',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  },
};

console.log('Sending print job to Node ESC/POS Server...');

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    const result = JSON.parse(body);
    if (res.statusCode === 200) {
      console.log('✓ Print job sent successfully:', result);
    } else {
      console.error('✗ Print job failed:', result);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.write(payload);
req.end();