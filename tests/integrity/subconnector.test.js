const assert = require('assert');
const SubConnector = require('../../src/core/subConnector');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');

const inputInterface = new InterfaceDescriptor({
  protocol: 'transport.input',
  version: { major: 1, minor: 0, patch: 0 }
});

const outputInterface = new InterfaceDescriptor({
  protocol: 'transport.output',
  version: { major: 1, minor: 0, patch: 0 }
});

let connectCalls = 0;
let disposeCalls = 0;

const subConnector = new SubConnector({
  inputInterface,
  outputInterface,

  connect(parameters) {
    connectCalls += 1;
    return {
      connected: true,
      parameters
    };
  },

  dispose(connection) {
    disposeCalls += 1;
    connection.disposed = true;
    return connection;
  },

  metadata: {
    id: 'test-subconnector'
  }
});

assert.strictEqual(subConnector.getInputInterface(), inputInterface);
assert.strictEqual(subConnector.getOutputInterface(), outputInterface);
assert.deepStrictEqual(subConnector.metadata, {
  id: 'test-subconnector'
});

const connection = subConnector.connect({
  endpoint: 'test-endpoint'
});

assert.strictEqual(connectCalls, 1);
assert.deepStrictEqual(connection, {
  connected: true,
  parameters: {
    endpoint: 'test-endpoint'
  }
});

const disposed = subConnector.dispose(connection);

assert.strictEqual(disposeCalls, 1);
assert.strictEqual(disposed.disposed, true);

assert.throws(
  () => new SubConnector({
    outputInterface,
    connect() {},
    dispose() {}
  }),
  /must specify an inputInterface/
);

assert.throws(
  () => new SubConnector({
    inputInterface,
    connect() {},
    dispose() {}
  }),
  /must specify an outputInterface/
);

assert.throws(
  () => new SubConnector({
    inputInterface,
    outputInterface,
    dispose() {}
  }),
  /must specify a connect function/
);

assert.throws(
  () => new SubConnector({
    inputInterface,
    outputInterface,
    connect() {}
  }),
  /must specify a dispose function/
);

assert.throws(
  () => new SubConnector({
    inputInterface: {},
    outputInterface,
    connect() {},
    dispose() {}
  }),
  /inputInterface as an InterfaceDescriptor/
);

console.log('PASS: V1 sub-connector integrity');
