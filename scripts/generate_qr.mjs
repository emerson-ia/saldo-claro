#!/usr/bin/env node
import QRCode from "qrcode";

const url = process.argv[2] ?? process.env.EXPO_APP_QR_URL;

if (!url) {
  console.error('Usage: node scripts/generate_qr.mjs "exps://..."');
  console.error('Or set EXPO_APP_QR_URL in the environment.');
  process.exit(1);
}

await QRCode.toFile("expo-qr-code.png", url, { width: 512 });
console.log(`✅ QR code saved to expo-qr-code.png`);
