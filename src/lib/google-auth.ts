import googleAuth = require("google-auth-library");
import readJSONSync from "./utils/read-json";
export default class GoogleAuthorizer {
  private client;

  public isAuthorized: boolean;

  static restore(clientSecretPath, tokenPath) {
    let clientSecret;
    try {
      clientSecret = readJSONSync(clientSecretPath);
    } catch (e) {
      console.error(`Could not read client_secret.json at ${clientSecretPath}`);
      throw e;
    }

    let {
      installed: { client_secret, client_id, redirect_uris: [redirectUrl] }
    } = clientSecret;

    let auth = new googleAuth();
    let client = new auth.OAuth2(client_id, client_secret, redirectUrl);

    let token;
    try {
      token = readJSONSync(tokenPath);
    } catch (e) {
      console.error(`Count not read token file at ${tokenPath}`);
    }

    if (token) {
      client.credentials = token;
    }

    return new GoogleAuthorizer(client);
  }

  constructor(client) {
    this.client = client;
    this.isAuthorized = !!client.credentials;
  }

  async authorize(code) {
    let credentials;
    try {
      credentials = await this.getToken(code);
    } catch (e) {
      console.error(`Count not fetch token with code: ${code}`);
      throw e;
    }

    this.isAuthorized = true;
    this.client.credentials = credentials;

    return credentials;
  }

  generateAuthUrl(isReadOnly: boolean): string {
    let scope = this.getScope(isReadOnly);

    return this.client.generateAuthUrl({
      access_type: "offline",
      scope
    });
  }

  async getToken(code) {
    return new Promise((resolve, reject) => {
      this.client.getToken(code, (err, tokens) => {
        if (err) {
          reject(err);
        } else {
          resolve(tokens);
        }
      });
    });
  }

  getScope(isReadOnly): [string] {
    let base = "https://www.googleapis.com/auth/spreadsheets";
    if (isReadOnly) {
      return [`${base}.readonly`];
    } else {
      return [base];
    }
  }

  getClient() {
    return this.client;
  }
}
