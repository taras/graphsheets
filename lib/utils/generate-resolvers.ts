import Spreadsheet from "../models/spreadsheet";
import Record from "../models/record";
import { filterObject, mapObject, reduceObject } from "./object-utils";
import onlyObjectTypes from "./only-object-types";
import {
  getFieldType,
  isDefinedMutation,
  isDefinedQuery,
  onlyComposite,
  reduceInputObjectTypeCallback,
  reduceMutationArguments,
  TypeMap,
  getMutation,
  reduceType,
  getType
} from "./type-map-utils";
import allProperties from "./wait-for-all-properties";
import {
  GraphQLNamedType,
  GraphQLList,
  GraphQLField,
  GraphQLSchema,
  GraphQLObjectType
} from "graphql";
import createRecordResolver from "../resolvers/create";

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
  let typeMap = schema.getTypeMap();

  let queries = generateQueryResolvers(typeMap, spreadsheet);
  let Mutation = generateMutationResolvers(typeMap, spreadsheet);

  return {
    ...queries,
    ...Mutation ? { Mutation } : {}
  };
}

export function generateMutationResolvers(
  typeMap: TypeMap,
  spreadsheet: Spreadsheet
): { Mutation?: { [name: string]: (root, args, context) => any } } {
  let Mutation = getType(typeMap, "Mutation") as GraphQLObjectType;

  return reduceObject(
    Mutation.getFields(),
    (result, mutationName: string, mutation: GraphQLField<string, any>) => {
      let type = getFieldType(mutation);
      return {
        ...result,
        .../^create(.*)$/.test(mutationName)
          ? {
              [mutationName]: createRecordResolver(spreadsheet, mutation)
            }
          : {}
      };
    }
  );
}

export function generateQueryResolvers(
  typeMap: TypeMap,
  spreadsheet: Spreadsheet
) {
  let objectTypes = onlyObjectTypes(typeMap);

  let Query = reduceObject(
    objectTypes,
    (
      result: { [name: string]: GraphQLNamedType },
      name: string,
      type: GraphQLNamedType
    ) => {
      let singularName = singular(name);
      let pluralName = plural(name);

      return assign(
        result,
        isDefinedQuery(typeMap, singularName) && {
          [singularName]: singularResolver(spreadsheet, name, type)
        },
        isDefinedQuery(typeMap, pluralName) && {
          [pluralName]: pluralResolver(spreadsheet, name, type)
        }
      );
    }
  );

  let rootTypes = reduceObject(
    objectTypes,
    (
      result: { [name: string]: GraphQLNamedType },
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

export function singular(name: string) {
  return name.toLowerCase();
}

export function plural(name) {
  // TODO: replace this with the inflector
  return `${name.toLowerCase()}s`;
}

export function updateRecordResolver(spreadsheet: Spreadsheet, type: string) {
  return function updateRecord(root, props, context) {
    let payload = props[singular(type)];
    return spreadsheet.updateRecord(type, payload);
  };
}

export function deleteRecordResolver(spreadsheet: Spreadsheet, type: string) {
  return function deleteRecord(root, props, context) {
    let { id } = props;
    return spreadsheet.deleteRecord(type, id);
  };
}

export function listReferenceResolver(
  spreadsheet: Spreadsheet,
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
  type: GraphQLNamedType
): (root, { id: string }, context) => Promise<Record> {
  return function findSpreadsheetRecord(root, { id }, context) {
    return spreadsheet.findRecord(name, id);
  };
}

export function pluralResolver(
  spreadsheet: Spreadsheet,
  name: string,
  type: GraphQLNamedType
): (root, args, context) => Promise<Record[]> {
  return function findAllSpreadsheetRecords(root, params, context) {
    return spreadsheet.findAll(name);
  };
}
