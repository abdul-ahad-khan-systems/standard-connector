const assert = require('assert');

const StandardConnector = require('../../src/core/connector');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');
const Request = require('../../src/core/request');
const Adapter = require('../../src/core/adapter');

function descriptor(protocol, version) {
  return new InterfaceDescriptor({
    protocol,
    version,
    capabilities: ['test'],
    operations: [{ name: 'test' }]
  });
}

const target = descriptor(
  'failure.protocol',
  { major: 1, minor: 0, patch: 0 }
);

const provider = descriptor(
  'failure.protocol',
  { major: 1, minor: 1, patch: 0 }
);

const request = new Request({
  targetInterface: target,
  operation: 'test'
});

const failingAdapter = new Adapter({
  inputInterface: target,
  outputInterface: provider,

  adaptRequest() {
    throw new Error('adapter exploded');
  },

  adaptResult(result) {
    return result;
  }
});

(async () => {
  const connector = new StandardConnector({
    adapters: [failingAdapter]
  });

  connector.start();

  const result = await connector.handleRequest(request, provider);

  assert.strictEqual(result.status, 'ERROR');
  assert.strictEqual(result.metadata.error.code, 'ADAPTER_FAILURE');
  assert.strictEqual(result.metadata.error.category, 'ADAPTER');

  console.log('PASS: adapter failure normalization contract');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
