const { execFile } = require("child_process");

function sendSms(phone, message, cb) {
  execFile("termux-sms-send", ["-n", phone, message], function (err) {
    if (cb) cb(err);
    else if (err) console.error("SMS FAIL:", phone, err.message);
  });
}

function welcomeMessage(user, baseUrl) {
  return "به پنل زئوس خوش آمدید! 🎉\nنام کاربری: " + user.username +
    "\nتاریخ انقضا: " + (user.expiry || "-") +
    "\nلینک اشتراک: " + baseUrl + "/sub/" + encodeURIComponent(user.username);
}

module.exports = { sendSms, welcomeMessage };
