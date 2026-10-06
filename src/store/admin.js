const bcrypt = require("bcryptjs");
const { atomicWrite, loadJSON } = require("./base");
const config = require("../config");
const { isValidPassword, passwordError, BCRYPT_ROUNDS } = require("../utils/password-policy");

const loadAdmin = () => loadJSON(config.adminFile, null);

async function ensureAdmin() {
  if (loadAdmin()) return;
  const initialPassword = config.adminInitialPassword;
  if (!initialPassword) {
    throw new Error("ADMIN_INITIAL_PASSWORD تنظیم نشده است");
  }
  if (!isValidPassword(initialPassword)) throw new Error(passwordError());
  const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_ROUNDS);
  await atomicWrite(config.adminFile, { username: "admin", passwordHash });
  console.log("Default admin created. Please change the initial password immediately.");
}

module.exports = { loadAdmin, ensureAdmin };
