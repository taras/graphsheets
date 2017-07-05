import spreadsheet from "../../test/fixtures/spreadsheet";
import {
  default as GoogleSheetsAdapter,
  GoogleSheets,
  TableQuery
} from "../adapters/google-sheets";
import Spreadsheet from "../models/spreadsheet";
import Record from "../models/record";
import DataLoader from "../adapters/dataloader";
import zipObject from "lodash.zipObject";

const { assign } = Object;
export default class GoogleSheetsConnector {
  private api: GoogleSheetsAdapter;
  private loaders: { [range: string]: DataLoader };

  constructor(adapter: GoogleSheetsAdapter) {
    this.api = adapter;
  }

  async create(resource): Promise<Spreadsheet> {
    let response = await this.api.create(resource);

    let options = deserializeSpreadsheet(response);

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
      spreadsheetId
      // includeGridData: true,
      // ranges: sheets.map(sheet => `${sheet}!A1:A`)
    });

    let options = deserializeSpreadsheet(response);

    return new Spreadsheet({ connector: this, ...options });
  }

  async loadRecord(
    url: string,
    type: string,
    id: string
  ): Promise<{ [name: string]: any }> {
    let loader = this.ensureLoader(type, async ids => {
      return this.api.query({
        url,
        sheet: type,
        ids
      });
    });

    return loader.load(id).then((response: TableQuery.Response) => {
      let [data] = deserializeTableQueryResponse(response);
      return data;
    });
  }

  async loadRecords(
    url: string,
    type: string
  ): Promise<{ [name: string]: any }[]> {
    let loader = this.ensureLoader("sheet", async () => {
      return this.api.query({
        url,
        sheet: type
      });
    });

    return loader
      .load(type)
      .then((response: TableQuery.Response) =>
        deserializeTableQueryResponse(response)
      );
  }

  ensureLoader(type: string, batch: (ids: string[]) => any): DataLoader {
    let loader = this.loaders[type];
    if (loader) {
      return loader;
    } else {
      loader = new DataLoader(batch);
      this.loaders[type] = loader;
    }
    return loader;
  }
}

export function deserializeTableQueryResponse(payload: TableQuery.Response) {
  let { table: { cols, rows } } = payload;

  let headers = cols.map(({ label }) => label);
  return rows.map(({ c }) => {
    let values = c.map(({ v }) => v);
    return zipObject(headers, values);
  });
}

export function deserializeSpreadsheet(payload: GoogleSheets.Spreadsheet) {
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

export function deserializeSheet(sheet: GoogleSheets.Sheet) {
  let {
    properties: {
      sheetId: id,
      title,
      index,
      hidden,
      gridProperties: { columnCount, rowCount }
    },
    data
  } = sheet;

  return assign(
    {
      id,
      title,
      index,
      columnCount,
      rowCount
    },
    data && { headers: extractHeaders(data) }
  );
}

export function extractHeaders(data: GoogleSheets.GridData[]) {
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

export function deserializeNamedRange(data: GoogleSheets.NamedRange) {
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
