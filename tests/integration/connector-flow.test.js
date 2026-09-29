const assert = require('assert');

const StandardConnector = require('../../src/core/connector');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');
const Request = require('../../src/core/request');
const Adapter = require('../../src/core/adapter');

function descriptor(protocol, version, capabilities = [], operations = []) {
  return new InterfaceDescriptor({
    protocol,
    version,
    capabilities,
    operations
  });
}

function requestFor(targetInterface) {
  return new Request({
    targetInterface,
    operation: 'read',
    parameters: { id: 1 }
  });
}

(async () => {
  const connector = new StandardConnector();

  const target = descriptor(
    'flow.protocol',
    { major: 1, minor: 0, patch: 0 },
    ['read'],
    [{ name: 'read' }]
  );

  const provider = descriptor(
    'flow.protocol',
    { major: 1, minor: 0, patch: 0 },
    ['read'],
    [{ name: 'read' }]
  );

  // Connector must reject requests before it is started.
  const notReady = await connector.handleRequest(
    requestFor(target),
    provider
  );

  assert.strictEqual(notReady.status, 'ERROR');
  assert.strictEqual(
    notReady.metadata.error.code,
    'CONNECTOR_NOT_READY'
  );
  assert.strictEqual(
    notReady.metadata.error.category,
    'LIFECYCLE'
  );

  connector.start();

  assert.strictEqual(
    connector.getState(),
    'ACTIVE'
  );

  const direct = await connector.handleRequest(
    requestFor(target),
    provider
  );

  assert.strictEqual(direct.status, 'OK');
  assert.strictEqual(
    direct.metadata.classification,
    'DIRECT_MATCH'
  );
  assert.strictEqual(
    direct.metadata.resolutionType,
    'DIRECT'
  );

  // Adapter path.
  const adapterTarget = descriptor(
    'adapter.flow',
    { major: 1, minor: 0, patch: 0 }
  );

  const adapterProvider = descriptor(
    'adapter.flow',
    { major: 1, minor: 1, patch: 0 }
  );

  let adaptationCalls = 0;

  const adapter = new Adapter({
    inputInterface: adapterTarget,
    outputInterface: adapterProvider,

    adaptRequest(request) {
      adaptationCalls += 1;
      return {
        ...request,
        adapted: true
      };
    },

    adaptResult(result) {
      return result;
    }
  });

  connector.registerAdapter(adapter);

  const adapted = await connector.handleRequest(
    requestFor(adapterTarget),
    adapterProvider
  );

  assert.strictEqual(adapted.status, 'OK');
  assert.strictEqual(
    adapted.metadata.classification,
    'ADAPTER_REQUIRED'
  );
  assert.strictEqual(
    adapted.metadata.resolutionType,
    'ADAPTER'
  );
  assert.strictEqual(adaptationCalls, 1);

  // Multi-step adapter chain.
  const chainTarget = descriptor(
    'chain.flow.target',
    { major: 1, minor: 0, patch: 0 }
  );

  const chainIntermediate = descriptor(
    'chain.flow.intermediate',
    { major: 1, minor: 0, patch: 0 }
  );

  const chainProvider = descriptor(
    'chain.flow.provider',
    { major: 1, minor: 0, patch: 0 }
  );

  let firstAdapterCalls = 0;
  let secondAdapterCalls = 0;

  const firstChainAdapter = new Adapter({
    inputInterface: chainTarget,
    outputInterface: chainIntermediate,

    adaptRequest(request) {
      firstAdapterCalls += 1;
      return {
        ...request,
        targetInterface: chainIntermediate
      };
    },

    adaptResult(result) {
      return result;
    }
  });

  const secondChainAdapter = new Adapter({
    inputInterface: chainIntermediate,
    outputInterface: chainProvider,

    adaptRequest(request) {
      secondAdapterCalls += 1;
      return {
        ...request,
        targetInterface: chainProvider
      };
    },

    adaptResult(result) {
      return result;
    }
  });

  connector.registerAdapter(firstChainAdapter);
  connector.registerAdapter(secondChainAdapter);

  const chained = await connector.handleRequest(
    requestFor(chainTarget),
    chainProvider
  );

  assert.strictEqual(chained.status, 'OK');
  assert.strictEqual(
    chained.metadata.classification,
    'SUB_CONNECTOR_REQUIRED'
  );
  assert.strictEqual(
    chained.metadata.resolutionType,
    'CHAIN'
  );
  assert.strictEqual(firstAdapterCalls, 1);
  assert.strictEqual(secondAdapterCalls, 1);

  // No candidate must reject deterministically.
  const missingTarget = descriptor(
    'missing.flow',
    { major: 1, minor: 0, patch: 0 }
  );

  const missingProvider = descriptor(
    'missing.flow',
    { major: 1, minor: 1, patch: 0 }
  );

  const rejected = await connector.handleRequest(
    requestFor(missingTarget),
    missingProvider
  );

  assert.strictEqual(rejected.status, 'ERROR');
  assert.strictEqual(
    rejected.metadata.error.code,
    'RESOLUTION_NO_CANDIDATE'
  );
  assert.strictEqual(
    rejected.metadata.error.category,
    'RESOLUTION'
  );

  connector.stop();

  assert.strictEqual(
    connector.getState(),
    'STOPPED'
  );

  console.log('PASS: V1 connector integration flow');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
