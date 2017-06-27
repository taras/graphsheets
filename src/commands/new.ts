import asyncCommand from "../lib/utils/async-command";
import GoogleAuthorizer from "../lib/google-auth";
import GoogleSheets from "../lib/google-sheets";
import writeJSONSync from "../lib/utils/write-json";
import path = require("path");

export default asyncCommand({
  command: "new <title>",
  desc: "create a new sheet for your database",
  builder: {
    title: {
      description: "title for the new sheet"
    }
  },
  async handler(argv) {
    let { tokenPath, clientSecretPath, title } = argv;

    let authorizer = GoogleAuthorizer.restore(clientSecretPath, tokenPath);

    if (authorizer.isAuthorized) {
      let sheets = new GoogleSheets(authorizer);

      let sheet = <any>await sheets.create({
        properties: {
          title
        },
        sheets: [
          {
            properties: {
              title: "__METADATA"
            }
          }
        ]
      });

      let { spreadsheetUrl, spreadsheetId } = sheet;

      writeJSONSync(path.join(process.cwd(), "spreadsheet.json"), {
        url: spreadsheetUrl,
        id: spreadsheetId
      });
    } else {
      console.error(
        `Failed to create a new sheet because you're not authorized.`
      );
    }
  }
});
