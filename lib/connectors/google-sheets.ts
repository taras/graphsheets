import GoogleSheetsAdapter from "../adapters/google-sheets";
import { GoogleSheetsAPI4 as API } from "../adapters/google-sheets";

import Spreadsheet from "../models/spreadsheet";

export default class GoogleSheetsConnector {
  private api: GoogleSheetsAdapter;

  constructor(adapter: GoogleSheetsAdapter) {
    this.api = adapter;
  }

  async create(resource): Promise<Spreadsheet> {
    let response = await this.api.create(resource);

    let options = deserialize(response);

    return new Spreadsheet({ connector: this, ...options });
  }

  /**
   * Fetch a spreadsheet with specific sheets. 
   * 
   * Sheets are used to generate ranges to extract specific data from the API. 
   * Sheets names should be known from GraphQL schema.
   * @param spreadsheetId string
   */
  async load(spreadsheetId: string, sheets: string[]): Promise<Spreadsheet> {
    let response = await this.api.get({
      spreadsheetId,
      includeGridData: true,
      ranges: sheets.map(sheet => `${sheet}!A1:ZZ1`).join(",")
    });

    let options = deserialize(response);

    return new Spreadsheet({ connector: this, ...options });
  }
}

export function deserialize(payload: API.Spreadsheet) {
  let {
    spreadsheetId: id,
    spreadsheetUrl: url,
    sheets,
    properties: { title },
    namedRanges
  } = payload;

  return {
    id,
    url,
    title,
    sheets: sheets.map(deserializeSheet).filter(onlyModels)
  };
}

export function deserializeSheet(sheet: API.Sheet) {
  let { properties: { sheetId: id, title, index, hidden }, data } = sheet;

  return {
    id,
    title,
    index,
    headers: extractHeaders(data)
  };
}

export function extractHeaders(data: API.GridData[]) {
  let [row] = data;
  let { rowData } = row;
  let [header] = rowData;
  let { values } = header;
  return values.map(header => {
    let { formattedValue: title, note } = header;

    return {
      title,
      note
    };
  });
}

export function deserializeNamedRange(data: API.NamedRange) {
  let { namedRangeId: id, name, range } = data;

  return {
    id,
    name,
    range
  };
}

export function onlyModels({ title }) {
  return !["WELCOME", "RELATIONSHIPS"].includes(title);
}
