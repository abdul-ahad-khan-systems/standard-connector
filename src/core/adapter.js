// Adapter Contract
// Defines the shape of an adapter that can be used by the Standard Connector Core to translate between interfaces

const InterfaceDescriptor = require('./interfaceDescriptor');

/**
 * An adapter translates between two InterfaceDescriptor instances.
 * Adapters are external to Core but must adhere to this contract.
 */
class Adapter {
  /**
   * @param {Object} options
   * @param {InterfaceDescriptor} options.inputInterface - The interface this adapter expects as input
   * @param {InterfaceDescriptor} options.outputInterface - The interface this adapter provides as output
   * @param {Function} options.adaptRequest - Function that adapts a request from inputInterface to outputInterface
   * @param {Function} options.adaptResult - Function that adapts a result from outputInterface back to inputInterface
   * @param {Object} [options.metadata] - Additional metadata (opaque to Core)
   */
  constructor(options) {
    if (!options || !options.inputInterface || !(options.inputInterface instanceof InterfaceDescriptor)) {
      throw new Error('Adapter must specify an inputInterface as an InterfaceDescriptor');
    }
    if (!options.outputInterface || !(options.outputInterface instanceof InterfaceDescriptor)) {
      throw new Error('Adapter must specify an outputInterface as an InterfaceDescriptor');
    }
    if (typeof options.adaptRequest !== 'function') {
      throw new Error('Adapter must specify an adaptRequest function');
    }
    if (typeof options.adaptResult !== 'function') {
      throw new Error('Adapter must specify an adaptResult function');
    }

    this.inputInterface = options.inputInterface;
    this.outputInterface = options.outputInterface;
    this._adaptRequest = options.adaptRequest;
    this._adaptResult = options.adaptResult;
    this.metadata = options.metadata !== undefined ? options.metadata : null;
  }

  /**
   * Get the input interface this adapter expects
   * @returns {InterfaceDescriptor}
   */
  getInputInterface() {
    return this.inputInterface;
  }

  /**
   * Get the output interface this adapter provides
   * @returns {InterfaceDescriptor}
   */
  getOutputInterface() {
    return this.outputInterface;
  }

  /**
   * Adapt a request from the input interface to the output interface
   * @param {Request} request - A request for the input interface
   * @returns {Request} A request for the output interface
   */
  adaptRequest(request) {
    return this._adaptRequest(request);
  }

  /**
   * Adapt a result from the output interface back to the input interface
   * @param {Result} result - A result from the output interface
   * @returns {Result} A result for the input interface
   */
  adaptResult(result) {
    return this._adaptResult(result);
  }
}

module.exports = Adapter;