import Logger from './logger';
import googleAuth = require('google-auth-library');

export default class GoogleAuthorizer {

  private client;

  constructor(credentials) {
    let {
      installed: {
        client_secret: clientSecret,
        client_id: clientId,
        redirect_uris: [ redirectUrl ]
      }
    } = credentials;

    let auth = new googleAuth();
    this.client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  }

  generateAuthUrl(scope): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope
    });
  }

  async getToken(code) {
    let promise = new Promise((resolve, reject) => {
      this.client.getToken(code, (err, tokens) => {
        if (err) {
          reject(err);
        } else {
          resolve(tokens);
        }
      })
    });
    return await promise;
  }
}