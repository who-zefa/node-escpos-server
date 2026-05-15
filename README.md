# Node ESC/POS Server

Lightweight local ESC/POS middleware for sending raw ESC/POS data directly to thermal printers.

Built for modern web-based POS systems that need reliable thermal printing support for both cloud-hosted and localhost applications.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The server runs at `http://localhost:3000` by default.

---

## API Reference

### Health Check

```http
GET /health
```

```json
{
  "status": "running",
  "uptime": 120,
  "printers": { "registered": 1, "connected": 0 }
}
```

---

### List Printers

```http
GET /printers
```

---

### Register a Printer

```http
POST /printers
Content-Type: application/json

{
  "type": "network",
  "name": "kitchen-printer",
  "host": "192.168.1.100",
  "port": 9100
}
```

For USB printers:

```json
{
  "type": "usb",
  "name": "PT210",
  "vendorId": "0x04b8",
  "productId": "0x0202"
}
```

---

### Send Raw ESC/POS Data

```http
POST /print/raw
Content-Type: application/json

{
  "printer": "kitchen-printer",
  "data": "<base64-encoded-escpos-data>",
  "encoding": "base64"
}
```

Supported encodings: `base64` (default), `hex`, `text`.

---

### Print Plain Text

```http
POST /print/text
Content-Type: application/json

{
  "printer": "kitchen-printer",
  "lines": ["Order #42", "---", "Burger x1", "Fries x2"]
}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `HOST` | `localhost` | HTTP server host |
| `LOG_LEVEL` | `info` | Logging level |
| `NETWORK_PRINTER_HOST` | — | Auto-register a network printer |
| `NETWORK_PRINTER_PORT` | `9100` | Network printer port |
| `USB_VENDOR_ID` | — | Auto-register a USB printer (hex) |
| `USB_PRODUCT_ID` | — | USB product ID (hex) |
| `DEFAULT_PRINTER` | — | Default printer name |
| `PRINTER_TIMEOUT_MS` | `5000` | Connection timeout |

---

## Architecture

```
Cloud POS / Local POS / Web App
            ↓
     HTTP REST API
            ↓
  Node ESC/POS Server
            ↓
 USB / Network Adapter
            ↓
    Thermal Printer
```

---


## Running Tests

```bash
npm test
```

---

## License

MIT
