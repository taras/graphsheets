export default class DataLoader {
  constructor(callback: (ids: string[]) => Promise<any>) {}

  load(id): Promise<any> {
    // TODO: replace this with invocation to dataload
    return Promise.resolve();
  }
}
