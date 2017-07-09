import google = require("googleapis");
import promisify = require("util.promisify");
import request = require("request-promise-native");

const { spreadsheets } = google.sheets("v4");

import spreadsheet from "../../test/fixtures/spreadsheet";
import { IAuthorizer } from "../Interfaces";

const { assign } = Object;
export default class GoogleSheetsAdapter {
  private authorizer: IAuthorizer;
  private sheets;

  constructor(authorizer: IAuthorizer) {
    this.authorizer = authorizer;
    this.sheets = spreadsheets;
  }

  private authorized(operation) {
    return payload => {
      let request = this.authorizer.authorizeRequest(payload);

      return promisify(operation)(request);
    };
  }

  /**
   * Fetch spreadsheet from Google Sheets API
   * 
   * @param options {}
   * @param options.spreadsheetId string
   * @param options.includeGridData boolean
   * @param options.ranges string
   */
  async get(options): Promise<GoogleSheets.Spreadsheet> {
    return this.authorized(this.sheets.get)(options);
  }

  async batchGet(payload): Promise<GoogleSheets.BatchGetResponse> {
    return this.authorized(this.sheets.batchGet)(payload);
  }

  async create(payload) {
    return this.authorized(this.sheets.create)(payload);
  }

  async append(payload: AppendRequest): Promise<GoogleSheets.AppendResponse> {
    return this.authorized(this.sheets.values.append)(payload);
  }

