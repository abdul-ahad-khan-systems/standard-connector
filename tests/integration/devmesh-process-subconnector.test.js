const assert = require('node:assert/strict');
const {
  createDevMeshProcessSubConnector
} = require('../../src/subconnectors/devmesh/devmeshProcessSubConnector');

(async () => {
  const connector = createDevMeshProcessSubConnector({
    repository: '/home/kali/Projects/devmesh-v0.1',
    devmeshPath: '/home/kali/Projects/devmesh-v0.1'
  });

  const connection = await connector.connect();

  const response = await connection.execute({
    id: 'integration-001',
    role: 'IMPLEMENTER',
    name: 'list_files',
    arguments: { path: '.' }
  });

  assert.equal(response.gate.allowed, true);
  assert.equal(response.result.success, true);
  assert.equal(response.result.name, 'list_files');
  assert.match(response.result.output, /README\.md/);
  assert.match(response.result.output, /src/);

  await connector.dispose(connection);

  console.log('PASS: Real SC → DevMesh process integration');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
