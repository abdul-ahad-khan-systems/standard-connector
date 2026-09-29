const assert = require('assert');

const { resolve, ResolutionContext } = require('../../src/core/resolver');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');
const Request = require('../../src/core/request');
const Adapter = require('../../src/core/adapter');
const SubConnector = require('../../src/core/subConnector');
const Plugin = require('../../src/core/plugin');

function descriptor(protocol, version = { major: 1, minor: 0, patch: 0 }, capabilities = [], operations = []) {
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
    operation: 'test'
  });
}

const directInterface = descriptor(
  'direct.protocol',
  { major: 1, minor: 0, patch: 0 },
  ['read'],
  [{ name: 'read' }]
);

const directResult = resolve(
  requestFor(directInterface),
  [],
  [],
  [],
  descriptor(
    'direct.protocol',
    { major: 1, minor: 0, patch: 0 },
    ['read'],
    [{ name: 'read' }]
  )
);

assert.strictEqual(directResult.type, 'DIRECT');
assert.ok(directResult.providerInterface);

const adapterTarget = descriptor('adapter.protocol', { major: 1, minor: 0, patch: 0 });
const adapterProvider = descriptor('adapter.protocol', { major: 1, minor: 1, patch: 0 });

const adapter = new Adapter({
  inputInterface: adapterTarget,
  outputInterface: adapterProvider,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const adapterResult = resolve(
  requestFor(adapterTarget),
  [adapter],
  [],
  [],
  adapterProvider
);

assert.strictEqual(adapterResult.type, 'ADAPTER');
assert.strictEqual(adapterResult.adapter, adapter);
assert.strictEqual(adapterResult.adaptedTargetInterface, adapterProvider);
assert.strictEqual(adapterResult.providerInterface, adapterProvider);

const subTarget = descriptor('sub.protocol.a');
const subProvider = descriptor('sub.protocol.b');

const subConnector = new SubConnector({
  inputInterface: subTarget,
  outputInterface: subProvider,
  connect() {
    return { connected: true };
  },
  dispose() {}
});

const subResult = resolve(
  requestFor(subTarget),
  [],
  [subConnector],
  [],
  subProvider
);

assert.strictEqual(subResult.type, 'SUB_CONNECTOR');
assert.strictEqual(subResult.subConnector, subConnector);
assert.strictEqual(subResult.adaptedTargetInterface, subProvider);
assert.strictEqual(subResult.providerInterface, subProvider);

const incompatibleTarget = descriptor(
  'incompatible.protocol',
  { major: 1, minor: 0, patch: 0 }
);

const incompatibleProvider = descriptor(
  'incompatible.protocol',
  { major: 2, minor: 0, patch: 0 }
);

assert.strictEqual(
  resolve(
    requestFor(incompatibleTarget),
    [],
    [],
    [],
    incompatibleProvider
  ),
  null
);

const noAdapterTarget = descriptor('no.adapter.protocol');
const noAdapterProvider = descriptor(
  'no.adapter.protocol',
  { major: 1, minor: 1, patch: 0 }
);

assert.strictEqual(
  resolve(
    requestFor(noAdapterTarget),
    [],
    [],
    [],
    noAdapterProvider
  ),
  null
);

const noSubConnectorTarget = descriptor('no.sub.protocol.a');
const noSubConnectorProvider = descriptor('no.sub.protocol.b');

assert.strictEqual(
  resolve(
    requestFor(noSubConnectorTarget),
    [],
    [],
    [],
    noSubConnectorProvider
  ),
  null
);

assert.throws(
  () => resolve(null, [], [], [], directInterface),
  /valid request with targetInterface/
);

assert.throws(
  () => resolve(
    requestFor(directInterface),
    [],
    [],
    [],
    {}
  ),
  /valid providerInterface/
);

const context = new ResolutionContext(1);

assert.strictEqual(
  context.enter(directInterface, directInterface),
  true
);

assert.strictEqual(
  context.enter(directInterface, directInterface),
  false,
  'Repeated resolution state must be rejected as a cycle'
);

context.leave();

const depthContext = new ResolutionContext(1);

assert.strictEqual(
  depthContext.enter(directInterface, directInterface),
  true
);

assert.strictEqual(
  depthContext.enter(
    descriptor('another.protocol'),
    directInterface
  ),
  false,
  'Resolution depth must be bounded'
);


const chainTarget = descriptor(
  'chain.protocol.target',
  { major: 1, minor: 0, patch: 0 }
);

const chainIntermediate = descriptor(
  'chain.protocol.intermediate',
  { major: 1, minor: 0, patch: 0 }
);

const chainProvider = descriptor(
  'chain.protocol.provider',
  { major: 1, minor: 0, patch: 0 }
);

const adapterOne = new Adapter({
  inputInterface: chainTarget,
  outputInterface: chainIntermediate,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const adapterTwo = new Adapter({
  inputInterface: chainIntermediate,
  outputInterface: chainProvider,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const chainResult = resolve(
  requestFor(chainTarget),
  [adapterOne, adapterTwo],
  [],
  [],
  chainProvider
);

assert.strictEqual(chainResult.type, 'CHAIN');
assert.strictEqual(chainResult.providerInterface, chainProvider);
assert.strictEqual(chainResult.steps.length, 2);
assert.strictEqual(chainResult.steps[0].type, 'ADAPTER');
assert.strictEqual(chainResult.steps[0].adapter, adapterOne);
assert.strictEqual(chainResult.steps[1].type, 'ADAPTER');
assert.strictEqual(chainResult.steps[1].adapter, adapterTwo);


const boundedTarget = descriptor('bounded.target');
const boundedProvider = descriptor('bounded.provider');

const bounded1 = descriptor('bounded.1');
const bounded2 = descriptor('bounded.2');

const boundedAdapter1 = new Adapter({
  inputInterface: boundedTarget,
  outputInterface: bounded1,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const boundedAdapter2 = new Adapter({
  inputInterface: bounded1,
  outputInterface: bounded2,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const boundedAdapter3 = new Adapter({
  inputInterface: bounded2,
  outputInterface: boundedProvider,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const boundedResult = resolve(
  requestFor(boundedTarget),
  [boundedAdapter1, boundedAdapter2, boundedAdapter3],
  [],
  [],
  boundedProvider,
  new ResolutionContext(2)
);

assert.strictEqual(
  boundedResult,
  null,
  'Resolution must reject a chain that exceeds the configured maximum depth'
);


const deterministicTarget = descriptor('deterministic.target');
const deterministicIntermediateA = descriptor('deterministic.a');
const deterministicIntermediateB = descriptor('deterministic.b');
const deterministicProvider = descriptor('deterministic.provider');

const deterministicAdapterA = new Adapter({
  inputInterface: deterministicTarget,
  outputInterface: deterministicIntermediateA,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const deterministicAdapterB = new Adapter({
  inputInterface: deterministicTarget,
  outputInterface: deterministicIntermediateB,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const deterministicFinalA = new Adapter({
  inputInterface: deterministicIntermediateA,
  outputInterface: deterministicProvider,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const deterministicFinalB = new Adapter({
  inputInterface: deterministicIntermediateB,
  outputInterface: deterministicProvider,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const deterministicResult = resolve(
  requestFor(deterministicTarget),
  [
    deterministicAdapterB,
    deterministicAdapterA,
    deterministicFinalB,
    deterministicFinalA
  ],
  [],
  [],
  deterministicProvider
);

assert.strictEqual(
  deterministicResult.type,
  'CHAIN'
);

assert.strictEqual(
  deterministicResult.steps[0].adapter,
  deterministicAdapterA,
  'Candidate selection must use a deterministic ordering policy'
);

assert.strictEqual(
  deterministicResult.steps[1].adapter,
  deterministicFinalA
);




const recheckTarget = descriptor('recheck.target');
const recheckIntermediate = descriptor('recheck.intermediate');
const recheckProvider = descriptor('recheck.provider');

const recheckAdapterOne = new Adapter({
  inputInterface: recheckTarget,
  outputInterface: recheckIntermediate,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const recheckAdapterTwo = new Adapter({
  inputInterface: recheckIntermediate,
  outputInterface: recheckProvider,
  adaptRequest(request) {
    return request;
  },
  adaptResult(result) {
    return result;
  }
});

const originalCompatibility = recheckIntermediate.isCompatibleWith;
let compatibilityChecks = 0;

recheckIntermediate.isCompatibleWith = function(other) {
  compatibilityChecks++;
  return originalCompatibility.call(this, other);
};

const recheckChainResult = resolve(
  requestFor(recheckTarget),
  [recheckAdapterOne, recheckAdapterTwo],
  [],
  [],
  recheckProvider
);

assert.strictEqual(recheckChainResult.type, 'CHAIN');
assert.ok(
  compatibilityChecks > 0,
  'Each transformed interface must participate in a fresh compatibility check'
);

console.log('PASS: transformation compatibility recheck contract');

console.log('PASS: deterministic candidate-selection contract');

console.log('PASS: resolver depth enforcement contract');

console.log('PASS: multi-step adapter resolution contract');

console.log('PASS: V1 resolver integrity');