  async query(options: IQueryParams): Promise<TableQuery.Response> {
    let { spreadsheetId, sheet, ids, tqx } = options;

    let headers = {
      Authorization: this.authorizer.getAuthorizationHeader(),
      "X-DataSource-Auth": ""
    };

    let qs = assign(
      {
        headers: 1,
        sheet
      },
      ids && { tq: buildSQLQuery(ids) },
      tqx && { tqx: tqx instanceof Array ? tqx.join(";") : tqx }
    );

    return request
      .get({
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq`,
        headers,
        qs
      })
      .then(payload => JSON.parse(stripBadResponse(payload)));
  }
}

/**
 * 
 * @see https://github.com/google/google-visualization-issues/issues/1928
 * @param str 
 */
export function stripBadResponse(str: string): string {
  return str.replace(/^\)]}'\n/g, "");
}

export function buildSQLQuery(ids: string[]) {
  let where = ids.map(id => `B='${id}'`).join(" OR ");
  return `SELECT * WHERE ${where}`;
}

export interface IQueryParams {
  spreadsheetId: string;
  sheet: string;
  ids?: string[];
  tqx?: string[] | string;
}

export interface AppendRequest {
  spreadsheetId: string;
  range: string;
  includeValuesInResponse: boolean;
  insertDataOption: GoogleSheets.InsertDataOption;
  resource: GoogleSheets.ValueRange;
  valueInputOption: GoogleSheets.ValueInputOption;
}

export namespace TableQuery {
  export interface Response {
    version: string;
    reqId: string;
    status: string;
    sig: string;
    table: Table;
  }
  export interface Table {
    cols: Column[];
    rows: Row[];
  }

  export interface Column {
    id: string;
    label: string;
    type: ColumnType;
  }

  export interface Row {
    c: Cell[];
  }

  export interface Cell {
    v: string | number;
    f?: string;
  }

  enum ColumnType {
    string,
    number
  }
}

export namespace GoogleSheets {
  export interface Spreadsheet {
    spreadsheetId: string;
    properties: SpreadsheetProperties;
    sheets: Sheet[];
    namedRanges: NamedRange[];
    spreadsheetUrl: string;
  }

  export interface BatchGetResponse {
    spreadsheetId: string;
    valueRanges: ValueRange[];
  }

  export interface ValueRange {
    range: string;
    majorDimension: Dimension;
    values: Value[][];
  }

  export enum Dimension {
    DIMENSION_UNSPECIFIED, //The default value, do not use.
    ROWS, // Operates on the rows of a sheet.
    COLUMNS // Operates on the columns of a sheet.
  }
  export interface NamedRange {
    namedRangeId: string;
    name: string;
    range: GridRange;
  }
  export interface Sheet {
    properties: SheetProperties;
    data: GridData[];
    merges: GridRange[];
  }

  export interface GridRange {
    sheetId: number;
    startRowIndex: number;
    endRowIndex: number;
    startColumnIndex: number;
    endColumnIndex: number;
  }

  export interface SpreadsheetProperties {
    title: string;
    locale: string;
    autoRecalc: string;
    timeZone: string;
  }

  export interface SheetProperties {
    sheetId: number;
    title: string;
    index: number;
    sheetType: SheetType;
    gridProperties: GridProperties;
    hidden: boolean;
  }

  export interface GridProperties {
    rowCount: number;
    columnCount: number;
    frozenRowCount: number;
    frozenColumnCount: number;
    hideGridlines: boolean;
  }

  export enum SheetType {
    SHEET_TYPE_UNSPECIFIED, //Default value, do not use.
    GRID, //The sheet is a grid.
    OBJECT //The sheet has no grid and instead has an object like a chart or image.
  }

  export interface GridData {
    rowData: RowData[];
    startRow?: number;
    startColumn?: number;
  }
  export interface RowData {
    values: CellData[];
  }

  /**
   * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#CellData
   */
  export interface CellData {
    userEnteredValue: ExtendedValue;
    effectiveValue: ExtendedValue;
    formattedValue: string;
    hyperlink?: string;
    note?: string;
    dataValidation?: DataValidationRule;
    // TODO: pivotTable: PivotTable;
  }

  /**
   * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#DataValidationRule
   */
  export interface DataValidationRule {
    condition: BooleanCondition;
    inputMessage: string;
    strict: boolean;
    showCustomUi: boolean;
  }

  /**
   * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#BooleanCondition
   */
  export interface BooleanCondition {
    type: ConditionType;
    values: ConditionValue[];
  }

  /**
   * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#ConditionValue
   */
  export interface ConditionValue {
    relativeDate: RelativeDate;
    userEnteredValue: string;
  }

  /**
   * https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#RelativeDate
   */
  export enum RelativeDate {
    RELATIVE_DATE_UNSPECIFIED, //Default value, do not use.
    PAST_YEAR, //The value is one year before today.
    PAST_MONTH, //The value is one month before today.
    PAST_WEEK, //The value is one week before today.
    YESTERDAY, //The value is yesterday.
    TODAY, //The value is today.
    TOMORROW //The value is tomorrow.
  }

  export enum ConditionType {
    CONDITION_TYPE_UNSPECIFIED, // The default value, do not use.
    NUMBER_GREATER, // The cell's value must be greater than the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    NUMBER_GREATER_THAN_EQ, //The cell's value must be greater than or equal to the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    NUMBER_LESS, //The cell's value must be less than the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    NUMBER_LESS_THAN_EQ, //The cell's value must be less than or equal to the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    NUMBER_EQ, //The cell's value must be equal to the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    NUMBER_NOT_EQ, //The cell's value must be not equal to the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    NUMBER_BETWEEN, //The cell's value must be between the two condition values. Supported by data validation, conditional formatting and filters. Requires exactly two ConditionValues.
    NUMBER_NOT_BETWEEN, //The cell's value must not be between the two condition values. Supported by data validation, conditional formatting and filters. Requires exactly two ConditionValues.
    TEXT_CONTAINS, //The cell's value must contain the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    TEXT_NOT_CONTAINS, //The cell's value must not contain the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    TEXT_STARTS_WITH, //The cell's value must start with the condition's value. Supported by conditional formatting and filters. Requires a single ConditionValue.
    TEXT_ENDS_WITH, //The cell's value must end with the condition's value. Supported by conditional formatting and filters. Requires a single ConditionValue.
    TEXT_EQ, //The cell's value must be exactly the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    TEXT_IS_EMAIL, //The cell's value must be a valid email address. Supported by data validation. Requires no ConditionValues.
    TEXT_IS_URL, //The cell's value must be a valid URL. Supported by data validation. Requires no ConditionValues.
    DATE_EQ, //The cell's value must be the same date as the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
    DATE_BEFORE, //The cell's value must be before the date of the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue that may be a relative date.
    DATE_AFTER, //The cell's value must be after the date of the condition's value. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue that may be a relative date.
    DATE_ON_OR_BEFORE, //The cell's value must be on or before the date of the condition's value. Supported by data validation. Requires a single ConditionValue that may be a relative date.
    DATE_ON_OR_AFTER, //The cell's value must be on or after the date of the condition's value. Supported by data validation. Requires a single ConditionValue that may be a relative date.
    DATE_BETWEEN, //The cell's value must be between the dates of the two condition values. Supported by data validation. Requires exactly two ConditionValues.
    DATE_NOT_BETWEEN, //The cell's value must be outside the dates of the two condition values. Supported by data validation. Requires exactly two ConditionValues.
    DATE_IS_VALID, //The cell's value must be a date. Supported by data validation. Requires no ConditionValues.
    ONE_OF_RANGE, //The cell's value must be listed in the grid in condition value's range. Supported by data validation. Requires a single ConditionValue, and the value must be a valid range in A1 notation.
    ONE_OF_LIST, //The cell's value must in the list of condition values. Supported by data validation. Supports any number of condition values, one per item in the list. Formulas are not supported in the values.
    BLANK, //The cell's value must be empty. Supported by conditional formatting and filters. Requires no ConditionValues.
    NOT_BLANK, //The cell's value must not be empty. Supported by conditional formatting and filters. Requires no ConditionValues.
    CUSTOM_FORMULA //The condition's formula must evaluate to true. Supported by data validation, conditional formatting and filters. Requires a single ConditionValue.
  }

  /**
   * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#ExtendedValue
   */
  export interface ExtendedValue {
    numberValue?: number;
    stringValue?: string;
    boolValue?: boolean;
    formulaValue?: string;
    errorValue?: ErrorValue;
  }

  /**
   * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#ErrorValue
   */
  export interface ErrorValue {
    type: ErrorType;
    message: string;
  }

  /**
   * @see https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets#ErrorType
   */
  export enum ErrorType {
    ERROR_TYPE_UNSPECIFIED, // The default error type, do not use this.
    ERROR, // Corresponds to the #ERROR! error.
    DIVIDE_BY_ZERO, // Corresponds to the #DIV/0 error.
    VALUE, // Corresponds to the #VALUE! error.
    REF, // Corresponds to the #REF! error.
    NAME, // Corresponds to the #NAME? error.
    NUM, //Corresponds to the #NUM! error.
    N_A, // Corresponds to the #N/A error.
    LOADING //Corresponds to the Loading... state.
  }

  export interface AppendResponse {
    spreadsheetId: string;
    tableRange: string;
    updates: UpdateValuesResponse;
    valueInputOption?: ValueInputOption;
    insertDataOption?: InsertDataOption;
    includeValuesInResponse?: boolean;
    responseValueRenderOption?: ValueRenderOption;
    responseDateTimeRenderOption?: DateTimeRenderOption;
  }

  export enum DateTimeRenderOption {
    SERIAL_NUMBER, // Instructs date, time, datetime, and duration fields to be output as doubles in "serial number" format, as popularized by Lotus 1-2-3. The whole number portion of the value (left of the decimal) counts the days since December 30th 1899. The fractional portion (right of the decimal) counts the time as a fraction of the day. For example, January 1st 1900 at noon would be 2.5, 2 because it's 2 days after December 30st 1899, and .5 because noon is half a day. February 1st 1900 at 3pm would be 33.625. This correctly treats the year 1900 as not a leap year.
    FORMATTED_STRING // Instructs date, time, datetime, and duration fields to be output as strings in their given number format (which is dependent on the spreadsheet locale).
  }

  export enum ValueRenderOption {
    FORMATTED_VALUE, // Values will be calculated & formatted in the reply according to the cell's formatting. Formatting is based on the spreadsheet's locale, not the requesting user's locale. For example, if A1 is 1.23 and A2 is =A1 and formatted as currency, then A2 would return "$1.23".
    UNFORMATTED_VALUE, // Values will be calculated, but not formatted in the reply. For example, if A1 is 1.23 and A2 is =A1 and formatted as currency, then A2 would return the number 1.23.
    FORMULA // Values will not be calculated. The reply will include the formulas. For example, if A1 is 1.23 and A2 is =A1 and formatted as currency, then A2 would return "=A1".
  }

  export enum InsertDataOption {
    OVERWRITE, // The new data overwrites existing data in the areas it is written. (Note: adding data to the end of the sheet will still insert new rows or columns so the data can be written.)
    INSERT_ROWS // Rows are inserted for the new data.
  }

  export type ValueInputOption = "RAW" | "USER_ENTERED";
  //   INPUT_VALUE_OPTION_UNSPECIFIED, // Default input value. This value must not be used.
  //   RAW, // The values the user has entered will not be parsed and will be stored as-is.
  //   USER_ENTERED // The values will be parsed as if the user typed them into the UI. Numbers will stay as numbers, but strings may be converted to numbers, dates, etc. following the same rules that are applied when entering text into a cell via the Google Sheets UI.
  // }
  export interface UpdateValuesResponse {
    spreadsheetId: string;
    updatedRange: string;
    updatedRows: number;
    updatedColumns: number;
    updatedCells: number;
    updatedData: ValueRange;
  }

  export type Value = string | number | boolean | null;
}
