import GoogleSheetsAdapter from "../adapters/google-sheets";
import { GoogleSheetsAPI4 as API } from "../adapters/google-sheets";
import { IFetchHeadersResult } from "../Interfaces";

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
  async fetchSheets(spreadsheetId: string): Promise<API.SheetProperties[]> {
    let { sheets } = await this.api.get({
      spreadsheetId
    });

    return map(sheets, "properties");
  }

  /**
   * Return a hash with sheet name as key and array of header titles as value.
   * @param spreadsheetId string
   * @param sheets string[]
   * @return 
   */
  async fetchHeaders(
    spreadsheetId: string,
    sheets: string[]
  ): Promise<IFetchHeadersResult> {
    let { valueRanges } = await this.api.batchGet({
      spreadsheetId,
      sheets: sheets.map(sheet => `${sheet}!A1:ZZ1`).join(",")
    });

    return valueRanges.reduce((result, item: API.ValueRange) => {
      let [values] = item.values;
      let [name] = item.range.match(/[A-Z]*/i);
      result[name] = values;
      return result;
    }, {});
  }

  private extractHeaders(payload) {}
}
