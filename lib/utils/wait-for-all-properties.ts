import { hash, all } from "rsvp";
import { mapObject } from "./object-utils";

export default function waitForAllProperties(object: { [name: string]: any }) {
  return hash(
    mapObject(object, (key, value) => {
      if (value instanceof Array) {
        return all(value);
      } else {
        return value;
      }
    })
  );
}

function isThenable(object) {
  return object.then && object.then.call;
}
