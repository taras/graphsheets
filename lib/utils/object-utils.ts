const { assign, keys } = Object;

/**
 * Maps over the keys of an object converting the values of 
 * those keys into new objects. The return value will be an object 
 * with the same set of keys, but a different set of values. E.g.
 *
 * > mapObject({first: 1, second: 2}, (key, value)=> value *2)
 *
 *   {first: 2, second: 4}
 */
export function mapObject(object: {}, fn: (key: string, value: any) => any) {
  return reduceObject(object, function(result, name, value) {
    return assign(result, { [name]: fn(name, value) });
  });
}

/**
 * Create a new hash with keys and their corresponding values 
 * removed based on result of callback operation. E.g.
 * 
 * filterObject({ small: 1, smallish: 2, big: 4}, (key, value) => value < 3 })
 *  
 *  { small: 1, smallish: 2 } 
 * 
 * @param object 
 * @param fn 
 */
export function filterObject(object: {}, fn: (key, value) => boolean) {
  return reduceObject(
    object,
    (result, key, value) => {
      if (fn(key, value)) {
        return assign(result, {
          [key]: value
        });
      }
      return result;
    },
    {}
  );
}

/**
 * Create a new hash with 
 * @param object 
 * @param fn 
 * @param result 
 */
export function reduceObject(
  object: {},
  fn: (result: any, key: string, value: any) => any,
  result: any = {}
) {
  eachProperty(object, function(name, value) {
    result = fn(result, name, value);
  });
  return result;
}

export function eachProperty(
  object: {},
  fn: (key: string, value: any) => any
): void {
  if (typeof object === "object") {
    keys(object).forEach(function(key) {
      fn(key, object[key]);
    });
  }
}
