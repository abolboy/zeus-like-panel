const createApp = require("./src/app");
const config = require("./src/config");
const { ensureAdmin } = require("./src/store/admin");
const { ensureSettings } = require("./src/store/settings");
const logger = require("./src/logger");
require("./src/services/notifier-watcher");

if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("PORT نامعتبر است");
}

const app = createApp();

// اضافه کردن هدر Cache-Control برای جلوگیری از کش
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path.endsWith('.js') || req.path.endsWith('.css')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  }
  next();
});

ensureAdmin()
  .then(() => {
    ensureSettings();
    const server = app.listen(config.port, "0.0.0.0", () => {
      logger.info("Zeus Panel started", { port: config.port, env: config.env });
    });

    function shutdown(signal) {
      logger.info("Shutting down", { signal });
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 10000).unref();
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection", {
        reason: reason instanceof Error ? reason.stack : String(reason),
      });
    });

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception", { error: error.stack });
      process.exit(1);
    });
  })
  .catch((err) => {
    logger.error("Startup failed", { error: err.message });
    process.exit(1);
  });
