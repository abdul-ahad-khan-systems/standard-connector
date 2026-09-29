const assert = require('assert');
const {
  StandardError,
  ERROR_CATEGORIES
} = require('../../src/core/error');

const expectedCategories = [
  'COMPATIBILITY',
  'ADAPTER',
  'SUB_CONNECTOR',
  'LIFECYCLE',
  'VERSION',
  'VALIDATION',
  'RESOLUTION',
  'UNEXPECTED'
];

assert.deepStrictEqual(
  ERROR_CATEGORIES,
  expectedCategories,
  'V1 error categories must remain exactly the frozen categories'
);

const error = new StandardError({
  code: 'TEST_ERROR',
  category: 'VALIDATION',
  message: 'Validation failed',
  cause: { field: 'test' },
  recoverable: true
});

assert.ok(error instanceof Error);
assert.ok(error instanceof StandardError);
assert.strictEqual(error.code, 'TEST_ERROR');
assert.strictEqual(error.category, 'VALIDATION');
assert.strictEqual(error.message, 'Validation failed');
assert.deepStrictEqual(error.cause, { field: 'test' });
assert.strictEqual(error.recoverable, true);

assert.throws(
  () => new StandardError({
    category: 'VALIDATION',
    message: 'Missing code'
  }),
  /requires a string code/
);

assert.throws(
  () => new StandardError({
    code: 'BAD_CATEGORY',
    category: 'NOT_A_CATEGORY',
    message: 'Invalid category'
  }),
  /requires a valid category/
);

assert.throws(
  () => new StandardError({
    code: 'BAD_MESSAGE',
    category: 'VALIDATION'
  }),
  /requires a string message/
);

console.log('PASS: V1 normalized error contract');
