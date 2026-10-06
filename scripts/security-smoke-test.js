const assert = require("assert");
const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "ci-test-session-secret";
process.env.TRUST_PROXY = "false";

const config = require("../src/config");
fs.mkdirSync(path.join(config.rootDir, "data"), { recursive: true });

const { loginGuard, registerFailure, registerSuccess } = require("../src/middleware/rate-limit");
const { logEvent, loadLogs, verifyLogs } = require("../src/utils/audit");

(async () => {
  const now = Date.now();
  const originalNow = Date.now;
  try {
    const attempts = [];
    const req = {
      ip: "198.51.100.10",
      body: { username: "ci-user" },
      session: {},
    };
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; },
    };
    let nextCalled = false;
    loginGuard("ci")(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);
    for (let i = 0; i < 5; i++) registerFailure(req._loginGuardKey, req._loginGuardIpKey);
    nextCalled = false;
    loginGuard("ci")(req, res, () => { nextCalled = true; });
    assert.strictEqual(res.statusCode, 429);
    registerSuccess(req._loginGuardKey, req._loginGuardIpKey);
    res.statusCode = 200;
    nextCalled = false;
    loginGuard("ci")(req, res, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true);

    const auditFile = path.join(config.rootDir, "data", "audit-log.json");
    fs.writeFileSync(auditFile, "[]");
    logEvent("ci.test", "ci-admin", { success: true }, { ip: "127.0.0.1", headers: { "user-agent": "ci" } });
    const logs = loadLogs();
    assert.strictEqual(logs.length, 1);
    assert.strictEqual(verifyLogs(logs), true);
    const tampered = JSON.parse(JSON.stringify(logs));
    tampered[0].event = "tampered";
    assert.throws(() => verifyLogs(tampered), /integrity check failed/);

    const usersSource = fs.readFileSync(path.join(config.rootDir, "src", "routes", "users.js"), "utf8");
    const backupSource = fs.readFileSync(path.join(config.rootDir, "src", "routes", "backup.js"), "utf8");
    const plansSource = fs.readFileSync(path.join(config.rootDir, "src", "routes", "plans.js"), "utf8");
    const subSource = fs.readFileSync(path.join(config.rootDir, "src", "routes", "subscription.js"), "utf8");
    const appSource = fs.readFileSync(path.join(config.rootDir, "src", "app.js"), "utf8");
    const loggerSource = fs.readFileSync(path.join(config.rootDir, "src", "middleware", "request-logger.js"), "utf8");

    assert.match(usersSource, /user\.authVersion = Number\(user\.authVersion \|\| 0\) \+ 1;/);
    assert.match(usersSource, /\{ passwordHash, subToken, \.\.\.safe \}/);
    assert.match(backupSource, /\{ passwordHash, subToken, \.\.\.safe \}/);
    assert.match(plansSource, /Number\.isFinite\(traffic\)/);
    assert.match(subSource, /safeEqualText\(user\.subToken/);
    assert.match(subSource, /Cache-Control.*no-store/);
    assert.match(appSource, /express\.json\(\{ limit: "100kb", inflate: false \}\)/);
    assert.match(loggerSource, /url: req\.path/);

    const createApp = require("../src/app");
    const app = createApp();
    const server = await new Promise((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    try {
      const port = server.address().port;
      const base = "http://127.0.0.1:" + port;
      const health = await fetch(base + "/api/health");
      assert.strictEqual(health.status, 200);
      const healthBody = await health.json();
      assert.strictEqual(healthBody.ok, true);

      const unauth = await fetch(base + "/api/users");
      assert.strictEqual(unauth.status, 401);

      const csrf = await fetch(base + "/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ panelName: "blocked" }),
      });
      assert.strictEqual(csrf.status, 403);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }

    console.log("SECURITY_SMOKE_OK");
    process.exit(0);
  } finally {
    Date.now = originalNow;
    void now;
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
