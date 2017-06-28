import asyncCommand from "../lib/utils/async-command";
import GoogleAuthorizer from "../lib/google-auth";
import GoogleSheets from "../lib/google-sheets";
import writeJSONSync from "../lib/utils/write-json";
import path = require("path");

const welcomeMessage = `
Welcome to your 
GraphSheets Database

Here you can create columns using functions and
use scripts created with the Script Editor.

Feel free to play around because Google Sheets keeps track of your changes
so you can always undo if you break something.

Created by your friends at This Dot, Inc.
Say hi@thisdot.co
`;

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
              title: "WELCOME",
              gridProperties: {
                rowCount: 1,
                columnCount: 1
              }
            },
            data: {
              rowData: {
                values: [
                  {
                    userEnteredValue: {
                      stringValue: welcomeMessage
                    },
                    effectiveValue: {
                      stringValue: welcomeMessage
                    },
                    formattedValue: welcomeMessage,
                    userEnteredFormat: {
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE"
                    },
                    effectiveFormat: {
                      horizontalAlignment: "CENTER",
                      verticalAlignment: "MIDDLE"
                    }
                  }
                ]
              },
              rowMetadata: [
                {
                  pixelSize: 500
                }
              ],
              columnMetadata: [
                {
                  pixelSize: 500
                }
              ]
            }
          },
          {
            properties: {
              title: "RELATIONSHIPS",
              hidden: true,
              gridProperties: {
                rowCount: 19999,
                columnCount: 5
              }
            }
          }
        ]
      });

      let { spreadsheetUrl, spreadsheetId } = sheet;

      writeJSONSync(path.join(process.cwd(), "spreadsheet.json"), {
        url: spreadsheetUrl,
        id: spreadsheetId
      });

      console.info(`
      👍  your database was created at ${spreadsheetUrl}

      This information was also saved to spreadsheet.json.
      `);
    } else {
      console.error(
        `Failed to create a new sheet because you're not authorized.`
      );
    }
  }
});
