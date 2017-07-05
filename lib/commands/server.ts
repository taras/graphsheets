import path = require("path");
import GoogleSheetsAdapter from "../adapters/google-sheets";
import GoogleSheetsConnector from "../connectors/google-sheets";
import Spreadsheet from "../models/spreadsheet";
import asyncCommand from "../utils/async-command";
import authorize from "../utils/authorize-handler";
import bodyParser from "body-parser";
import * as express from "express";
import * as fs from "fs";
import { graphiqlExpress, graphqlExpress } from "graphql-server-express";
import {
  buildSchemaFromTypeDefinitions,
  makeExecutableSchema
} from "graphql-tools";
import { ITypeDefinitions } from "graphql-tools/dist/Interfaces";
import generateResolvers from "../utils/generate-resolvers";

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
    let { schemaPath, id } = argv;

    let typeDefs: ITypeDefinitions;
    try {
      typeDefs = fs.readFileSync(schemaPath, "utf8");
    } catch (e) {
      console.error(`❌  Failed to read schema.graphql at ${schemaPath}`);
    }

    let schema = buildSchemaFromTypeDefinitions(typeDefs);
    let types = schema.getTypeMap();

    let adapter = new GoogleSheetsAdapter(authorizer);
    let connector = new GoogleSheetsConnector(adapter);

    let spreadsheet = await connector.load(id, keys(types));

    let resolvers = generateResolvers(schema, spreadsheet);

    let executableSchema = makeExecutableSchema({
      typeDefs,
      resolvers
    });

    let app = express();

    app.use(
      "/",
      graphiqlExpress({
        endpointURL: "/graphql"
      })
    );

    app.use(
      "/graphql",
      bodyParser.json(),
      graphqlExpress({ schema: executableSchema })
    );
  })
});
