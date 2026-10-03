const logger = require("../logger");

function requestLogger(req, res, next) {
  const startedAt = Date.now();

  res.on("finish", () => {
    logger.info("http", {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - startedAt,
      ip: req.ip,
    });
  });

  next();
}

module.exports = { requestLogger };
