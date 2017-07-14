import Spreadsheet from "../models/spreadsheet";
import {
  reduceInputObjectType,
  reduceMutationArguments
} from "../utils/type-map-utils";
import {
  GraphQLObjectType,
  GraphQLField,
  GraphQLInputObjectType
} from "graphql";
import * as get from "lodash/fp/get";
import * as set from "lodash/fp/set";
import * as has from "lodash/fp/has";

export default function createRecordResolver(
  spreadsheet: Spreadsheet,
  type: GraphQLObjectType,
  mutation: GraphQLField<string, any>
) {
  let { name } = type;
  return async function createRecord(_, payload: Payload, context) {
    let withIds = injectIds(mutation, payload, {
      generateId: () => spreadsheet.newId()
    });

    return withIds;
  };
}

export function extractRelationships(mutation, withIds) {}

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
