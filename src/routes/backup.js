const express = require("express");
const router = express.Router();

const { loadSettings } = require("../store/settings");
const { loadUsers } = require("../store/users");
const { loadServers } = require("../store/servers");
const { requireAdmin } = require("../middleware/auth");

router.get("/", requireAdmin, (req, res) => {
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    users: loadUsers().map(({ passwordHash, ...safe }) => safe),
    servers: loadServers().map(({ agentTokenHash, agentTokenCreatedAt, ...safe }) => safe),
  };
  res.setHeader("Content-Disposition", `attachment; filename="zeus-backup-${Date.now()}.json"`);
  res.json(payload);
});

module.exports = router;
