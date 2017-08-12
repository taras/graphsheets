import * as yargs from "yargs";
import authorize from "./commands/authorize";
import newCommand from "./commands/new";
import serverCommand from "./commands/server";
import readFileSync from "./utils/read-json";

import path = require("path");
import findUp = require("find-up");
import fs = require("fs");

let configPath = findUp.sync(["spreadsheet.json"]);
let config = configPath ? readFileSync(configPath) : {};

require("yargs")
  .config(config)
  .command(authorize)
  .command(newCommand)
  .command(serverCommand)
  .option("token-path", {
    describe: "path where your token will be saved",
    default: path.join(
      process.env.HOME,
      ".credentials",
      "sheets.googleapis.com-sheetsql.json"
    ),
    alias: "t"
  })
  .option("schema-path", {
    describe: "path to the schema.graphql file",
    default: path.join(process.cwd(), "schema.graphql")
  })
  .option("id", {
    describe: "id of the database spreadsheet"
  })
  .option("url", {
    describe: "url of the database spreadsheet"
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
  .command({
    command: "*",
    handler() {
      yargs.showHelp();
    }
  })
  .help().argv;
