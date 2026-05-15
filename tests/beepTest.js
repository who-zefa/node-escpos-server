const usb = require('usb');

const VENDOR_ID = 0x0416;
const PRODUCT_ID = 0x5011;

const beepCommands = [
//   {
//     name: 'ASCII BEL',
//     data: Buffer.from([0x07]),
//   },
//   {
//     name: 'ESC BEL',
//     data: Buffer.from([0x1B, 0x07]),
//   },
  {
    name: 'ESC BEEP',
    data: Buffer.from([0x1B, 0x42, 0x03, 0x02]),
  },
  {
    name: 'ESC BEEP ALT',
    data: Buffer.from([0x1B, 0x42, 0x05, 0x01]),
  },
//   {
//     name: 'DLE DC4',
//     data: Buffer.from([0x10, 0x14, 0x01, 0x00, 0x05]),
//   },
//   {
//     name: 'CASH DRAWER PULSE',
//     data: Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]),
//   },
];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  try {
    const device = usb.findByIds(VENDOR_ID, PRODUCT_ID);

    if (!device) {
      throw new Error('Printer not found');
    }

    device.open();

    let endpoint = null;

    for (const iface of device.interfaces) {

      try {
        iface.claim();
      } catch (e) {}

      for (const ep of iface.endpoints) {
        if (ep.direction === 'out') {
          endpoint = ep;
          break;
        }
      }

      if (endpoint) break;
    }

    if (!endpoint) {
      throw new Error('No OUT endpoint found');
    }

    console.log('Printer connected');
    console.log('Testing beep commands...\n');

    for (const cmd of beepCommands) {

      console.log('Sending:', cmd.name);

      await new Promise((resolve, reject) => {

        endpoint.transfer(cmd.data, err => {

          if (err) {
            console.log('Failed:', err.message);
            reject(err);
          } else {
            console.log('Sent successfully');
            resolve();
          }

        });

      });

      await sleep(1500);
    }

    console.log('\nAll beep tests completed');

    device.close();

  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

main();