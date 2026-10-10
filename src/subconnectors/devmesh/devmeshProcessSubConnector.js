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
      let closed = false;
      const pending = new Map();

      function settle(id, error, response) {
        const entry = pending.get(id);
        if (!entry) return;

        pending.delete(id);
        clearTimeout(entry.timer);

        if (error) entry.reject(error);
        else entry.resolve(response);
      }

      function failAll(error) {
        if (closed) return;
        closed = true;

        for (const [id] of pending) {
          settle(id, error);
        }
      }

      child.stdout.on('data', (chunk) => {
        buffer += chunk.toString();

        while (buffer.includes('\n')) {
          const index = buffer.indexOf('\n');
          const line = buffer.slice(0, index);
          buffer = buffer.slice(index + 1);

          if (!line.trim()) continue;

          let response;
          try {
            response = JSON.parse(line);
          } catch {
            const error = new Error(
              'Invalid JSON received from DevMesh bridge'
            );
            failAll(error);
            child.kill();
            return;
          }

          if (
            !response ||
            typeof response.requestId !== 'string'
          ) {
            const error = new Error(
              'DevMesh bridge response has no valid requestId'
            );
            failAll(error);
            child.kill();
            return;
          }

          settle(response.requestId, null, response);
        }
      });

      child.on('error', (error) => {
        failAll(new Error(`DevMesh process error: ${error.message}`));
      });

      child.on('exit', (code, signal) => {
        failAll(
          new Error(
            `DevMesh bridge exited (code=${code}, signal=${signal})`
          )
        );
      });

      child.stdin.on('error', (error) => {
        failAll(new Error(`DevMesh stdin error: ${error.message}`));
      });

      const execute = (request) => new Promise((resolve, reject) => {
        if (closed || child.exitCode !== null || child.signalCode !== null) {
          reject(new Error('DevMesh bridge is not running'));
          return;
        }

        if (!request || typeof request.id !== 'string' || !request.id) {
          reject(new Error('A non-empty string request.id is required'));
          return;
        }

        if (pending.has(request.id)) {
          reject(new Error(`Duplicate active request ID: ${request.id}`));
          return;
        }

        const timer = setTimeout(() => {
          settle(request.id, new Error('DevMesh bridge timeout'));
        }, 10000);

        pending.set(request.id, { resolve, reject, timer });

        try {
          child.stdin.write(
            JSON.stringify({
              ...request,
              role: request.role || 'IMPLEMENTER'
            }) + '\n',
            (error) => {
              if (error) {
                settle(
                  request.id,
                  new Error(`Failed to write to DevMesh bridge: ${error.message}`)
                );
              }
            }
          );
        } catch (error) {
          settle(request.id, error);
        }
      });
      return {
        child,
        execute,
        close: () => {
          failAll(new Error('DevMesh connector disposed'));
          child.kill();
        }
      };
    },

    dispose: async (connection) => {
      if (!connection) return;

      if (typeof connection.close === 'function') {
        connection.close();
      } else if (connection.child) {
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
