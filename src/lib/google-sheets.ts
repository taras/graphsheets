import google = require("googleapis");
import GoogleAuthorizer from "./google-auth";

const sheets = google.sheets("v4");

export default class GoogleSheets {
  private authorizer: GoogleAuthorizer;

  private get client() {
    return this.authorizer.getClient();
  }

  constructor(authorizer: GoogleAuthorizer) {
    this.authorizer = authorizer;
  }

  async create(resource) {
    let request = {
      resource,
      auth: this.client
    };

    return new Promise((resolve, reject) => {
      sheets.spreadsheets.create(request, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}
