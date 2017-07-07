import spreadsheet from "../../test/fixtures/spreadsheet";
import {
  default as GoogleSheetsAdapter,
  GoogleSheets,
  TableQuery
} from "../adapters/google-sheets";
import Spreadsheet from "../models/spreadsheet";
import Record from "../models/record";
import * as DataLoader from "dataloader";
import zipObject = require("lodash.zipobject");

const { assign } = Object;
export default class GoogleSheetsConnector {
  private api: GoogleSheetsAdapter;
  private loaders: { [range: string]: DataLoader<string, {}> };

  constructor(adapter: GoogleSheetsAdapter) {
    this.api = adapter;
    this.loaders = {};
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
      spreadsheetId,
      includeGridData: true,
      ranges: sheets.map(sheet => `${sheet}!A1:A`)
    });

    let options = deserializeSpreadsheet(response);

    return new Spreadsheet({ connector: this, ...options });
  }

  async loadRecord(
    spreadsheetId: string,
    type: string,
    id: string
  ): Promise<{ [name: string]: any }> {
    let loader = this.getRecordLoader(spreadsheetId, type);
    return loader.load(id);
  }

  async loadAll(spreadsheetId: string, type: string): Promise<{}[]> {
    let recordLoader = this.getRecordLoader(spreadsheetId, type);
    return this.api
      .query({
        spreadsheetId,
        sheet: type
      })
      .then((response: TableQuery.Response) => {
        let records = deserializeTableQueryResponse(response);
        records.forEach(record => {
          recordLoader.prime(record.id, record);
        });
        return records;
      });
  }

  async createRecord(
    spreadsheetId: string,
    type: string,
    props: { [name: string]: any }
  ): Promise<{ [name: string]: any }> {
    // TODO:
    //  1. fetch headers
    //  2. create batch update
    //  3. send the update
    //  4. return the object

    return {};
  }

  async updateRecord(
    spreadsheetId: string,
    type: string,
    props: { [name: string]: any }
  ): Promise<{ [name: string]: any }> {
    let { id } = props;

    if (!id) {
      throw new Error(`id is required to perform updateRecord`);
    }
    // TODO: implement
    return {};
  }

  async deleteRecord(
    spreadsheetId: string,
    type: string,
    id: string
  ): Promise<void> {
    if (!id) {
      throw new Error(`id is required to delete a record.`);
    }
    // TODO: implement
    return Promise.resolve();
  }

  async loadRecords(
    spreadsheetId: string,
    type: string,
    ids: string[]
  ): Promise<{ [name: string]: any }[]> {
    let loader = this.getRecordLoader(spreadsheetId, type);

    return loader.loadMany(ids);
  }

  getRecordLoader(url, type): DataLoader<string, {}> {
    return this.ensureLoader(type, this.makeRecordLoaderBatchFn(url, type));
  }

  makeRecordLoaderBatchFn(spreadsheetId: string, type: string) {
    return async ids => {
      return this.api
        .query({
          spreadsheetId,
          sheet: type,
          ids
        })
        .then((response: TableQuery.Response) => {
          return deserializeTableQueryResponse(response);
        });
    };
  }

  ensureLoader(
    type: string,
    batchFn: (ids: string[]) => any
  ): DataLoader<string, {}> {
    let loader = this.loaders[type];
    if (loader) {
      return loader;
    } else {
      loader = new DataLoader(batchFn);
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
