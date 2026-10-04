const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const EXEMPT_PATHS = new Set([
  "/api/login",
  "/api/user-login",
  "/api/login/otp",
]);

function getSourceHost(value) {
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!req.path.startsWith("/api")) return next();
  if (
    EXEMPT_PATHS.has(req.path) ||
    req.path.startsWith("/api/agent/")
  ) {
    return next();
  }

  const host = String(req.get("host") || "").toLowerCase();
  const origin = req.get("origin");
  const referer = req.get("referer");
  const source = origin || referer;
  const sourceHost = getSourceHost(source);

  if (!host || !sourceHost || sourceHost !== host) {
    return res.status(403).json({ error: "درخواست نامعتبر است" });
  }

  next();
}

module.exports = { csrfProtection };
