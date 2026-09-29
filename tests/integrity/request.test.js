const assert = require('assert');
const Request = require('../../src/core/request');

const targetInterface = {
  protocol: 'test.protocol',
  version: {
    major: 1,
    minor: 0,
    patch: 0
  }
};

const request = new Request({
  targetInterface,
  operation: 'read',
  parameters: { id: 42 },
  auth: { tokenRef: 'test-token' },
  scope: { resource: 'test' },
  callerIdentity: 'test-caller'
});

assert.strictEqual(request.targetInterface, targetInterface);
assert.strictEqual(request.operation, 'read');
assert.deepStrictEqual(request.parameters, { id: 42 });
assert.deepStrictEqual(request.auth, { tokenRef: 'test-token' });
assert.deepStrictEqual(request.scope, { resource: 'test' });
assert.strictEqual(request.callerIdentity, 'test-caller');

const defaults = new Request({
  targetInterface,
  operation: 'ping'
});

assert.strictEqual(defaults.parameters, null);
assert.strictEqual(defaults.auth, null);
assert.strictEqual(defaults.scope, null);
assert.strictEqual(defaults.callerIdentity, null);

assert.throws(
  () => new Request({ operation: 'read' }),
  /must specify a targetInterface/
);

assert.throws(
  () => new Request({
    targetInterface,
    operation: ''
  }),
  /must specify a string operation/
);

assert.throws(
  () => new Request({
    targetInterface,
    operation: 123
  }),
  /must specify a string operation/
);

assert.throws(
  () => new Request({
    targetInterface,
    operation: null
  }),
  /must specify a string operation/
);

console.log('PASS: V1 request integrity');
