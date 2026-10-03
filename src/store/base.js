const fs = require("fs");
const path = require("path");

let writeQueue = Promise.resolve();

function atomicWrite(file, data) {
  writeQueue = writeQueue.then(
    () =>
      new Promise((resolve, reject) => {
        const tmp = file + ".tmp";
        fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8", (err) => {
          if (err) return reject(err);
          fs.rename(tmp, file, (err2) => (err2 ? reject(err2) : resolve()));
        });
      })
  );
  return writeQueue;
}

function loadJSON(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

module.exports = { atomicWrite, loadJSON };
