import Spreadsheet from "../models/spreadsheet";
import { reduceObject } from "../utils/object-utils";
import {
  reduceInputObjectType,
  reduceMutationArguments,
  reduceType,
  buildObjectTypeParams
} from "../utils/type-map-utils";
import {
  GraphQLField,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLNamedType
} from "graphql";
import * as get from "lodash/fp/get";
import * as has from "lodash/fp/has";

const { isArray } = Array;

export default function createRecordResolver(
  spreadsheet: Spreadsheet,
  mutation: GraphQLField<string, any>
) {
  return async function createRecord(_, payload: Payload, context) {
    let withIds = injectIds(mutation, payload, {
      generateId: () => spreadsheet.newId()
    });

    let relationships = extractRelationships(mutation, withIds);

    let withRelationshipFormulas = replaceFormulasAndFlatten(mutation, withIds);

    return withIds;
  };
}

type FlatPayload = [string, { [key: string]: any }];

export function replaceFormulasAndFlatten(
  mutation: GraphQLField<string, any>,
  payload: Payload
) {
  return reduceMutationArguments(
    mutation,
    (result: Array<FlatPayload>, argName: string) => {
      let root = payload[argName];
      let output = mutation.type as GraphQLObjectType;
      let { isList, isObject } = buildObjectTypeParams(output);

      if (isObject) {
        return [...result, ...flattenReference(output, root)];
      }
    },
    []
  );
}

export function flattenReference(output, root) {
  return reduceType(
    output,
    (
      result,
      fieldName: string,
      type: GraphQLNamedType,
      { isScalar, isList, isObject }
    ) => {
      let value = root[fieldName];
      if (isObject && has(fieldName, root)) {
        if (isList) {
          if (isArray(value)) {
            return [
              ...result,
              ...value.reduce(
                (result, item) => [...result, ...flattenReference(type, item)],
                []
              )
            ];
          } else {
            return result;
          }
        } else {
          return [...result, ...flattenReference(type, value)];
        }
      }
      return result;
    },
    [
      [
        output.name,
        reduceType(
          output,
          (
            result,
            fieldName: string,
            type: GraphQLNamedType,
            { isList, isObject }
          ) => {
            if (isObject) {
              return {
                ...result,
                [fieldName]: relationshipFormula(
                  output.name,
                  root.id,
                  fieldName,
                  type.name
                )
              };
            }
            if (has(fieldName, root)) {
              return {
                ...result,
                [fieldName]: get(fieldName, root)
              };
            } else {
              return result;
            }
          }
        )
      ]
    ]
  );
}

export function relationshipFormula(
  from: string,
  id: string,
  on: string,
  to: string
) {
  return `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='${from}' AND C='${id}' AND D='${on}' and E='${to}'"))`;
}

export function extractRelationships(
  mutation: GraphQLField<string, any>,
  payload: Payload
) {
  let { type } = mutation;
  return reduceMutationArguments(
    mutation,
    (result, argName: string, argType: GraphQLInputObjectType, argInfo) => {
      let root = get(argName, payload);
      let output = mutation.type as GraphQLObjectType;

      return [...result, ...typeTraverser(output, root)];
    },
    []
  );
}

function typeTraverser(output: GraphQLObjectType, root) {
  return reduceType(
    output,
    (
      result,
      fieldName: string,
      type: GraphQLObjectType,
      { isList, isObject }
    ) => {
      if (isList && has(fieldName, root)) {
        return [
          ...result,
          ...get(fieldName, root).reduce((result, item) => {
            return [
              ...result,
              [output.name, root.id, fieldName, type.name, item.id],
              ...typeTraverser(type, item)
            ];
          }, [])
        ];
      }
      if (isObject && has(fieldName, root)) {
        return [
          ...result,
          [
            output.name,
            root.id,
            fieldName,
            type.name,
            get(`${fieldName}.id`, root)
          ],
          ...typeTraverser(type, get(fieldName, root))
        ];
      }
      return result;
    },
    []
  );
}

export function injectIds(mutation, payload, actions) {
  return reduceMutationArguments(
    mutation,
    (result, argName, argType: GraphQLInputObjectType, argInfo) => {
      let root = get(argName, payload);
      if (root) {
        return {
          ...result,
          [argName]: inputTraverser(argType, root, actions)
        };
      }
      return result;
    }
  );
}

type Payload = { [name: string]: any };

type TraverserActions = {
  generateId: () => string;
};

function inputTraverser(
  inputType: GraphQLInputObjectType,
  payload: Payload,
  actions: TraverserActions
) {
  return reduceInputObjectType(
    inputType,
    (
      result,
      inputProp,
      inputField: GraphQLInputObjectType,
      { isList, isInput, isScalar }
    ) => {
      let value = get(inputProp, payload);
      if (inputProp === "id") {
        return {
          ...result,
          id: value || actions.generateId()
        };
      }
      if (isScalar && has(inputProp, payload)) {
        return {
          ...result,
          [inputProp]: value
        };
      }
      if (isInput && value) {
        if (isList) {
          return {
            ...result,
            [inputProp]: value.map(item =>
              inputTraverser(inputField, item, actions)
            )
          };
        } else {
          return {
            ...result,
            [inputProp]: inputTraverser(inputField, value, actions)
          };
        }
      }
      return result;
    }
  );
}
