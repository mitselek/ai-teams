// (*CD:Babbage*)
// Deterministic JSON serialisation with recursively sorted keys.
//
// WHY NOT JSON.stringify(obj, sortedKeys)?
// JSON.stringify with an array replacer only filters TOP-LEVEL keys.
// Nested objects have their keys excluded entirely, producing `{}` for any
// nested object whose keys aren't in the top-level sort array.
//
// Example of the broken behaviour:
//   JSON.stringify({ from: { team: 'a', agent: 'x' } }, ['from'])
//   → '{"from":{}}'   ← nested keys are dropped!
//
// This function recursively sorts keys at every level, producing a canonical
// string that is safe to use as a checksum input.

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(stableStringify).join(',') + ']';
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}
