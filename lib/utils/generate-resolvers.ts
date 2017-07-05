import Spreadsheet from "../models/spreadsheet";
import Record from "../models/record";
import { filterObject, reduceObject } from "./object-utils";

import { IResolvers } from "graphql-tools/dist/Interfaces";
import { GraphQLSchema, GraphQLObjectType } from "graphql";
import onlyObjectTypes from "./only-object-types";

const { assign } = Object;

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
  let typesMap = schema.getTypeMap();

  let objectTypes = onlyObjectTypes(typesMap);

  let Query = reduceObject(
    objectTypes,
    (
      query: { [name: string]: GraphQLObjectType },
      name: string,
      type: GraphQLObjectType
    ) => {
      return assign(query, {
        [singular(name)]: singularResolver(spreadsheet, name, type),
        [plural(name)]: pluralResolver(spreadsheet, name, type)
      });
    }
  );

  return {
    Query
  };
}

export function singular(name: string) {
  return name.toLowerCase();
}

export function plural(name) {
  // TODO: replace this with the inflector
  return `${name.toLowerCase()}s`;
}

export function singularResolver(
  spreadsheet: Spreadsheet,
  name: string,
  type: GraphQLObjectType
): (root, { id: string }, context) => Promise<Record> {
  return function findSpreadsheetRecord(root, params, context) {
    let { id } = params;
    return spreadsheet.findRecord(name, id);
  };
}

export function pluralResolver(
  spreadsheet: Spreadsheet,
  name: string,
  type: GraphQLObjectType
): (root, args, context) => Promise<Record[]> {
  return function findAllSpreadsheetRecords(root, params, context) {
    return spreadsheet.findAll(name);
  };
}
