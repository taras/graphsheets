import getTypeMapFromSchemaFile from "../helpers/get-type-map";
import { getMutation } from "../../lib/utils/type-map-utils";

describe("resolvers/update", () => {
  let typeMap = getTypeMapFromSchemaFile("default");
  let mutation = getMutation(typeMap, "updatePerson");
  let spreadsheet, resolver;
});
