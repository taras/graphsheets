import GoogleSheetsConnector from "../connectors/google-sheets";
import toNotationMap from "../utils/notation";
import Spreadsheet from "./spreadsheet";

const { assign } = Object;

export default class Sheet {
  private connector: GoogleSheetsConnector;

  public id: string;
  public title: string;
  public index: string;
  public hidden: boolean;
  public spreadsheet: Spreadsheet;
  public headers: string[];
  public rowCount: number;
  public columnCount: number;

  public columns: { [header: string]: string };

  public get range() {
    let [first] = this.headers;
    let [last] = this.headers[this.headers.length - 1];
    let from = `${this.columns[first]}2`;
    // TODO? does this need rowCount at the end?
    let to = `${this.columns[last]}${this.columnCount}`;
    return `${this.title}!${from}:${to}`;
  }

  /**
   * @param options {}
   * @param options.id 
   * @param options.title
   * @param options.index
   * @param options.hidden
   * @param options.spreadsheet
   * @param options.headers
   * @param options.rowCount
   * @param options.columnCount
   */
  constructor(options) {
    assign(
      this,
      options.headers && {
        columns: toNotationMap(options.headers)
      },
      options
    );
  }
}
