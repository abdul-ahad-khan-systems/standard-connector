const assert = require('assert');
const {
  CLASSIFICATIONS,
  isValidClassification
} = require('../../src/core/classifications');

const expected = [
  'DIRECT_MATCH',
  'ADAPTER_REQUIRED',
  'SUB_CONNECTOR_REQUIRED',
  'CONNECTOR_MISMATCH',
  'INCOMPATIBLE'
];

assert.deepStrictEqual(
  Object.values(CLASSIFICATIONS),
  expected,
  'V1 classifications must remain exactly the five frozen classifications'
);

for (const classification of expected) {
  assert.strictEqual(
    isValidClassification(classification),
    true,
    `${classification} must be recognized as valid`
  );
}

assert.strictEqual(
  isValidClassification('UNKNOWN'),
  false,
  'Unknown classifications must be rejected'
);

console.log('PASS: V1 classification integrity');
