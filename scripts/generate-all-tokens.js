const { loadUsers, saveUsers } = require("../src/store/users");
const crypto = require("crypto");

const users = loadUsers();
let count = 0;

users.forEach(function (u) {
  if (!u.subToken) {
    u.subToken = crypto.randomBytes(12).toString("hex");
    count++;
  }
  console.log(u.username + ": " + u.subToken);
});

if (count > 0) {
  saveUsers(users);
  console.log("\n✅ توکن برای " + count + " کاربر جدید ساخته شد");
} else {
  console.log("\n✅ همه کاربران قبلاً توکن داشتند");
}

console.log("\n لینک‌های سابسکریپشن:");
users.forEach(function (u) {
  console.log("http://127.0.0.1:3000/api/sub/b64/" + encodeURIComponent(u.username) + "?token=" + u.subToken);
});
