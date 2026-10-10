const assert = require('node:assert/strict');
const {
  createDevMeshProcessSubConnector
} = require('../../src/subconnectors/devmesh/devmeshProcessSubConnector');

(async () => {
  const connector = createDevMeshProcessSubConnector({
    repository: '/home/kali/Projects/devmesh-v0.1',
    devmeshPath: '/home/kali/Projects/devmesh-v0.1'
  });

  let connection;

  try {
    connection = await connector.connect();

    const requests = [
      {
        id: 'integration-list-001',
        role: 'IMPLEMENTER',
        name: 'list_files',
        arguments: { path: '.' }
      },
      {
        id: 'integration-list-002',
        role: 'IMPLEMENTER',
        name: 'list_files',
        arguments: { path: 'src' }
      },
      {
        id: 'integration-list-003',
        role: 'IMPLEMENTER',
        name: 'list_files',
        arguments: { path: 'tests' }
      }
    ];

    const responses = await Promise.all(
      requests.map((request) => connection.execute(request))
    );

    assert.equal(responses.length, requests.length);

    for (let i = 0; i < requests.length; i++) {
      assert.equal(
        responses[i].requestId,
        requests[i].id,
        `Response ${i} must match its request ID`
      );
      assert.equal(responses[i].gate.allowed, true);
      assert.equal(responses[i].result.success, true);
      assert.equal(responses[i].result.name, 'list_files');
    }

    assert.match(responses[0].result.output, /README\.md/);
    assert.match(responses[1].result.output, /integrations/);
    assert.match(responses[2].result.output, /integration/);
         const denied = await connection.execute({
      id: 'integration-denied-001',
      role: 'IMPLEMENTER',
      name: 'not_a_real_tool',
      arguments: {}
    });

    assert.equal(denied.requestId, 'integration-denied-001');
    assert.equal(denied.gate.allowed, false);
    assert.equal(denied.result.success, false);
    assert.match(denied.gate.reason, /Unknown or unsupported tool/);

    console.log('PASS: ToolGate denial through live SC → DevMesh process');
    const pendingRequest = connection.execute({
      id: 'integration-dispose-001',
      role: 'IMPLEMENTER',
      name: 'list_files',
      arguments: { path: '.' }
    });

    await connector.dispose(connection);
    connection = null;

    await assert.rejects(
      pendingRequest,
      /DevMesh connector disposed/
    );

    console.log('PASS: Pending request rejected on disposal');
    console.log('PASS: Concurrent SC → DevMesh request correlation');
  } finally {
    if (connection) {
      await connector.dispose(connection);
    }
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
