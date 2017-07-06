import Spreadsheet from "../models/spreadsheet";
import Record from "../models/record";
import { filterObject, reduceObject, mapObject } from "./object-utils";

import { IResolvers } from "graphql-tools/dist/Interfaces";
import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLNamedType,
  isCompositeType,
  GraphQLNonNull,
  getNamedType,
  GraphQLList
} from "graphql";
import onlyObjectTypes from "./only-object-types";

const { assign, keys } = Object;

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
export default function generateResolvers(schema: GraphQLSchema, spreadsheet) {
  let typesMap = schema.getTypeMap();

  let objectTypes = onlyObjectTypes(typesMap);

  let Query = reduceObject(
    objectTypes,
    (
      result: { [name: string]: GraphQLObjectType },
      name: string,
      type: GraphQLObjectType
    ) => {
      let singularName = singular(name);
      let pluralName = plural(name);

      return assign(
        result,
        isDefinedQuery(typesMap, singularName) && {
          [singularName]: singularResolver(spreadsheet, name, type)
        },
        isDefinedQuery(typesMap, pluralName) && {
          [pluralName]: pluralResolver(spreadsheet, name, type)
        }
      );
    }
  );

  let rootTypes = reduceObject(
    objectTypes,
    (
      result: { [name: string]: GraphQLObjectType },
      name: string,
      type: GraphQLObjectType
    ) => {
      let fields = onlyComposite(type.getFields());

      if (keys(fields).length > 0) {
        return assign(result, {
          [name]: mapObject(fields, (propName, field) => {
            let type = getFieldType(field);
            if (field.type instanceof GraphQLList) {
              return listReferenceResolver(spreadsheet, propName, type.name);
            } else {
              return singleReferenceResolver(spreadsheet, propName, type.name);
            }
          })
        });
      } else {
        return result;
      }
    }
  );
  return assign(
    {
      Query
    },
    rootTypes
  );
}

export function onlyComposite(fields) {
  return filterObject(fields, (propName, field) => {
    return isCompositeType(getFieldType(field));
  });
}

export function getFieldType(field) {
  let { type } = field;
  if (type instanceof GraphQLNonNull || type instanceof GraphQLList) {
    return getNamedType(type);
  } else {
    return type;
  }
}

export function isDefinedQuery(typesMap, name: string): boolean {
  let { Query } = typesMap;
  let fields = Query.getFields();
  return !!fields[name];
}

export function singular(name: string) {
  return name.toLowerCase();
}

export function plural(name) {
  // TODO: replace this with the inflector
  return `${name.toLowerCase()}s`;
}

export function listReferenceResolver(
  spreadsheet,
  propName: string,
  type: string
) {
  return function findListReference(root, params, context) {
    let value = root[propName];
    if (value) {
      let ids = value.split(",");
      if (value.length > 0) {
        return spreadsheet.findRecords(type, ids);
      }
    }
  };
}

export function singleReferenceResolver(
  spreadsheet,
  propName: string,
  type: string
) {
  return function findSingleReference(root, params, context) {
    let value = root[propName];
    if (value) {
      return spreadsheet.findRecord(type, value);
    }
  };
}

export function singularResolver(
  spreadsheet: Spreadsheet,
  name: string,
  type: GraphQLObjectType
): (root, { id: string }, context) => Promise<Record> {
  return function findSpreadsheetRecord(root, { id }, context) {
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
