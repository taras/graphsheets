import { IRelationship } from "../Interfaces";

export type RelationshipField = [string, string, string];

export default function uniqueRelationships(
  relationships: Array<IRelationship>
) {
  return relationships.reduce((seen, item) => {
    let [from, id, on, to] = item;

    let found = seen.find(([seenFrom, seenId, seenOn, seenTo]) => {
      return (
        from === seenFrom && seenId === id && seenOn === on && seenTo === to
      );
    });

    if (found) {
      return seen;
    } else {
      return [[from, id, on, to], ...seen];
    }
  }, []);
}
