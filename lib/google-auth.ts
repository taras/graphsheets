import GoogleClientConfig from "./models/google-client-config";
import googleAuth = require("google-auth-library");
import { Authorizer } from "./Interfaces";

const { assign } = Object;
export default class GoogleAuthorizer implements Authorizer {
  private client;

  public isAuthorized: boolean;

  /**
   * Instantiate an authorizer from a googleClientConfig
   * 
   * @static
   * @param {GoogleClientConfig} googleClientConfig 
   * @returns {GoogleAuthorizer} 
   * @memberof GoogleAuthorizer
   */
  static restore(googleClientConfig: GoogleClientConfig): GoogleAuthorizer {
    const auth = new googleAuth();
    let client = new auth.OAuth2(
      googleClientConfig.clientId,
      googleClientConfig.clientSecret,
      googleClientConfig.redirectURLS
    );

    if (googleClientConfig.credentials) {
      client.credentials = googleClientConfig.credentials;
    }

    return new GoogleAuthorizer(client);
  }

  constructor(client) {
    this.client = client;
    this.isAuthorized = !!client.credentials["access_token"];
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
      console.error(`Could not fetch token with code: ${code}`);
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
      {
        resource: {
          ...payload
        }
      }
    );
  }

  getAuthorizationHeader() {
    const { token_type, access_token } = this.client.credentials;
    return `${token_type} ${access_token}`;
  }
}
