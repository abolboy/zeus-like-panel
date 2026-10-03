const crypto = require("crypto");

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function generateSecret(len = 20) {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += B32[bytes[i] % 32];
  return out;
}

function base32Decode(s) {
  let bits = 0;
  let value = 0;
  const out = [];
  const clean = String(s).toUpperCase().replace(/=+$/, "");
  for (let i = 0; i < clean.length; i++) {
    const idx = B32.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function codeAt(secret, counter) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 1000000).padStart(6, "0");
}

function verify(secret, code, windowSteps = 1) {
  if (!secret || !code) return false;
  const counter = Math.floor(Date.now() / 30000);
  const clean = String(code).replace(/\s+/g, "");
  for (let i = -windowSteps; i <= windowSteps; i++) {
    if (clean === codeAt(secret, counter + i)) return true;
  }
  return false;
}

module.exports = { generateSecret, verify };
