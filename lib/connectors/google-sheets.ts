import GoogleSheetsAdapter from "../adapters/google-sheets";
import SpreadsheetModel from "../models/spreadsheet";
import map from "lodash.map";

export default class GoogleSheetsConnector {
  private api: GoogleSheetsAdapter;

  constructor(adapter: GoogleSheetsAdapter) {
    this.api = adapter;
  }

  async create(resource) {
    let { spreadsheetId: id, spreadsheetUrl: url } = await this.api.create(
      resource
    );

    return new SpreadsheetModel({ connector: this, id, url });
  }

  /**
   * 
   * @param spreadsheetId string
   */
  async fetchSheets(spreadsheetId) {
    return this.api.get({
      spreadsheetId
    });
  }

  /**
   * 
   * @param spreadsheetId 
   * @param sheets 
   */
  async fetchHeaders(spreadsheetId, sheets) {
    let { valueRanges: ranges } = await this.api.batchGet({
      spreadsheetId,
      sheets: sheets.map(sheet => `${sheet}!A1:ZZ1`).join(",")
    });

    return ranges.reduce((result, { range, values }) => {
      // values are wrapped in an array for some reason, so we unwrap it
      [values] = values;
      let [name] = range.match(/[A-Z]*/i);
      result[name] = values;
      return result;
    }, {});
  }

  private extractHeaders(payload) {}
}
