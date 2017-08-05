import { buildSchemaFromTypeDefinitions } from "graphql-tools/dist";

const fs = require("fs");
const path = require("path");

export default function getTypeMapFromSchemaFile(file: string) {
  let schemaPath = path.join(__dirname, "../fixtures", `${file}.graphql`);
  let schemaFile = fs.readFileSync(schemaPath, "utf8");
  let schema = buildSchemaFromTypeDefinitions(schemaFile);
  return schema.getTypeMap();
}
