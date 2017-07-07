import GoogleSheetsConnector from "../connectors/google-sheets";
import Sheet from "./sheet";
import Record from "./record";
import zipObject = require("lodash.zipobject");
import { GoogleSheets } from "../adapters/google-sheets";
import ShortUUIDGenerator from "../adapters/short-uuid";

const { assign } = Object;
export default class Spreadsheet {
  private idGenerator: ShortUUIDGenerator;
  private connector: GoogleSheetsConnector;

  public id: string;
  public url: string;
  public title: string;
  public sheets: { [name: string]: Sheet };

  constructor(options) {
    this.idGenerator = options.idGenerator || new ShortUUIDGenerator();
    this.connector = options.connector;
    this.id = options.id;
    this.url = options.url;
    this.title = options.title;

    if (options.sheets) {
      this.sheets = options.sheets.reduce((result, item) => {
        let { title } = item;
        let sheet = new Sheet({
          connector: options.connector,
          spreadsheet: this,
          ...item
        });
        return assign(result, {
          [title]: sheet
        });
      }, {});
    }
  }

  async findRecord(type: string, id: string): Promise<Record> {
    let data = await this.connector.loadRecord(this.id, type, id);

    return new Record({
      connect: this.connector,
      ...data
    });
  }

  async findAll(type: string): Promise<Record[]> {
    let data = await this.connector.loadAll(this.id, type);

    return data.map(item => {
      return new Record({
        connector: this.connector,
        ...item
      });
    });
  }

  async findRecords(type: string, ids: string[]): Promise<Record[]> {
    let data = await this.connector.loadRecords(this.id, type, ids);

    return data.map(
      item =>
        new Record({
          connect: this.connector,
          ...item
        })
    );
  }

  async createRecord(
    type: string,
    props: { [name: string]: any }
  ): Promise<Record> {
    let { id } = props;

    if (id) {
      id = `${id}`;
    } else {
      id = this.idGenerator.new();
    }

    let data = await this.connector.createRecord(this.id, type, {
      ...props,
      id
    });

    return new Record({ connector: this.connector, ...data });
  }

  async updateRecord(
    type: string,
    props: { [name: string]: any }
  ): Promise<Record> {
    let data = await this.connector.updateRecord(this.id, type, props);

    return new Record({ connector: this.connector, ...data });
  }

  async deleteRecord(type: string, id: string): Promise<void> {
    return await this.connector.deleteRecord(this.id, type, id);
  }
}
