import GoogleSheetsConnector from "../connectors/google-sheets";
import toNotationMap from "../utils/notation";
import Spreadsheet from "./spreadsheet";
import { ISheetHeader } from "../Interfaces";

const { assign } = Object;

export default class Sheet {
  private connector: GoogleSheetsConnector;

  public id: string;
  public title: string;
  public index: string;
  public hidden: boolean;
  public spreadsheet: Spreadsheet;
  public headers: ISheetHeader[];
  public rowCount: number;
  public columnCount: number;

  public columns: Map<string, string>;

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
        columns: toNotationMap(options.headers.map(({ title }) => title))
      },
      options
    );
  }
}
