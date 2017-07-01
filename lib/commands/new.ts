import asyncCommand from "../utils/async-command";
import GoogleSheetsConnector from "../connectors/google-sheets";
import GoogleSheetsAdapter from "../adapters/google-sheets";
import writeJSONSync from "../utils/write-json";
import authorize from "../utils/authorize-handler";

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
  handler: authorize(async function handler(argv, authorizer) {
    let { title } = argv;

    let adapter = new GoogleSheetsAdapter(authorizer);
    let sheets = new GoogleSheetsConnector(adapter);

    let sheet = <any>await sheets.create(basicSheets(title));

    let { spreadsheetUrl, spreadsheetId } = sheet;

    writeJSONSync(path.join(process.cwd(), "spreadsheet.json"), {
      url: spreadsheetUrl,
      id: spreadsheetId
    });

    console.info(`
    👍  your database was created at ${spreadsheetUrl}

    This information was also saved to spreadsheet.json.
    `);
  })
});

function basicSheets(title) {
  return {
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
  };
}
