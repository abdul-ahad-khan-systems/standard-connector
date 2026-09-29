const assert = require('assert');
const { CLASSIFICATIONS } = require('../../src/core/classifications');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');
const { classify } = require('../../src/core/classifier');

function descriptor(options = {}) {
  return new InterfaceDescriptor({
    protocol: options.protocol || 'test.protocol',
    version: options.version || { major: 1, minor: 0, patch: 0 },
    capabilities: options.capabilities || [],
    operations: options.operations || []
  });
}

const identicalTarget = descriptor({
  capabilities: ['read'],
  operations: [{ name: 'read' }]
});

const identicalProvider = descriptor({
  capabilities: ['read'],
  operations: [{ name: 'read' }]
});

assert.strictEqual(
  classify(identicalTarget, identicalProvider),
  CLASSIFICATIONS.DIRECT_MATCH
);

const adapterTarget = descriptor({
  capabilities: ['read'],
  operations: [{ name: 'read' }]
});

const adapterProvider = descriptor({
  capabilities: ['write'],
  operations: [{ name: 'write' }]
});

assert.strictEqual(
  classify(adapterTarget, adapterProvider),
  CLASSIFICATIONS.ADAPTER_REQUIRED,
  'Same protocol and major version with different interface definitions requires an adapter'
);

const subConnectorTarget = descriptor({
  protocol: 'protocol.a'
});

const subConnectorProvider = descriptor({
  protocol: 'protocol.b'
});

assert.strictEqual(
  classify(subConnectorTarget, subConnectorProvider),
  CLASSIFICATIONS.SUB_CONNECTOR_REQUIRED,
  'Different protocols with the same major version require a sub-connector'
);

assert.strictEqual(
  classify(
    descriptor({
      protocol: 'protocol.a',
      version: { major: 1, minor: 0, patch: 0 }
    }),
    descriptor({
      protocol: 'protocol.a',
      version: { major: 2, minor: 0, patch: 0 }
    })
  ),
  CLASSIFICATIONS.INCOMPATIBLE
);

assert.strictEqual(
  classify(
    descriptor({
      protocol: 'protocol.a',
      version: { major: 1, minor: 0, patch: 0 }
    }),
    descriptor({
      protocol: 'protocol.b',
      version: { major: 2, minor: 0, patch: 0 }
    })
  ),
  CLASSIFICATIONS.INCOMPATIBLE
);

assert.throws(
  () => classify({}, descriptor()),
  /valid targetInterface/
);

assert.throws(
  () => classify(descriptor(), {}),
  /valid providerInterface/
);

assert.strictEqual(
  CLASSIFICATIONS.CONNECTOR_MISMATCH,
  'CONNECTOR_MISMATCH',
  'CONNECTOR_MISMATCH remains a frozen classification even though classifier.js reserves it for resolution'
);

console.log('PASS: V1 classifier integrity');
