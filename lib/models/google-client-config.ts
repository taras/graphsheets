import readJSONSync from "../utils/read-json";

export default class GoogleClientConfig {
  public readonly clientSecret: String;

  public readonly clientId: String;

  public readonly redirectURLS: String[];

  // The members are intentionally named in snake_case since the API expects it to be so
  public readonly credentials: {
    access_token: String;
    refresh_token: String;
    token_type: String;
  };

  static initFromFiles(clientSecretFilePath: String, tokenPath: String) {
    let config;
    try {
      config = readJSONSync(clientSecretFilePath);
    } catch (err) {
      console.error(
        `Couldn't read the client_secret.json at ${clientSecretFilePath}`
      );
      throw err;
    }

    let token;
    try {
      token = readJSONSync(tokenPath);
    } catch (e) {
      console.error(`Could not read token file at ${tokenPath}`);
    }

    return new GoogleClientConfig(config, token);
  }

  constructor(config: any, token: any) {
    let {
      installed: { client_secret, client_id, redirect_uris: [redirectUrl] }
    } = config;

    this.clientId = client_id;
    this.clientSecret = client_secret;
    this.redirectURLS = redirectUrl;

    if (token) {
      const { access_token, token_type, refresh_token } = token;
      this.credentials = {
        access_token,
        token_type,
        refresh_token
      };
    }
  }
}
