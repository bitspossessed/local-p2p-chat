import os from 'os';
import crypto from 'crypto';

// Helper method to retreive your host's IPv4 address
export function getIPv4Address() {
  let result = '0.0.0.0';

  const interfaces = os.networkInterfaces();
  const names = Object.keys(interfaces);

  names.forEach((name) => {
    const addresses = interfaces[name];

    addresses.forEach(({ family, address, internal }) => {
      if ((family === 'IPv4' || family === 4) && !internal) {
        result = address;
      }
    });
  });

  return result;
}

// Helper method to generate a random hash. This helps us to identify
// different peers.
//
// ✺ If you want to be fancy you can replace this with a cryptographic
// key pair and start signing your messages you send on the chat 8-)
export function generateRandomId(len = 8) {
  const bytes = new Uint8Array((len || 40) / 2);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('hex');
}
