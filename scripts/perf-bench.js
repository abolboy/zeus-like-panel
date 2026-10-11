/**
 * Zeus Panel – performance benchmark (Termux-safe)
 * - Uses temp data dir (does NOT touch production JSON)
 * - Measures latency + throughput of key endpoints
 * - Node built-ins only (no extra deps)
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");

process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "perf-bench-session-secret";
process.env.TRUST_PROXY = "false";
process.env.ADMIN_INITIAL_PASSWORD = "PerfBenchPass12!";
process.env.PORT = "0";
process.env.PERF_QUIET = "1";
process.env.LOG_LEVEL = "error";

const config = require("../src/config");
const originalRoot = config.rootDir;
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "zeus-perf-"));
config.rootDir = tmpRoot;
config.dataDir = tmpRoot;
config.usersFile = path.join(tmpRoot, "users.json");
config.adminFile = path.join(tmpRoot, "admin.json");
config.settingsFile = path.join(tmpRoot, "settings.json");
config.serversFile = path.join(tmpRoot, "servers.json");
config.publicDir = path.join(originalRoot, "public");

fs.mkdirSync(path.join(tmpRoot, "data"), { recursive: true });
fs.mkdirSync(path.join(tmpRoot, "data", "sessions"), { recursive: true });
fs.writeFileSync(config.usersFile, "[]");
fs.writeFileSync(config.serversFile, "[]");
fs.writeFileSync(config.settingsFile, "{}");
fs.writeFileSync(path.join(tmpRoot, "data", "renewal-requests.json"), "[]");
fs.writeFileSync(path.join(tmpRoot, "data", "tickets.json"), "[]");
fs.writeFileSync(path.join(tmpRoot, "data", "plans.json"), "[]");

// Seed a few users for realistic list size
const bcrypt = require("bcryptjs");
(async () => {
  const hash = await bcrypt.hash("PerfUserPass12!", 4); // cost 4 for speed in bench seed only
  const users = [];
  const USER_COUNT = Number(process.env.PERF_USERS || 500);
  for (let i = 0; i < USER_COUNT; i++) {
    users.push({
      id: String(1000 + i),
      username: "perfuser" + i,
      passwordHash: hash,
      authVersion: 0,
      expiry: "31-12-2027",
      traffic: 100,
      trafficUsed: i % 10,
      serverIds: [],
      active: i % 7 !== 0,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }
  fs.writeFileSync(config.usersFile, JSON.stringify(users, null, 2));
  console.log("users seeded:", USER_COUNT);

  const { ensureAdmin } = require("../src/store/admin");
  await ensureAdmin();

  // Reduce request-logger noise when possible
  try {
    const loggerPath = require.resolve("../src/middleware/request-logger");
    const rl = require(loggerPath);
    if (rl && typeof rl === "function") {
      // no-op patch only if module exports a replaceable middleware factory – skip if shape unknown
    }
  } catch (e) {}
  const createApp = require("../src/app");
  const app = createApp();
  // Soft-mute console.info used by request logger during bench
  if (process.env.PERF_QUIET === "1") {
    const origInfo = console.info;
    console.info = function () {
      if (arguments[0] && typeof arguments[0] === "object" && arguments[0].message === "http") return;
      if (typeof arguments[0] === "string" && arguments[0].includes('"message":"http"')) return;
      return origInfo.apply(console, arguments);
    };
    const origLog = console.log;
    console.log = function () {
      const a0 = arguments[0];
      if (typeof a0 === "string" && a0.indexOf('"message":"http"') !== -1) return;
      if (a0 && typeof a0 === "object" && a0.message === "http") return;
      return origLog.apply(console, arguments);
    };
  }
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const port = server.address().port;
  const base = "http://127.0.0.1:" + port;

  function request(method, urlPath, headers, body) {
    return new Promise((resolve, reject) => {
      const u = new URL(urlPath, base);
      const opts = {
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers: headers || {},
      };
      const t0 = process.hrtime.bigint();
      const req = http.request(opts, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const ms = Number(process.hrtime.bigint() - t0) / 1e6;
          resolve({
            status: res.statusCode,
            ms,
            bytes: Buffer.concat(chunks).length,
          });
        });
      });
      req.on("error", reject);
      if (body) req.write(body);
      req.end();
    });
  }

  function stats(arr) {
    if (!arr.length) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    const pct = (p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
    return {
      n: sorted.length,
      min: +sorted[0].toFixed(2),
      avg: +(sum / sorted.length).toFixed(2),
      p50: +pct(50).toFixed(2),
      p95: +pct(95).toFixed(2),
      p99: +pct(99).toFixed(2),
      max: +sorted[sorted.length - 1].toFixed(2),
    };
  }

  async function runCase(name, fn, rounds) {
    const times = [];
    let ok = 0;
    let fail = 0;
    let bytes = 0;
    // warmup
    for (let i = 0; i < 3; i++) {
      try { await fn(); } catch {}
    }
    const wall0 = process.hrtime.bigint();
    for (let i = 0; i < rounds; i++) {
      try {
        const r = await fn();
        times.push(r.ms);
        bytes += r.bytes || 0;
        if (r.status >= 200 && r.status < 500) ok++;
        else fail++;
      } catch {
        fail++;
      }
    }
    const wallMs = Number(process.hrtime.bigint() - wall0) / 1e6;
    const s = stats(times);
    const rps = s ? +((s.n / wallMs) * 1000).toFixed(1) : 0;
    return { name, rounds, ok, fail, rps, bytes, ...s };
  }

  // Login once to get session cookie for authed endpoints
  let cookie = "";
  {
    const loginBody = JSON.stringify({
      username: "admin",
      password: process.env.ADMIN_INITIAL_PASSWORD,
    });
    const u = new URL("/api/login", base);
    const loginRes = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port,
          path: u.pathname,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(loginBody),
            Origin: base,
          },
        },
        (res) => {
          const set = res.headers["set-cookie"] || [];
          cookie = set.map((c) => c.split(";")[0]).join("; ");
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () =>
            resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() })
          );
        }
      );
      req.on("error", reject);
      req.write(loginBody);
      req.end();
    });
    if (loginRes.status !== 200) {
      console.error("LOGIN_FAILED", loginRes.status, loginRes.body);
    }
  }

  const authH = cookie ? { Cookie: cookie } : {};

  const cases = [
    ["GET /api/health", () => request("GET", "/api/health"), 80],
    ["GET /login.html", () => request("GET", "/login.html"), 40],
    ["GET /api/me (auth)", () => request("GET", "/api/me", authH), 60],
    ["GET /api/stats (auth)", () => request("GET", "/api/stats", authH), 60],
    ["GET /api/users (auth)", () => request("GET", "/api/users", authH), 40],
    ["GET /api/servers (auth)", () => request("GET", "/api/servers", authH), 40],
    ["GET /api/renewal (auth)", () => request("GET", "/api/renewal", authH), 40],
    ["GET /api/tickets (auth)", () => request("GET", "/api/tickets", authH), 40],
    ["POST /api/login bad (rate)", () =>
      request(
        "POST",
        "/api/login",
        { "Content-Type": "application/json", Origin: base },
        JSON.stringify({ username: "x", password: "y" })
      ), 20],
  ];

  console.log("ZEUS_PERF_BENCH");
  console.log("node:", process.version);
  console.log("tmp:", tmpRoot);
  console.log("port:", port);
    console.log("---");

  const results = [];
  for (const [name, fn, rounds] of cases) {
    const r = await runCase(name, fn, rounds);
    results.push(r);
    console.log(
      [
        r.name.padEnd(28),
        "n=" + String(r.n || 0).padStart(3),
        "avg=" + String(r.avg).padStart(7) + "ms",
        "p50=" + String(r.p50).padStart(7),
        "p95=" + String(r.p95).padStart(7),
        "p99=" + String(r.p99).padStart(7),
        "rps=" + String(r.rps).padStart(6),
        "fail=" + r.fail,
      ].join("  ")
    );
  }

  // Concurrent burst on health
  const concurrency = 20;
  const burstN = 100;
  const burstTimes = [];
  let burstFail = 0;
  const burst0 = process.hrtime.bigint();
  let inFlight = 0;
  let done = 0;
  await new Promise((resolve) => {
    function launch() {
      while (inFlight < concurrency && done + inFlight < burstN) {
        inFlight++;
        request("GET", "/api/health")
          .then((r) => {
            burstTimes.push(r.ms);
            if (r.status !== 200) burstFail++;
          })
          .catch(() => {
            burstFail++;
          })
          .finally(() => {
            inFlight--;
            done++;
            if (done >= burstN) resolve();
            else launch();
          });
      }
    }
    launch();
  });
  const burstWall = Number(process.hrtime.bigint() - burst0) / 1e6;
  const bs = stats(burstTimes);
  console.log("---");
  console.log(
    "CONCURRENT /api/health",
    "c=" + concurrency,
    "n=" + burstN,
    "avg=" + (bs && bs.avg) + "ms",
    "p95=" + (bs && bs.p95),
    "rps=" + +((burstN / burstWall) * 1000).toFixed(1),
    "fail=" + burstFail
  );

  // Simple thresholds (soft – report only)
  const health = results.find((r) => r.name.includes("/api/health"));
  const flags = [];
  if (health && health.p95 > 50) flags.push("health p95 > 50ms");
  if (health && health.rps < 50) flags.push("health rps < 50");
  const usersCase = results.find((r) => r.name.includes("/api/users"));
  if (usersCase && usersCase.p95 > 200) flags.push("users p95 > 200ms");

  console.log("---");
  if (flags.length) {
    console.log("FLAGS:", flags.join("; "));
  } else {
    console.log("FLAGS: none (within soft thresholds)");
  }
  console.log("PERF_BENCH_DONE");

  await new Promise((resolve) => server.close(resolve));
  config.rootDir = originalRoot;
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  process.exit(0);
})().catch((err) => {
  console.error(err);
  try {
    config.rootDir = originalRoot;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {}
  process.exit(1);
});
