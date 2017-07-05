import GoogleSheetsConnector from "../connectors/google-sheets";

const { assign } = Object;
export default class Record {
  private connector: GoogleSheetsConnector;

  constructor(options) {
    assign(this, options);
  }
}
