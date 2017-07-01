import asyncCommand from "../utils/async-command";
import GoogleSheets from "../connectors/google-sheets";
import authorize from "../utils/authorize-handler";
import path = require("path");
import fs = require("fs");
import tools = require("graphql-tools");

/**
 * Plan for Update command:
 * 
 *  Requirements:
 *    1. Non destructive - must not delete any columns or edit existing columns
 *    2. Dry-run first - figure out what changes need to be made before starting to make any changes
 *  
 *  Comparison Process:
 *    1. Fetch Spreadsheet state from the API
 * 
 */
export default asyncCommand({
  command: "update",
  desc: "update the spreadsheet with GraphQL Schema",
  builder: {
    "schema-path": {
      describe: "path to the schema.graphql file",
      default: path.join(process.cwd(), "schema.graphql"),
      alias: "s"
    }
  },
  handler: authorize(async function handler(argv) {
    let { schemaPath, id } = argv;

    let typeDefinitions;
    try {
      typeDefinitions = fs.readFileSync(schemaPath, "utf8");
    } catch (e) {
      console.error(`❌  Failed to read schema.graphql at ${schemaPath}`);
    }

    if (typeDefinitions) {
      let schema = tools.buildSchemaFromTypeDefinitions(typeDefinitions);
    }
  })
});
