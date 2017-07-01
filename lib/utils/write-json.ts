const path = require("path");
const fs = require("fs");

export default function writeJSON(destination: string, data: {}) {
  try {
    fs.mkdirSync(path.dirname(destination));
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFileSync(destination, JSON.stringify(data, null, 2));
}
