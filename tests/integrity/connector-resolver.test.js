const assert = require('assert');
const ConnectorResolver = require('../../src/subconnectors/connectorResolver');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');

function descriptor(protocol, major, minor = 0, patch = 0) {
  return new InterfaceDescriptor({
    protocol,
    version: { major, minor, patch }
  });
}

const target = descriptor('resolver.test', 1, 0);

const candidateB = {
  interface: descriptor('resolver.test', 1, 2),
  connector: { id: 'B' },
  metadata: { id: 'B' }
};

const candidateA = {
  interface: descriptor('resolver.test', 1, 1),
  connector: { id: 'A' },
  metadata: { id: 'A' }
};

// Compatible candidates are selected deterministically.
const resolver = new ConnectorResolver([candidateB, candidateA]);

assert.strictEqual(
  resolver.resolve(target).connector.id,
  'A',
  'connector selection must be deterministic'
);

// Incompatible protocol/major candidates are rejected.
const incompatible = new ConnectorResolver([
  {
    interface: descriptor('other.protocol', 1, 0),
    connector: { id: 'wrong-protocol' }
  },
  {
    interface: descriptor('resolver.test', 2, 0),
    connector: { id: 'wrong-major' }
  }
]);

assert.strictEqual(
  incompatible.resolve(target),
  null,
  'incompatible connector candidates must not resolve'
);

// Empty candidate set rejects deterministically.
assert.strictEqual(
  new ConnectorResolver([]).resolve(target),
  null,
  'no candidates must resolve to null'
);

// Invalid target is rejected deterministically.
assert.throws(
  () => resolver.resolve({}),
  /targetInterface as InterfaceDescriptor/
);

// Invalid candidate records are ignored rather than becoming resolutions.
const malformed = new ConnectorResolver([
  null,
  {},
  { interface: target },
  { connector: { id: 'missing-interface' } }
]);

assert.strictEqual(
  malformed.resolve(target),
  null,
  'malformed candidates must not resolve'
);


// Connector resolver failures are surfaced as normalized resolution errors.
const resolverFailure = {
  resolve() {
    throw new Error('resolver backend unavailable');
  }
};

const Request = require('../../src/core/request');
const { resolve } = require('../../src/core/resolver');

const failureTarget = descriptor('resolver.failure.target', 1, 0);
const failureProvider = descriptor('resolver.failure.provider', 1, 0);

const failureRequest = new Request({
  targetInterface: failureTarget,
  operation: 'test',
  parameters: {}
});

assert.throws(
  () => resolve(
    failureRequest,
    [],
    [],
    [],
    failureProvider,
    undefined,
    resolverFailure
  ),
  err => (
    err &&
    err.code === 'CONNECTOR_RESOLUTION_FAILURE' &&
    err.category === 'RESOLUTION' &&
    err.recoverable === false &&
    err.cause instanceof Error &&
    err.cause.message === 'resolver backend unavailable'
  ),
  'connector-resolution failures must use the normalized RESOLUTION error contract'
);

console.log('PASS: connector-resolution failure normalization contract');

console.log('PASS: V1 connector resolver integrity');
