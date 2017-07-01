import GoogleSheetsConnector from "../connectors/google-sheets";

export default class Spreadsheet {
  private connector: GoogleSheetsConnector;

  public id: string;
  public url: string;

  constructor({ connector, id, url }) {
    this.connector = connector;
    this.id = id;
    this.url = url;
  }

  async structure() {
    return {};
  }
}
