import path = require("path");
import GoogleSheetsAdapter from "../adapters/google-sheets";
import GoogleSheetsConnector from "../connectors/google-sheets";
import Spreadsheet from "../models/spreadsheet";
import asyncCommand from "../utils/async-command";
import authorize from "../utils/authorize-handler";
import * as bodyParser from "body-parser";
import * as express from "express";
import * as fs from "fs";
import { graphiqlExpress, graphqlExpress } from "graphql-server-express";
import {
  buildSchemaFromTypeDefinitions,
  makeExecutableSchema
} from "graphql-tools";
import { ITypeDefinitions } from "graphql-tools/dist/Interfaces";
import generateResolvers from "../utils/generate-resolvers";
import onlyObjectTypes from "../utils/only-object-types";
import http = require("http");

const { keys } = Object;

export default asyncCommand({
  command: "server",
  desc: "start GraphQL server in development",
  builder: {
    port: {
      description: "port for the server",
      alias: "p",
      default: 3000
    }
  },
  handler: authorize(async function handler(argv, authorizer) {
    let { schemaPath, id, port } = argv;

    let typeDefs: ITypeDefinitions;
    try {
      typeDefs = fs.readFileSync(schemaPath, "utf8");
    } catch (e) {
      console.error(`❌  Failed to read schema.graphql at ${schemaPath}`);
    }

    let schema = buildSchemaFromTypeDefinitions(typeDefs);
    let typesMap = schema.getTypeMap();
    let objectTypes = onlyObjectTypes(typesMap);

    let adapter = new GoogleSheetsAdapter(authorizer);
    let connector = new GoogleSheetsConnector(adapter);
    let spreadsheet = await connector.load(id, keys(objectTypes));
    let resolvers = generateResolvers(schema, spreadsheet);

    let executableSchema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    let app = express();

    app.use(
      "/graphql",
      bodyParser.json(),
      graphqlExpress({ schema: executableSchema })
    );

    app.use(
      "/",
      graphiqlExpress({
        endpointURL: "/graphql"
      })
    );

    let server = http.createServer(app).listen(port);

    await new Promise(function(resole, reject) {
      server
        .on("listening", () => {
          console.log("Started server on http://localhost:3000");
        })
        .on("error", reject);
    });
  })
});
