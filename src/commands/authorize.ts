import fs = require('fs-extra');
import path = require('path');

import { CLIOptions } from '../cli';
import GoogleAuthorizer from '../adapters/google-auth';
import { ask } from '../adapters/prompt';
import Logger from '../adapters/logger';

export interface AuthorizeOptions extends CLIOptions {
  readOnly: string
  tokenPath: string
  clientSecretPath: string
}

export default async function(options: AuthorizeOptions) {
  let { 
    tokenPath,
    clientSecretPath,
    readOnly
  } = options;

  let credentials;
  try {
    credentials = JSON.parse(await fs.readFile(clientSecretPath, "utf8"));
  } catch (e) {
    console.error(`Could not read client_secret.json at ${clientSecretPath}`);
    throw e;
  }

  let authorizer = new GoogleAuthorizer(credentials);

  let token;
  try {
    token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
  } catch (e) {
    console.error(`Count not read token file at ${tokenPath}`);
  }

  if (!token) {
    let scope = getScope(readOnly);
    let authUrl = authorizer.generateAuthUrl(scope);

    console.info(`Authorize this app by visiting this url: ${authUrl}`);
    let code = await ask('Enter the code from that page here: ');

    try {
      token = await authorizer.getToken(code);
    } catch (e) {
      console.error(`Count not fetch token with code: ${code}`);
      throw e;
    }

    try {
      storeToken(tokenPath, token);
      console.info(`Retrieved a token and stored it in ${tokenPath}`);
    } catch (e) {
      console.error(`Could not write token to ${tokenPath}`);
      throw e;
    }
  }

  console.info('👍  authorize command was successful.');
}

function getScope(readOnly): [string] {
  let base = 'https://www.googleapis.com/auth/spreadsheets';
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
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFileSync(tokenPath, JSON.stringify(token));
}