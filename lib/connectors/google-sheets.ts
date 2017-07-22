///<reference path="../../node_modules/dataloader/index.d.ts"/>
import {
  default as GoogleSheetsAdapter,
  GoogleSheets,
  TableQuery
} from "../adapters/google-sheets";
import Sheet from "../models/sheet";
import Spreadsheet from "../models/spreadsheet";
import * as DataLoader from "dataloader";
import * as zipObject from "lodash.zipobject";

const { assign } = Object;

const RELATIONSHIP_SHEET = "RELATIONSHIPS";
const relationshipFields = ["A", "B", "C", "D", "E", "F"];
export default class GoogleSheetsConnector {
  private api: GoogleSheetsAdapter;
  private loaders: { [range: string]: DataLoader<any, {}> };

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
      ranges: sheets
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

  async loadAll(spreadsheetId: string, sheet: string): Promise<{}[]> {
    let recordLoader = this.getRecordLoader(spreadsheetId, sheet);
    let response: TableQuery.Response = await this.api.query({
      spreadsheetId,
      sheet
    });

    let records = deserializeTableQueryResponse(response);
    records.forEach(record => {
      recordLoader.prime(record.id, record);
    });

    return records;
  }

  async createRecord(
    spreadsheetId: string,
    sheet: Sheet,
    params: { [name: string]: string | number | null }
  ): Promise<{ [name: string]: any }> {
    let fieldNames = sheet.headers.map(({ title }) => title);

    let values = fieldNames.map(fieldName => {
      if (params.hasOwnProperty(fieldName)) {
        return params[fieldName];
      } else {
        return null;
      }
    });

    let response = await this.api.append({
      spreadsheetId,
      range: sheet.title,
      includeValuesInResponse: true,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      responseValueRenderOption: "FORMATTED_VALUE",
      resource: {
        majorDimension: GoogleSheets.Dimension.ROWS,
        values: [values],
        range: sheet.title
      }
    });

    let { updates: { updatedData: { values: responseValues } } } = response;

    let [writtenValues] = responseValues;

    return zipObject(fieldNames, writtenValues);
  }

  createRelationship(spreadsheetId: string, relationship: Relationship) {
    let loader = this.ensureLoader(
      "RELATIONSHIPS::write",
      async (records: Array<Relationship>) => {
        let response = await this.api.append({
          spreadsheetId,
          range: RELATIONSHIP_SHEET,
          includeValuesInResponse: true,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          responseValueRenderOption: "FORMATTED_VALUE",
          resource: {
            majorDimension: GoogleSheets.Dimension.ROWS,
            values: records,
            range: RELATIONSHIP_SHEET
          }
        });
        let { updates: { updatedData: { values: responseValues } } } = response;

        return responseValues.map(writtenValues =>
          zipObject(relationshipFields, writtenValues)
        );
      }
    );
    return loader.load(["=row()", ...relationship]);
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

  getRecordLoader(url, type): DataLoader<any, {}> {
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
        .then((response: TableQuery.Response) =>
          deserializeTableQueryResponse(response)
        );
    };
  }

  ensureLoader(
    type: string,
    batchFn: (ids: any[]) => any
  ): DataLoader<any, {}> {
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

type Relationship = [string, string, string, string];

export function deserializeTableQueryResponse(payload: TableQuery.Response) {
  let { table: { cols, rows } } = payload;

  let headers = cols.map(({ label }) => label);
  return rows.map(({ c }) => {
    let values = c.map(parseValue);
    return zipObject(headers, values);
  });
}

export function parseValue(value) {
  if (value === null) {
    return value;
  } else {
    let { v } = value;
    if (v === "#N/A") {
      return null;
    } else {
      return v;
    }
  }
}

export function deserializeSpreadsheet(payload: GoogleSheets.Spreadsheet) {
  let {
    spreadsheetId: id,
    spreadsheetUrl: url,
    sheets,
    properties: { title }
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
  return !["WELCOME", RELATIONSHIP_SHEET].includes(title);
}
