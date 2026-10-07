const { spawn } = require('node:child_process');
const SubConnector = require('../../core/subConnector');
const {
  INPUT_INTERFACE,
  OUTPUT_INTERFACE
} = require('./devmeshSubConnector');

function createDevMeshProcessSubConnector(options = {}) {
  const repository = options.repository;
  const devmeshPath = options.devmeshPath;

  if (!repository) throw new Error('repository is required');
  if (!devmeshPath) throw new Error('devmeshPath is required');

  return new SubConnector({
    inputInterface: INPUT_INTERFACE,
    outputInterface: OUTPUT_INTERFACE,

    connect: async () => {
      const child = spawn(
        'npx',
        ['tsx', 'src/integrations/standard-connector-bridge.ts'],
        {
          cwd: devmeshPath,
          stdio: ['pipe', 'pipe', 'inherit']
        }
      );

      let buffer = '';
      const pending = [];

      child.stdout.on('data', (chunk) => {
        buffer += chunk.toString();

        while (buffer.includes('\n')) {
          const index = buffer.indexOf('\n');
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);

          if (line.trim()) {
            const waiter = pending.shift();
            if (waiter) waiter(JSON.parse(line));
          }
        }
      });

      const execute = (request) => new Promise((resolve, reject) => {
        pending.push(resolve);

        child.stdin.write(JSON.stringify({
          ...request,
          role: request.role || 'IMPLEMENTER'
        }) + '\n');

        setTimeout(() => {
          const index = pending.indexOf(resolve);
          if (index !== -1) {
            pending.splice(index, 1);
            reject(new Error('DevMesh bridge timeout'));
          }
        }, 10000);
      });

      return { child, execute };
    },

    dispose: async (connection) => {
      if (connection && connection.child) {
        connection.child.kill();
      }
    },

    metadata: {
      host: 'devmesh',
      transport: 'local-process'
    }
  });
}

module.exports = { createDevMeshProcessSubConnector };
