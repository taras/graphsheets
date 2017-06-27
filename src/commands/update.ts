import asyncCommand from "../lib/utils/async-command";
import GoogleAuthorizer from "../lib/google-auth";
import GoogleSheets from "../lib/google-sheets";
import path = require("path");

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
  }
});
