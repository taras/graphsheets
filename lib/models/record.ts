import GoogleSheetsConnector from "../connectors/google-sheets";

const { assign } = Object;
export default class Record {
  private connector: GoogleSheetsConnector;

  constructor(options) {
    console.log(options);
    assign(this, options);
  }
}
