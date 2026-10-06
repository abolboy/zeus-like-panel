const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;
const MAX_TRACKED = 10000;
const IP_MAX_ATTEMPTS = 20;

function cleanup(now) {
  for (const [key, rec] of attempts) {
    if ((!rec.blockedUntil || rec.blockedUntil <= now) && now - rec.first > WINDOW_MS) {
      attempts.delete(key);
    }
  }
  if (attempts.size > MAX_TRACKED) {
    const entries = [...attempts.entries()].sort((a, b) => a[1].first - b[1].first);
    for (const [key] of entries.slice(0, attempts.size - MAX_TRACKED)) attempts.delete(key);
  }
}

function loginGuard(scope) {
  return (req, res, next) => {
    const now = Date.now();
    cleanup(now);
    const identity =
      scope === "adminotp"
        ? (req.session?.otpPending || req.body?.username || "")
        : (req.body?.username || "");
    const ipKey = scope + ":ip:" + req.ip;
    const key = scope + ":" + req.ip + ":" + identity;
    const ipRec = attempts.get(ipKey);

    if (ipRec?.blockedUntil && ipRec.blockedUntil > now) {
      const minutesLeft = Math.ceil((ipRec.blockedUntil - now) / 60000);
      return res.status(429).json({
        error: `تعداد تلاش‌های ناموفق از این IP بیش از حد مجاز بود. لطفاً ${minutesLeft} دقیقه دیگر دوباره تلاش کنید.`,
      });
    }

    const rec = attempts.get(key);
    if (rec?.blockedUntil && rec.blockedUntil > now) {
      const minutesLeft = Math.ceil((rec.blockedUntil - now) / 60000);
      return res.status(429).json({
        error: `تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً ${minutesLeft} دقیقه دیگر دوباره تلاش کنید.`,
      });
    }
    req._loginGuardKey = key;
    req._loginGuardIpKey = ipKey;
    next();
  };
}

function registerFailure(key, ipKey) {
  const now = Date.now();
  for (const currentKey of [key, ipKey].filter(Boolean)) {
    const rec = attempts.get(currentKey) || { count: 0, first: now };
    if (now - rec.first > WINDOW_MS) {
      rec.count = 0;
      rec.first = now;
    }
    rec.count += 1;
    const limit = currentKey === ipKey ? IP_MAX_ATTEMPTS : MAX_ATTEMPTS;
    if (rec.count >= limit) rec.blockedUntil = now + BLOCK_MS;
    attempts.set(currentKey, rec);
  }
}

function registerSuccess(key, ipKey) {
  attempts.delete(key);
  if (ipKey) attempts.delete(ipKey);
}

module.exports = { loginGuard, registerFailure, registerSuccess };
