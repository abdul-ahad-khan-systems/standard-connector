const assert = require('node:assert/strict');

const DevMeshHostAdapter = require('../../../src/hosts/devmesh/hostAdapter');
const {
  createDevMeshProcessSubConnector
} = require('../../../src/subconnectors/devmesh/devmeshProcessSubConnector');

(async () => {
  const repository = '/home/kali/Projects/devmesh-v0.1';

  const subConnector = createDevMeshProcessSubConnector({
    repository,
    devmeshPath: repository
  });

  let connection;

  try {
    connection = await subConnector.connect();

    const adapter = new DevMeshHostAdapter({
      repository,
      role: 'IMPLEMENTER',
      executeToolCall: async (_repository, call) => {
        const response = await connection.execute({
          id: call.id,
          role: 'IMPLEMENTER',
          name: call.name,
          arguments: call.arguments
        });

        return {
          ...response.result,
          success: response.gate.allowed && response.result.success
        };
      }
    });

    const result = await adapter.execute({
      operation: 'list_files',
      parameters: { path: '.' }
    });

    assert.equal(result.status, 'OK');
    assert.equal(result.payload.success, true);
    assert.equal(result.payload.name, 'list_files');
    assert.match(result.payload.output, /README\.md/);

    console.log('PASS: Real host adapter → SC process connector → DevMesh');
    console.log('PASS: Read-only list_files executed through ToolGate');
  } finally {
    if (connection) await subConnector.dispose(connection);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
