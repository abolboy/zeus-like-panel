const attempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;

function loginGuard(scope) {
  return (req, res, next) => {
    const identity =
      scope === "adminotp"
        ? (req.session?.otpPending || req.body?.username || "")
        : (req.body?.username || "");

    const key = scope + ":" + req.ip + ":" + identity;
    const rec = attempts.get(key);
    const now = Date.now();

    if (rec?.blockedUntil && rec.blockedUntil > now) {
      const minutesLeft = Math.ceil((rec.blockedUntil - now) / 60000);
      return res.status(429).json({
        error: `تعداد تلاش‌های ناموفق بیش از حد مجاز بود. لطفاً ${minutesLeft} دقیقه دیگر دوباره تلاش کنید.`,
      });
    }
    req._loginGuardKey = key;
    next();
  };
}

function registerFailure(key) {
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, first: now };
  if (now - rec.first > WINDOW_MS) {
    rec.count = 0;
    rec.first = now;
  }
  rec.count += 1;
  if (rec.count >= MAX_ATTEMPTS) {
    rec.blockedUntil = now + BLOCK_MS;
  }
  attempts.set(key, rec);
}

function registerSuccess(key) {
  attempts.delete(key);
}

module.exports = { loginGuard, registerFailure, registerSuccess };
