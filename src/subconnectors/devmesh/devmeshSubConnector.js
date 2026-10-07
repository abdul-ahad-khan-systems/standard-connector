const SubConnector = require('../../core/subConnector');
const InterfaceDescriptor = require('../../core/interfaceDescriptor');

const INPUT_INTERFACE = new InterfaceDescriptor({
  protocol: 'devmesh.tool',
  version: { major: 1, minor: 0, patch: 0 },
  capabilities: ['tool-execution'],
  operations: ['execute']
});

const OUTPUT_INTERFACE = new InterfaceDescriptor({
  protocol: 'devmesh.tool.result',
  version: { major: 1, minor: 0, patch: 0 },
  capabilities: ['tool-result'],
  operations: ['execute']
});

function createDevMeshSubConnector(options = {}) {
  if (typeof options.execute !== 'function') {
    throw new Error('DevMesh SubConnector requires an execute function');
  }

  return new SubConnector({
    inputInterface: INPUT_INTERFACE,
    outputInterface: OUTPUT_INTERFACE,

    connect: async () => ({
      execute: options.execute
    }),

    dispose: async () => {},

    metadata: {
      host: 'devmesh',
      transport: 'local'
    }
  });
}

module.exports = {
  createDevMeshSubConnector,
  INPUT_INTERFACE,
  OUTPUT_INTERFACE
};
