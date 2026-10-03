const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const root = path.join(__dirname, "..");
const bDir = path.join(root, "backups");
const dl = path.join(os.homedir(), "storage", "downloads", "ZeusPanelBackups");
const dlReal = "/storage/emulated/0/Download/ZeusPanelBackups";

try {
  fs.mkdirSync(dl, { recursive: true });
  const files = fs.readdirSync(bDir).filter(function (f) {
    return f.endsWith(".tar.gz") || f.endsWith(".sha256");
  });
  let n = 0;
  files.forEach(function (f) {
    fs.copyFileSync(path.join(bDir, f), path.join(dl, f));
    n++;
    execFile("am", ["broadcast", "-a", "android.intent.action.MEDIA_SCANNER_SCAN_FILE", "-d", "file://" + dlReal + "/" + f], function () {});
  });
  console.log("✅ " + n + " فایل بکاپ در Downloads کپی و ایندکس شد");
} catch (e) {
  console.error("❌ خطا در کپی:", e.message);
}
