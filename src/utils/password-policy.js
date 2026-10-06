const bcrypt = require("bcryptjs");

const MIN_PASSWORD_CHARS = 12;
const MAX_PASSWORD_BYTES = 72;
const BCRYPT_ROUNDS = 12;

function isValidPassword(value) {
  return (
    typeof value === "string" &&
    value.length >= MIN_PASSWORD_CHARS &&
    !bcrypt.truncates(value)
  );
}

function passwordError() {
  return `رمز عبور باید حداقل ${MIN_PASSWORD_CHARS} کاراکتر و حداکثر ${MAX_PASSWORD_BYTES} بایت UTF-8 باشد`;
}

module.exports = {
  MIN_PASSWORD_CHARS,
  MAX_PASSWORD_BYTES,
  BCRYPT_ROUNDS,
  isValidPassword,
  passwordError,
};