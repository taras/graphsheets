import fs = require("fs-extra");
import path = require("path");

import GoogleAuthorizer from "../lib/google-auth";
import { ask } from "../adapters/prompt";
import asyncCommand from "../lib/async-command";

export default asyncCommand({
  command: "authorize",
  desc: "fetch a token to access Google services",
  builder: {
    "read-only": {
      describe: "gain read only access to Google Sheets",
      default: false,
      alias: "r"
    },
    "token-path": {
      describe: "path where your token will be saved",
      default: path.join(
        process.env.HOME,
        ".credentials",
        "sheets.googleapis.com-sheetsql.json"
      ),
      alias: "t"
    },
    "client-secret-path": {
      describe: "path where client_secret.json is located",
      default: path.join(process.cwd(), "client_secret.json"),
      alias: "c"
    }
  },
  async handler(argv) {
    let { readOnly, tokenPath, clientSecretPath, verbose } = argv;

    let credentials;
    try {
      credentials = await readJSON(clientSecretPath);
    } catch (e) {
      console.error(`Could not read client_secret.json at ${clientSecretPath}`);
      throw e;
    }

    let authorizer = new GoogleAuthorizer(credentials);

    let token;
    try {
      token = await readJSON(tokenPath);
    } catch (e) {
      console.error(`Count not read token file at ${tokenPath}`);
    }

    if (token) {
      console.info(`Retrieved a token and stored it in ${tokenPath}`);
    } else {
      let scope = getScope(readOnly);
      let authUrl = authorizer.generateAuthUrl(scope);

      console.info(`Authorize this app going to: ${authUrl}`);
      let code = await ask("Enter the code from that page here: ");

      try {
        token = await authorizer.getToken(code);
      } catch (e) {
        console.error(`Count not fetch token with code: ${code}`);
        throw e;
      }

      try {
        storeToken(tokenPath, token);
        console.info(`Saved token to ${tokenPath}`);
      } catch (e) {
        console.error(`Could not write token to ${tokenPath}`);
        throw e;
      }
    }

    console.info("👍  authorize command was successful.");
  }
});

function getScope(readOnly): [string] {
  let base = "https://www.googleapis.com/auth/spreadsheets";
  if (readOnly) {
    return [`${base}.readonly`];
  } else {
    return [base];
  }
}

function storeToken(tokenPath: string, token: {}) {
  try {
    fs.mkdirSync(path.dirname(tokenPath));
  } catch (err) {
    if (err.code != "EEXIST") {
      throw err;
    }
  }
  fs.writeFileSync(tokenPath, JSON.stringify(token));
}

async function readJSON(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}