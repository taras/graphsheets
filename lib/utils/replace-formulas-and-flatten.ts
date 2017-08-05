import flattenPayload from "./flatten-payload";
import { GraphQLField } from "graphql";
import { IGenericPayload, IFlatPayload } from "../Interfaces";

export default function replaceFormulasAndFlatten(
  mutation: GraphQLField<string, any>,
  payload: IGenericPayload
): Array<IFlatPayload> {
  return flattenPayload(mutation, relationshipFormula, payload);
}

export function relationshipFormula(
  from: string,
  id: string,
  on: string,
  to: string
) {
  return `=JOIN(",", QUERY(RELATIONSHIPS!A:F, "SELECT F WHERE B='${from}' AND C='${id}' AND D='${on}' and E='${to}'"))`;
}
