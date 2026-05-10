/**
 * Example: Register a network printer via the REST API
 *
 * Run: node examples/register-network-printer.js
 */

const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log('Registering network printer...');

  const { status, body } = await post('/printers', {
    type: 'network',
    name: 'kitchen-printer',
    host: '192.168.1.150',
    port: 9100,
  });

  if (status === 201) {
    console.log('✓ Printer registered:', body.printer);
  } else {
    console.error('✗ Registration failed:', body);
  }
}

main().catch(console.error);