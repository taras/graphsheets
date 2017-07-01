import googleAuth = require("google-auth-library");
import readJSONSync from "./utils/read-json";
import { IAuthorizer } from "./Interfaces";

const { assign } = Object;
export default class GoogleAuthorizer implements IAuthorizer {
  private client;

  public isAuthorized: boolean;

  /**
   * Instantiate an authorizer from client_secret.json and token json
   * @param clientSecretPath string
   * @param tokenPath string
   */
  static restore(clientSecretPath, tokenPath): GoogleAuthorizer {
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

  /**
   * Retrieve credentials for given code and make this service authorized.
   * @param code string
   */
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

  /**
   * Return a url for user to retrieve a token
   * @param isReadOnly string
   */
  generateAuthUrl(isReadOnly: boolean): string {
    let scope = this.getScope(isReadOnly);

    return this.client.generateAuthUrl({
      access_type: "offline",
      scope
    });
  }

  /**
   * Fetch credentials for code
   * @param code string
   */
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

  /**
   * Return array with scope required for the document
   * @param isReadOnly boolean
   * @return string[]
   */
  getScope(isReadOnly): [string] {
    let base = "https://www.googleapis.com/auth/spreadsheets";
    if (isReadOnly) {
      return [`${base}.readonly`];
    } else {
      return [base];
    }
  }

  /**
   * Merge auth client into the request
   * @param payload {}
   */
  authorizeRequest(payload = {}) {
    return assign(
      {
        auth: this.client
      },
      payload
    );
  }
}
