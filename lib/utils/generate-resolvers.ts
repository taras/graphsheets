import Spreadsheet from "../models/spreadsheet";
import Record from "../models/record";
import { filterObject, reduceObject } from "./object-utils";

import { IResolvers } from "graphql-tools/dist/Interfaces";
import { GraphQLSchema, GraphQLObjectType } from "graphql";

/**
 * For every type return the following,
 *  Query:
 *    <Type>
 *    <Type>s
 *  Mutation:
 *    create<Type>
 *    update<Type>
 *    delete<Type>
 *  Type
 *    relationships
 * @param schema GraphQLSchema
 * @param spreadsheet Spreadsheet
 */
export default function generateResolvers(
  schema: GraphQLSchema,
  spreadsheet
): IResolvers {
  let types = schema.getTypeMap();

  let objectTypes = filterObject(
    types,
    (name, type) => type instanceof GraphQLObjectType
  );

  let query = reduceObject(
    objectTypes,
    (
      query: { [name: string]: GraphQLObjectType },
      name: string,
      type: GraphQLObjectType
    ) => {
      return Object.assign(query, {
        [singular(name)]: singularResolver(spreadsheet, name, type),
        [plural(name)]: pluralResolver(spreadsheet, name, type)
      });
    }
  );

  return;
}

export function singular(name: string) {
  return name.toLowerCase();
}

export function singularResolver(
  spreadsheet: Spreadsheet,
  name: string,
  type: GraphQLObjectType
): (id: string) => Promise<Record> {
  return function findSpreadsheetRecord(id: string) {
    return spreadsheet.findRecord(name, id);
  };
}

export function plural(name) {
  // TODO: replace this with the inflector
  return `${name}s`;
}

export function pluralResolver(
  spreadsheet: Spreadsheet,
  name: string,
  type: GraphQLObjectType
): () => Promise<Record[]> {
  return function findAllSpreadsheetRecords() {
    return spreadsheet.findAll(name);
  };
}
