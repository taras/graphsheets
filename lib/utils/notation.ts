const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase();

const { assign } = Object;

// FIX: only supports 26 columns
export function indexToNotation(index) {
  return alphabet[index];
}

/**
 * Return a map with each item in the array mapped to notation. Eg.
 * 
 * toNotationMap([ 'id', 'name' ]) // => { id: 'A', name: 'B' }
 * 
 * @param headers string[]
 */
export default function toNotationMap(
  headers: string[]
): { [header: string]: string } {
  return headers.reduce((previous, current, index) => {
    return assign(previous, {
      [current]: indexToNotation(index)
    });
  }, {});
}
