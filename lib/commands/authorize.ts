import fs = require("fs-extra");
import path = require("path");

import GoogleAuthorizer from "../google-auth";
import { ask } from "../utils/prompt";
import asyncCommand from "../utils/async-command";
import writeJSONSync from "../utils/write-json";

export default asyncCommand({
  command: "authorize",
  desc: "fetch a token to access Google services",
  builder: {
    "read-only": {
      describe: "gain read only access to Google Sheets",
      default: false,
      alias: "r"
    }
  },
  async handler(argv) {
    let { readOnly, tokenPath, clientSecretPath } = argv;

    let authorizer = GoogleAuthorizer.restore(clientSecretPath, tokenPath);

    if (authorizer.isAuthorized) {
      console.info(`Retrieved a token from ${tokenPath}`);
    } else {
      let authUrl = authorizer.generateAuthUrl(readOnly);

      console.info(`Authorize this app going to: ${authUrl}`);

      let code = await ask("Enter the code from that page here: ");

      let credentials = authorizer.authorize(code);

      try {
        writeJSONSync(tokenPath, credentials);
        console.info(`Saved token to ${tokenPath}`);
      } catch (e) {
        console.error(`Could not write token to ${tokenPath}`);
        throw e;
      }
    }

    console.info("👍  authorize command was successful.");
  }
});
