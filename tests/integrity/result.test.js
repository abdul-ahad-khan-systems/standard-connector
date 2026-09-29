const assert = require('assert');
const Result = require('../../src/core/result');

const ok = new Result({
  status: 'OK',
  payload: { value: 42 },
  metadata: {
    operation: 'read',
    durationMs: 12
  }
});

assert.strictEqual(ok.status, 'OK');
assert.deepStrictEqual(ok.payload, { value: 42 });
assert.deepStrictEqual(ok.metadata, {
  operation: 'read',
  durationMs: 12
});

const error = new Result({
  status: 'ERROR',
  payload: { reason: 'failed' },
  metadata: { recoverable: false }
});

assert.strictEqual(error.status, 'ERROR');
assert.deepStrictEqual(error.payload, { reason: 'failed' });
assert.deepStrictEqual(error.metadata, { recoverable: false });

const defaults = new Result({
  status: 'OK'
});

assert.strictEqual(defaults.payload, null);
assert.deepStrictEqual(defaults.metadata, {});

assert.throws(
  () => new Result(),
  /must specify a status/
);

assert.throws(
  () => new Result({ status: 'INVALID' }),
  /must specify a status/
);

assert.throws(
  () => new Result({ status: null }),
  /must specify a status/
);

assert.throws(
  () => new Result({ status: 200 }),
  /must specify a status/
);

console.log('PASS: V1 result integrity');
