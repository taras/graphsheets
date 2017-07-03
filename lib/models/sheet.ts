import GoogleSheetsConnector from "../connectors/google-sheets";
import Spreadsheet from "./spreadsheet";

export default class Sheet {
  private connector: GoogleSheetsConnector;

  public id: string;
  public title: string;
  public index: string;
  public hidden: boolean;
  public spreadsheet: Spreadsheet;
  public headers: string[];

  constructor(options) {
    this.connector = options.connector;
    this.title = options.title;
    this.index = options.index;
    this.hidden = options.hidden;
    this.spreadsheet = options.spreadsheet;
    this.headers = options.headers;
  }
}
