const express = require("express");
const session = require("express-session");
const path = require("path");

const config = require("./config");
const { securityHeaders } = require("./middleware/security");
const { requestLogger } = require("./middleware/request-logger");

const authRouter = require("./routes/auth");
const adminAccountRouter = require("./routes/admin-account");
const userAccountRouter = require("./routes/user-account");
const settingsRouter = require("./routes/settings");
const statsRouter = require("./routes/stats");
const usersRouter = require("./routes/users");
const serversRouter = require("./routes/servers");
const renewalRouter = require("./routes/renewal");
const subscriptionRouter = require("./routes/subscription");
const reportsRouter = require("./routes/reports");
const backupRouter = require("./routes/backup");
const auditRouter = require("./routes/audit");
const analyticsRouter = require("./routes/analytics");

function safeSendFile(res, filePath, label) {
  const fs = require("fs");
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`صفحه «${label}» هنوز ساخته نشده است.`);
  }
  res.sendFile(filePath);
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use((req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); });
  app.use(express.json());
  app.use("/assets", express.static(config.publicDir));

  app.use(
    session({
      name: config.sessionCookieName,
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: config.isProduction,
        maxAge: config.sessionMaxAge,
      },
    })
  );

  // صفحات
  app.get("/", (req, res) => {
    if (req.session?.admin) return res.sendFile(path.join(config.rootDir, "dashboard.html"));
    if (req.session?.userId) return res.redirect("/sub/" + encodeURIComponent(req.session.username));
    return res.redirect("/user-login");
  });

  app.get(["/dashboard", "/dashboard.html"], (req, res) => {
    if (req.session?.admin) return res.sendFile(path.join(config.rootDir, "dashboard.html"));
    if (req.session?.userId) return res.redirect("/sub/" + encodeURIComponent(req.session.username));
    return res.redirect("/login");
  });

  app.get(["/login", "/login.html"], (req, res) => {
    safeSendFile(res, path.join(config.rootDir, "login.html"), "ورود مدیر");
  });

  app.get(["/user-login", "/user-login.html"], (req, res) => {
    safeSendFile(res, path.join(config.rootDir, "user-login.html"), "ورود کاربر");
  });

  app.get(["/sub/:username", "/sub.html"], (req, res) => {
    safeSendFile(res, path.join(config.rootDir, "sub.html"), "اشتراک کاربر");
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      ok: true,
      service: "zeus-panel",
      uptime: Math.round(process.uptime()),
    });
  });

  app.use("/api", authRouter);
  app.use("/api", adminAccountRouter);
  app.use("/api/user", userAccountRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/stats", statsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/servers", serversRouter);
  app.use("/api/agent", (req, res, next) => {
    if (req.path === "/usage") {
      return serversRouter(req, res, next);
    }
    next();
  });
  app.use("/api", renewalRouter);
  app.use("/api/sub", subscriptionRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/backup", backupRouter);
    app.use("/api/audit", auditRouter);
    app.use("/api/analytics", analyticsRouter);
    app.use("/api/tickets", require("./routes/tickets"));
    app.use("/api/plans", require("./routes/plans"));
    app.use("/api/renewal", require("./routes/renewal"));

  app.use("/api/notifications", require("./routes/notifications"));

  // 404 و error handler

  // --- روت سازگار: لیست درخواست‌های تمدید (برای ویجت‌های قدیمی) ---
  app.get("/api/renewal-requests", require("./middleware/auth").requireAdmin, (req, res) => {
    try {
      const fs2 = require("fs");
      const path2 = require("path");
      const file = path2.join(config.rootDir, "data", "renewal-requests.json");
      let list = [];
      try { list = JSON.parse(fs2.readFileSync(file, "utf8")); } catch (e) {}
      res.json(list.filter(r => r.status === "pending"));
    } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
  });

  // --- روت سازگار: نمودار رشد کاربران ---
  app.get("/api/reports/growth", require("./middleware/auth").requireAdmin, (req, res) => {
    try {
      const fs2 = require("fs");
      const path2 = require("path");
      const uFile = path2.join(config.rootDir, "data", "users.json");
      let users = [];
      try { users = JSON.parse(fs2.readFileSync(uFile, "utf8")); } catch (e) {}
      const labels = [], counts = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        labels.push(key.slice(5));
        counts.push(users.filter(u => String(u.createdAt || u.created || "").slice(0, 10) === key).length);
      }
      res.json({ labels: labels, counts: counts, growth: counts, days: 30 });
    } catch (e) { res.status(500).json({ error: "خطای سرور" }); }
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: "مسیر مورد نظر پیدا نشد" });
  });

  app.use((err, req, res, next) => {
    console.error("خطای غیرمنتظره:", err);
    if (res.headersSent) return next(err);
    res.status(500).json({ error: "خطای غیرمنتظره‌ی سرور. لطفاً دوباره تلاش کنید." });
  });

  return app;
}

module.exports = createApp;
