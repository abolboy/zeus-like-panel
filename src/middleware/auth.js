const { loadAdmin } = require("../store/admin");
const { loadUsers } = require("../store/users");
const { isExpired } = require("../utils/date");

function sessionVersionMatches(session, record) {
  const sessionVersion = Number(session?.authVersion ?? 0);
  const recordVersion = Number(record?.authVersion ?? 0);
  return Number.isSafeInteger(sessionVersion) &&
    Number.isSafeInteger(recordVersion) &&
    sessionVersion === recordVersion;
}

function requireAdmin(req, res, next) {
  const session = req.session;
  const admin = session?.admin ? loadAdmin() : null;
  if (
    session?.admin &&
    admin &&
    session.admin === admin.username &&
    sessionVersionMatches(session, admin)
  ) {
    return next();
  }
  res.status(401).json({ error: "ورود به پنل مدیریت لازم است" });
}

function requireUserOrAdmin(req, res, next) {
  if (req.session?.admin) return requireAdmin(req, res, next);
  if (req.session?.userId) return requireUser(req, res, next);
  res.status(401).json({ error: "ورود لازم است" });
}

function requireUser(req, res, next) {
  const session = req.session;
  const user = session?.userId
    ? loadUsers().find((item) => String(item.id) === String(session.userId))
    : null;

  if (
    session?.userId &&
    user &&
    user.active &&
    !isExpired(user.expiry) &&
    sessionVersionMatches(session, user)
  ) {
    return next();
  }
  res.status(401).json({ error: "ورود کاربر لازم است" });
}

module.exports = { requireAdmin, requireUserOrAdmin, requireUser };
