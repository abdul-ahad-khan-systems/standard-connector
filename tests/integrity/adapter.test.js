const assert = require('assert');
const Adapter = require('../../src/core/adapter');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');

const inputInterface = new InterfaceDescriptor({
  protocol: 'input.protocol',
  version: { major: 1, minor: 0, patch: 0 }
});

const outputInterface = new InterfaceDescriptor({
  protocol: 'output.protocol',
  version: { major: 1, minor: 0, patch: 0 }
});

let requestCalls = 0;
let resultCalls = 0;

const adapter = new Adapter({
  inputInterface,
  outputInterface,

  adaptRequest(request) {
    requestCalls += 1;
    return {
      ...request,
      adapted: true
    };
  },

  adaptResult(result) {
    resultCalls += 1;
    return {
      ...result,
      adaptedBack: true
    };
  },

  metadata: {
    id: 'test-adapter'
  }
});

assert.strictEqual(adapter.getInputInterface(), inputInterface);
assert.strictEqual(adapter.getOutputInterface(), outputInterface);
assert.deepStrictEqual(adapter.metadata, {
  id: 'test-adapter'
});

const request = { operation: 'read' };
const adaptedRequest = adapter.adaptRequest(request);

assert.strictEqual(requestCalls, 1);
assert.deepStrictEqual(adaptedRequest, {
  operation: 'read',
  adapted: true
});

const result = { status: 'OK' };
const adaptedResult = adapter.adaptResult(result);

assert.strictEqual(resultCalls, 1);
assert.deepStrictEqual(adaptedResult, {
  status: 'OK',
  adaptedBack: true
});

assert.throws(
  () => new Adapter({
    outputInterface,
    adaptRequest() {},
    adaptResult() {}
  }),
  /must specify an inputInterface/
);

assert.throws(
  () => new Adapter({
    inputInterface,
    adaptRequest() {},
    adaptResult() {}
  }),
  /must specify an outputInterface/
);

assert.throws(
  () => new Adapter({
    inputInterface,
    outputInterface,
    adaptResult() {}
  }),
  /must specify an adaptRequest function/
);

assert.throws(
  () => new Adapter({
    inputInterface,
    outputInterface,
    adaptRequest() {}
  }),
  /must specify an adaptResult function/
);

assert.throws(
  () => new Adapter({
    inputInterface: {},
    outputInterface,
    adaptRequest() {},
    adaptResult() {}
  }),
  /inputInterface as an InterfaceDescriptor/
);

console.log('PASS: V1 adapter integrity');
