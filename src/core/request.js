// Request Contract
// A normalized, validated object describing a request to an external capability

const Protocol = require('./protocol');

class Request {
  /**
   * @param {Object} options
   * @param {InterfaceDescriptor} options.targetInterface - The interface descriptor of the target capability
   * @param {string} options.operation - The operation to perform
   * @param {*} [options.parameters] - Parameters for the operation (opaque to Core)
   * @param {Object} [options.auth] - Authentication references (opaque to Core)
   * @param {Object} [options.scope] - Scope references (opaque to Core)
   * @param {*} [options.callerIdentity] - Caller identity (opaque to Core)
   */
  constructor(options) {
    if (!options || !options.targetInterface) {
      throw new Error('Request must specify a targetInterface');
    }
    if (!options.operation || typeof options.operation !== 'string') {
      throw new Error('Request must specify a string operation');
    }

    // Validate that targetInterface is an InterfaceDescriptor (we'll assume it's an object with required properties)
    // In a more robust system, we might have instanceof checks, but for now we rely on duck typing.

    this.targetInterface = options.targetInterface;
    this.operation = options.operation;
    this.parameters = options.parameters !== undefined ? options.parameters : null;
    this.auth = options.auth !== undefined ? options.auth : null;
    this.scope = options.scope !== undefined ? options.scope : null;
    this.callerIdentity = options.callerIdentity !== undefined ? options.callerIdentity : null;
  }
}

module.exports = Request;