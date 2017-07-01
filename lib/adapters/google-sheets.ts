import google = require("googleapis");
import promisify = require("util.promisify");

import { IAuthorizer } from "../Interfaces";

export default class GoogleSheetsAdapter {
  private authorizer: IAuthorizer;
  private sheets;

  constructor(authorizer: IAuthorizer) {
    this.authorizer = authorizer;
    this.sheets = google.sheets("v4");
  }

  private authorized(operation) {
    return payload => {
      let request = this.authorizer.authorizeRequest(payload);

      return promisify(operation)(request);
    };
  }

  async get(payload) {
    return this.authorized(this.sheets.get)(payload);
  }

  async batchGet(payload) {
    return this.authorized(this.sheets.batchGet)(payload);
  }

  async create(payload) {
    return this.authorized(this.sheets.create)(payload);
  }
}
