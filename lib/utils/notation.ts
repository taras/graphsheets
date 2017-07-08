const alphabet = "abcdefghijklmnopqrstuvwxyz".toUpperCase();

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
export default function toNotationMap(headers: string[]): Map<string, string> {
  return headers.reduce((result, current, index) => {
    return result.set(current, indexToNotation(index));
  }, new Map());
}
