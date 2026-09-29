const assert = require('assert');
const Protocol = require('../../src/core/protocol');

assert.strictEqual(Protocol.VERSION.major, 1);
assert.strictEqual(Protocol.VERSION.minor, 0);
assert.strictEqual(Protocol.VERSION.patch, 0);

assert.strictEqual(typeof Protocol.VERSION.toString, 'function');
assert.strictEqual(typeof Protocol.VERSION.isCompatible, 'function');

assert.strictEqual(
  Protocol.VERSION.toString(),
  '1.0.0'
);

assert.strictEqual(
  Protocol.VERSION.isCompatible({ major: 1, minor: 0, patch: 0 }),
  true
);

assert.strictEqual(
  Protocol.VERSION.isCompatible({ major: 1, minor: 9, patch: 9 }),
  true,
  'Same major version must remain compatible'
);

assert.strictEqual(
  Protocol.VERSION.isCompatible({ major: 2, minor: 0, patch: 0 }),
  false,
  'Different major versions must be incompatible'
);

assert.strictEqual(
  Protocol.VERSION.isCompatible({ major: 0, minor: 9, patch: 9 }),
  false,
  'Different major versions must be incompatible'
);

assert.strictEqual(
  Protocol.VERSION.isCompatible(null),
  false
);

assert.strictEqual(
  Protocol.VERSION.isCompatible(undefined),
  false
);

console.log('PASS: V1 protocol integrity');
