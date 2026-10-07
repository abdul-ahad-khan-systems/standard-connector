const assert = require('assert');

const InterfaceDescriptor = require('../../../src/core/interfaceDescriptor');
const Request = require('../../../src/core/request');

const DevMeshHostAdapter = require('../../../src/hosts/devmesh/hostAdapter');

(async () => {
  const adapter = new DevMeshHostAdapter({
    repository: '/target/repository',
    role: 'IMPLEMENTER',
    executeToolCall: async (repository, call) => ({
      toolCallId: call.id,
      name: call.name,
      output: `executed ${call.name} in ${repository}`,
      success: true
    })
  });

  const targetInterface = new InterfaceDescriptor({
    protocol: 'devmesh.tool',
    version: { major: 1, minor: 0, patch: 0 },
    capabilities: ['repository-tools'],
    operations: [{ name: 'read_file' }]
  });

  const request = new Request({
    targetInterface,
    operation: 'read_file',
    parameters: {
      path: 'README.md'
    }
  });

  const result = await adapter.execute(request);

  assert.strictEqual(result.status, 'OK');
  assert.strictEqual(result.payload.success, true);
  assert.strictEqual(result.payload.name, 'read_file');
  assert.strictEqual(result.payload.toolCallId, 'devmesh-request-1');

  console.log('PASS: DevMesh host adapter contract');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
