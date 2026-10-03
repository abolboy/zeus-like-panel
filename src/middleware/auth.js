function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "ورود به پنل مدیریت لازم است" });
}

function requireUserOrAdmin(req, res, next) {
  if (req.session && (req.session.admin || req.session.userId)) return next();
  res.status(401).json({ error: "ورود لازم است" });
}

function requireUser(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: "ورود کاربر لازم است" });
}

module.exports = { requireAdmin, requireUserOrAdmin, requireUser };
