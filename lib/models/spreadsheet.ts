import GoogleSheetsConnector from "../connectors/google-sheets";
import Sheet from "./sheet";
export default class Spreadsheet {
  private connector: GoogleSheetsConnector;

  public id: string;
  public url: string;
  public title: string;
  public sheets: Sheet[];

  constructor(options) {
    this.connector = options.connector;
    this.id = options.id;
    this.url = options.url;
    this.title = options.title;

    if (options.sheets) {
      this.sheets = options.sheets.map(
        sheet =>
          new Sheet({
            connector: options.connector,
            spreadsheet: this,
            ...sheet
          })
      );
    }
  }
}
