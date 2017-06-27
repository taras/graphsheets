import Logger from './adapters/logger';
import authorize from './commands/authorize';
import path = require('path');

const {
  assign
} = Object;

require('yargs')
  .command(authorize)
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
  .option('verbose', {
    alias: 'v',
    default: false
  })
  .help()
  .argv;