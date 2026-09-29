const assert = require('assert');

const StandardConnector = require('../../src/core/connector');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');
const Request = require('../../src/core/request');
const SubConnector = require('../../src/core/subConnector');

function descriptor(protocol) {
  return new InterfaceDescriptor({
    protocol,
    version: { major: 1, minor: 0, patch: 0 },
    capabilities: ['test'],
    operations: [{ name: 'test' }]
  });
}

const target = descriptor('sub.failure.target');
const provider = descriptor('sub.failure.provider');

const request = new Request({
  targetInterface: target,
  operation: 'test'
});

const failingSubConnector = new SubConnector({
  inputInterface: target,
  outputInterface: provider,

  connect() {
    throw new Error('sub-connector exploded');
  },

  dispose() {}
});

(async () => {
  const connector = new StandardConnector({
    subConnectors: [failingSubConnector]
  });

  connector.start();

  const result = await connector.handleRequest(request, provider);

  assert.strictEqual(result.status, 'ERROR');
  assert.strictEqual(result.metadata.error.code, 'SUB_CONNECTOR_FAILURE');
  assert.strictEqual(result.metadata.error.category, 'SUB_CONNECTOR');

  console.log('PASS: sub-connector failure normalization contract');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
