import * as short from "short-uuid";

export default class ShortUUIDGenerator {
  private translator;

  constructor() {
    this.translator = short();
  }

  public new(): string {
    return this.translator.new();
  }

  public toUUID(shortUUID: string): string {
    return this.translator.toUUID(shortUUID);
  }
}
