const assert = require('assert');
const InterfaceDescriptor = require('../../src/core/interfaceDescriptor');

const descriptor = new InterfaceDescriptor({
  protocol: 'test.protocol',
  version: {
    major: 1,
    minor: 2,
    patch: 3
  },
  capabilities: [
    'beta',
    'alpha'
  ],
  operations: [
    { name: 'write', input: 'x', output: 'y' },
    { name: 'read', input: 'x', output: 'y' }
  ]
});

assert.strictEqual(descriptor.protocol, 'test.protocol');

assert.deepStrictEqual(descriptor.version, {
  major: 1,
  minor: 2,
  patch: 3
});

assert.deepStrictEqual(
  descriptor.capabilities,
  ['beta', 'alpha']
);

assert.ok(Array.isArray(descriptor.operations));

assert.strictEqual(
  descriptor.isCompatibleWith(
    new InterfaceDescriptor({
      protocol: 'test.protocol',
      version: { major: 1, minor: 9, patch: 9 }
    })
  ),
  true,
  'Same protocol and major version must be compatible'
);

assert.strictEqual(
  descriptor.isCompatibleWith(
    new InterfaceDescriptor({
      protocol: 'test.protocol',
      version: { major: 2, minor: 0, patch: 0 }
    })
  ),
  false,
  'Different major versions must be incompatible'
);

assert.strictEqual(
  descriptor.isCompatibleWith(
    new InterfaceDescriptor({
      protocol: 'other.protocol',
      version: { major: 1, minor: 0, patch: 0 }
    })
  ),
  false,
  'Different protocols must be incompatible'
);

const reordered = new InterfaceDescriptor({
  protocol: 'test.protocol',
  version: { major: 1, minor: 2, patch: 3 },
  capabilities: [
    'alpha',
    'beta'
  ],
  operations: [
    { name: 'read', input: 'x', output: 'y' },
    { name: 'write', input: 'x', output: 'y' }
  ]
});

assert.strictEqual(
  descriptor.toKey(),
  reordered.toKey(),
  'Interface keys must be deterministic regardless of capability/operation ordering'
);

assert.throws(
  () => new InterfaceDescriptor({
    version: { major: 1, minor: 0, patch: 0 }
  }),
  /must specify a string protocol/
);

assert.throws(
  () => new InterfaceDescriptor({
    protocol: 'test.protocol'
  }),
  /must specify a version object/
);

assert.throws(
  () => new InterfaceDescriptor({
    protocol: 'test.protocol',
    version: { major: 1, minor: 0 }
  }),
  /must have major, minor, patch numbers/
);

assert.strictEqual(
  descriptor.isCompatibleWith({ protocol: 'test.protocol', version: { major: 1 } }),
  false,
  'Compatibility must reject non-InterfaceDescriptor values'
);

console.log('PASS: V1 InterfaceDescriptor integrity');
