const assert = require('assert');
const Plugin = require('../../src/core/plugin');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');

const pluginInterface = new InterfaceDescriptor({
  protocol: 'plugin.protocol',
  version: { major: 1, minor: 0, patch: 0 },
  capabilities: ['read', 'write']
});

const calls = [];

const lifecycle = {
  register() {
    calls.push('register');
  },
  initialize() {
    calls.push('initialize');
  },
  start() {
    calls.push('start');
  },
  stop() {
    calls.push('stop');
  },
  unload() {
    calls.push('unload');
  }
};

const plugin = new Plugin({
  identity: 'test.plugin',
  version: { major: 1, minor: 2, patch: 3 },
  capabilities: ['read', 'write'],
  operations: [
    { name: 'read' },
    { name: 'write' }
  ],
  interface: pluginInterface,
  lifecycle,
  metadata: {
    source: 'integrity-test'
  }
});

assert.strictEqual(plugin.getIdentity(), 'test.plugin');
assert.deepStrictEqual(plugin.getVersion(), {
  major: 1,
  minor: 2,
  patch: 3
});
assert.deepStrictEqual(plugin.getCapabilities(), ['read', 'write']);
assert.deepStrictEqual(plugin.getOperations(), [
  { name: 'read' },
  { name: 'write' }
]);
assert.strictEqual(plugin.getInterface(), pluginInterface);
assert.strictEqual(plugin.getLifecycle(), lifecycle);
assert.deepStrictEqual(plugin.metadata, {
  source: 'integrity-test'
});

plugin.getLifecycle().register();
plugin.getLifecycle().initialize();
plugin.getLifecycle().start();
plugin.getLifecycle().stop();
plugin.getLifecycle().unload();

assert.deepStrictEqual(calls, [
  'register',
  'initialize',
  'start',
  'stop',
  'unload'
]);

assert.throws(
  () => new Plugin({
    version: { major: 1, minor: 0, patch: 0 },
    capabilities: [],
    operations: [],
    interface: pluginInterface,
    lifecycle
  }),
  /must specify a string identity/
);

assert.throws(
  () => new Plugin({
    identity: 'test.plugin',
    capabilities: [],
    operations: [],
    interface: pluginInterface,
    lifecycle
  }),
  /must specify a version object/
);

assert.throws(
  () => new Plugin({
    identity: 'test.plugin',
    version: { major: 1, minor: 0 },
    capabilities: [],
    operations: [],
    interface: pluginInterface,
    lifecycle
  }),
  /must have major, minor, patch numbers/
);

assert.throws(
  () => new Plugin({
    identity: 'test.plugin',
    version: { major: 1, minor: 0, patch: 0 },
    operations: [],
    interface: pluginInterface,
    lifecycle
  }),
  /must specify an array of capabilities/
);

assert.throws(
  () => new Plugin({
    identity: 'test.plugin',
    version: { major: 1, minor: 0, patch: 0 },
    capabilities: [],
    interface: pluginInterface,
    lifecycle
  }),
  /must specify an array of operations/
);

assert.throws(
  () => new Plugin({
    identity: 'test.plugin',
    version: { major: 1, minor: 0, patch: 0 },
    capabilities: [],
    operations: [],
    interface: {},
    lifecycle
  }),
  /must specify an InterfaceDescriptor/
);

assert.throws(
  () => new Plugin({
    identity: 'test.plugin',
    version: { major: 1, minor: 0, patch: 0 },
    capabilities: [],
    operations: [],
    interface: pluginInterface
  }),
  /must specify a lifecycle object/
);

for (const method of ['register', 'initialize', 'start', 'stop', 'unload']) {
  const incompleteLifecycle = { ...lifecycle };
  delete incompleteLifecycle[method];

  assert.throws(
    () => new Plugin({
      identity: 'test.plugin',
      version: { major: 1, minor: 0, patch: 0 },
      capabilities: [],
      operations: [],
      interface: pluginInterface,
      lifecycle: incompleteLifecycle
    }),
    new RegExp(`lifecycle must provide a ${method} function`)
  );
}

console.log('PASS: V1 plugin integrity');
