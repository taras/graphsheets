import flattenPayload from "../utils/flatten-payload";
import { IGenericPayload } from "../Interfaces";
import Spreadsheet from "../models/spreadsheet";
import { GraphQLField, GraphQLObjectType } from "graphql";
import {
  reduceMutationArguments,
  buildObjectTypeParams,
  reduceType
} from "../utils/type-map-utils";

/**
 * Strategy for performing updates to records.
 */
export default function updateRecordResolver(
  spreadsheet: Spreadsheet,
  mutation: GraphQLField<string, any>
) {
  return function updateRecord(_, payload: IGenericPayload) {
    /**
     * Flattening payload to make it easier to save but I'm intentionally
     * replacing relationships with null to ensure that they get ignored and
     * do not get overwritten.
     */
    let flattened = flattenPayload(mutation, () => null, payload);
  };
}
