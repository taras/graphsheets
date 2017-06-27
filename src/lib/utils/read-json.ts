import fs = require("fs-extra");

export default function readJSONSync(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
