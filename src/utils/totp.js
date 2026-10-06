const crypto = require("crypto");

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const SECRET_BYTES = 20;
const CODE_DIGITS = 6;
const PERIOD_SECONDS = 30;
const DEFAULT_WINDOW_STEPS = 1;

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function generateSecret(len = SECRET_BYTES) {
  if (!Number.isInteger(len) || len < 16 || len > 64) {
    throw new RangeError("TOTP secret length must be between 16 and 64 bytes");
  }
  return base32Encode(crypto.randomBytes(len));
}

function base32Decode(secret) {
  const clean = String(secret || "")
    .trim()
    .toUpperCase()
    .replace(/=+$/, "");
  if (!clean || !/^[A-Z2-7]+$/.test(clean)) return null;
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  const key = Buffer.from(out);
  if (key.length < 16) return null;
  return key;
}

function codeAt(secret, counter) {
  const key = base32Decode(secret);
  if (!key || !Number.isSafeInteger(counter) || counter < 0) return null;
  const buf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter >>> 0;
  buf.writeUInt32BE(high, 0);
  buf.writeUInt32BE(low, 4);
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return String(bin % 10 ** CODE_DIGITS).padStart(CODE_DIGITS, "0");
}

function safeCodeEqual(a, b) {
  const left = Buffer.from(String(a), "ascii");
  const right = Buffer.from(String(b), "ascii");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function verifyDetailed(secret, code, windowSteps = DEFAULT_WINDOW_STEPS) {
  if (!secret || code == null) return null;
  if (!Number.isInteger(windowSteps) || windowSteps < 0 || windowSteps > 3) return null;
  const cleanCode = String(code).replace(/\s+/g, "");
  if (!/^[0-9]{6}$/.test(cleanCode)) return null;
  const key = base32Decode(secret);
  if (!key) return null;
  const counter = Math.floor(Date.now() / (PERIOD_SECONDS * 1000));
  for (let offset = -windowSteps; offset <= windowSteps; offset++) {
    const matchedCounter = counter + offset;
    const candidate = codeAt(secret, matchedCounter);
    if (candidate && safeCodeEqual(cleanCode, candidate)) {
      return { counter: matchedCounter };
    }
  }
  return null;
}

function verify(secret, code, windowSteps = DEFAULT_WINDOW_STEPS) {
  return Boolean(verifyDetailed(secret, code, windowSteps));
}

module.exports = { generateSecret, verify, verifyDetailed };
