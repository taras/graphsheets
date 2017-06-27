import authorize from "./commands/authorize";
import newCommand from "./commands/new";
import readFileSync from "./lib/utils/read-json";

import path = require("path");
import findUp = require("find-up");
import fs = require("fs");

let configPath = findUp.sync(["sheets.json"]);
let config = configPath ? readFileSync(configPath) : {};

require("yargs")
  .config(config)
  .command(authorize)
  .command(newCommand)
  .option("token-path", {
    describe: "path where your token will be saved",
    default: path.join(
      process.env.HOME,
      ".credentials",
      "sheets.googleapis.com-sheetsql.json"
    ),
    alias: "t"
  })
  .option("client-secret-path", {
    describe: "path where client_secret.json is located",
    default: path.join(process.cwd(), "client_secret.json"),
    alias: "c"
  })
  .option("verbose", {
    alias: "v",
    default: false
  })
  .help().argv;
