// Sub-connector Contract
// Defines the shape of a sub-connector that can be used by the Standard Connector Core to bridge connection/transport/protocol mechanism

const InterfaceDescriptor = require('./interfaceDescriptor');

/**
 * A sub-connector bridges between two InterfaceDescriptor instances, typically
 * for the same protocol but different connection/transport/mechanism.
 * Sub-connectors are external to Core but must adhere to this contract.
 */
class SubConnector {
  /**
   * @param {Object} options
   * @param {InterfaceDescriptor} options.inputInterface - The interface this sub-connector expects as input
   * @param {InterfaceDescriptor} options.outputInterface - The interface this sub-connector provides as output
   * @param {Function} options.connect - Function that creates a connection given inputInterface parameters
   * @param {Function} options.dispose - Function that disposes of a connection
   * @param {Object} [options.metadata] - Additional metadata (opaque to Core)
   */
  constructor(options) {
    if (!options || !options.inputInterface || !(options.inputInterface instanceof InterfaceDescriptor)) {
      throw new Error('SubConnector must specify an inputInterface as an InterfaceDescriptor');
    }
    if (!options.outputInterface || !(options.outputInterface instanceof InterfaceDescriptor)) {
      throw new Error('SubConnector must specify an outputInterface as an InterfaceDescriptor');
    }
    if (typeof options.connect !== 'function') {
      throw new Error('SubConnector must specify a connect function');
    }
    if (typeof options.dispose !== 'function') {
      throw new Error('SubConnector must specify a dispose function');
    }

    this.inputInterface = options.inputInterface;
    this.outputInterface = options.outputInterface;
    this.connect = options.connect;
    this.dispose = options.dispose;
    this.metadata = options.metadata !== undefined ? options.metadata : null;
  }

  /**
   * Get the input interface this sub-connector expects
   * @returns {InterfaceDescriptor}
   */
  getInputInterface() {
    return this.inputInterface;
  }

  /**
   * Get the output interface this sub-connector provides
   * @returns {InterfaceDescriptor}
   */
  getOutputInterface() {
    return this.outputInterface;
  }

  /**
   * Establish a connection using the sub-connector.
   * @param {*} connectionParameters - Parameters for the connection (opaque to Core)
   * @returns {*} A connection object (opaque to Core)
   */
  connect(connectionParameters) {
    return this.connect(connectionParameters);
  }

  /**
   * Dispose of a connection established by this sub-connector.
   * @param {*} connection - The connection to dispose
   */
  dispose(connection) {
    return this.dispose(connection);
  }
}

module.exports = SubConnector;