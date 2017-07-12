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
  GraphQLList,
  GraphQLField,
  GraphQLScalarType,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLBoolean,
  GraphQLID,
  GraphQLFieldMap,
  GraphQLCompositeType,
  GraphQLFieldConfigMap
} from "graphql";
import onlyObjectTypes from "./only-object-types";
import allProperties from "./wait-for-all-properties";
import {
  isDefinedMutation,
  TypeMap,
  isDefinedQuery,
  onlyComposite,
  getFieldType
} from "./type-map-utils";

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
  let mutations = generateMutationResolvers(typeMap, spreadsheet);

  return assign({}, queries, mutations);
}

export function generateMutationResolvers(
  typeMap: TypeMap,
  spreadsheet: Spreadsheet
): { Mutation?: { [name: string]: (root, args, context) => any } } {
  let objectTypes = onlyObjectTypes(typeMap);

  let Mutation = reduceObject(
    objectTypes,
    (
      result: { [name: string]: (root, args, context) => any },
      name: string,
      type: GraphQLObjectType
    ) => {
      return assign(
        result,
        isDefinedMutation(typeMap, `create${name}`) && {
          [`create${name}`]: createRecordResolver(spreadsheet, type)
        },
        isDefinedMutation(typeMap, `update${name}`) && {
          [`update${name}`]: updateRecordResolver(spreadsheet, name)
        },
        isDefinedMutation(typeMap, `delete${name}`) && {
          [`delete${name}`]: deleteRecordResolver(spreadsheet, name)
        }
      );
    }
  );

  if (keys(Mutation).length > 0) {
    return { Mutation };
  } else {
    return {};
  }
}

export function generateQueryResolvers(
  typeMap: TypeMap,
  spreadsheet: Spreadsheet
) {
  let objectTypes = onlyObjectTypes(typeMap);

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

export function singular(name: string) {
  return name.toLowerCase();
}

export function plural(name) {
  // TODO: replace this with the inflector
  return `${name.toLowerCase()}s`;
}

export function createRecordResolver(
  spreadsheet: Spreadsheet,
  type: GraphQLObjectType
) {
  let { name } = type;
  return async function createRecord(root, payload, context) {
    let params = payload[singular(name)];

    let { id } = params;

    if (!id) {
      id = spreadsheet.newId();
    }

    let fields = onlyComposite(type.getFields());

    let relationshipFields = mapObject(fields, (propName, field) => {
      let target = getFieldType(field);
      return generateRelationshipFormula(type.name, id, target.name, propName);
    });

    let record = await spreadsheet.createRecord(name, {
      id,
      ...params,
      ...relationshipFields
    });

    if (!record) {
      return;
    }

    let composed = createComposed(spreadsheet, record, fields, params, context);

    let references = await allProperties(composed);

    return assign(record, references);
  };
}

export function saveRelationships() {}

export function createComposed(
  spreadsheet: Spreadsheet,
  record: Record,
  fields: GraphQLFieldMap<string, GraphQLCompositeType>,
  params: { [fieldName: string]: any },
  context: { [propName: string]: any }
) {
  return {};
  // return reduceObject(
  //   fields,
  //   (
  //     result,
  //     propName: string,
  //     field: GraphQLField<string, GraphQLCompositeType>
  //   ) => {
  //     if (params[propName] !== undefined) {
  //       let type = getFieldType(field);
  //       let createRecord = createRecordResolver(spreadsheet, type);
  //       let value = params[propName];
  //       if (field.type instanceof GraphQLList) {
  //         if (value instanceof Array) {
  //           return assign(result, {
  //             [propName]: value.map(item => {
  //               return createRecord(
  //                 record,
  //                 {
  //                   [singular(type.name)]: item
  //                 },
  //                 context
  //               );
  //             })
  //           });
  //         } else {
  //           throw new Error(`${propName} must be an array to create ${type}`);
  //         }
  //       } else {
  //         if (typeof value === "object") {
  //           return assign(result, {
  //             [propName]: createRecord(
  //               record,
  //               {
  //                 [singular(type.name)]: value
  //               },
  //               context
  //             )
  //           });
  //         } else {
  //           throw new Error(`${propName} must be an object to create ${type}`);
  //         }
  //       }
  //     } else {
  //       return result;
  //     }
  //   }
  // );
}

export function generateRelationshipFormula(
  from: string,
  id: string,
  on: string,
  to: string
) {
  return `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='${from}' AND C='${id}' AND D='${on}' and E='${to}'"))`;
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
