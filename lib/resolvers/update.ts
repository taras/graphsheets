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
  return function updateRecord(_, payload: IGenericPayload) {};
}
