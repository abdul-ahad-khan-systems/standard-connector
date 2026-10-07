const Result = require('../../core/result');

class DevMeshHostAdapter {
  constructor(options = {}) {
    if (!options.repository || typeof options.repository !== 'string') {
      throw new Error('DevMesh host adapter requires a repository');
    }

    if (!options.role || typeof options.role !== 'string') {
      throw new Error('DevMesh host adapter requires a role');
    }

    if (typeof options.executeToolCall !== 'function') {
      throw new Error('DevMesh host adapter requires an executeToolCall function');
    }

    this.repository = options.repository;
    this.role = options.role;
    this.executeToolCall = options.executeToolCall;
  }

  async execute(request) {
    if (!request || typeof request.operation !== 'string') {
      return new Result({
        status: 'ERROR',
        payload: null,
        metadata: {
          error: {
            code: 'INVALID_REQUEST',
            category: 'VALIDATION',
            message: 'DevMesh host adapter requires a valid operation.',
            recoverable: false
          }
        }
      });
    }

    const call = {
      id: 'devmesh-request-1',
      name: request.operation,
      arguments:
        request.parameters &&
        typeof request.parameters === 'object' &&
        !Array.isArray(request.parameters)
          ? request.parameters
          : {}
    };

    const toolResult = await this.executeToolCall(
      this.repository,
      call
    );

    return new Result({
      status: toolResult.success ? 'OK' : 'ERROR',
      payload: toolResult,
      metadata: {
        host: 'devmesh',
        role: this.role
      }
    });
  }
}

module.exports = DevMeshHostAdapter;
