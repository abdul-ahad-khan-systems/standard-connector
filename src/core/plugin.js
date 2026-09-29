// Plugin Contract
// Defines the shape of a plugin that can be registered with the Standard Connector Core

const InterfaceDescriptor = require('./interfaceDescriptor');
const { CLASSIFICATIONS } = require('./classifications');

/**
 * A plugin provides capabilities to the Standard Connector Core.
 * Plugins are external to Core but must adhere to this contract.
 */
class Plugin {
  /**
   * @param {Object} options
   * @param {string} options.identity - Unique identifier for the plugin
   * @param {Object} options.version - Semantic version {major, minor, patch}
   * @param {string[]} options.capabilities - List of capability strings this plugin provides
   * @param {Object[]} options.operations - Array of operation descriptors
   * @param {InterfaceDescriptor} options.interface - The interface this plugin exposes via Standard Connector
   * @param {Function} options.lifecycle - Lifecycle object with methods: register, initialize, start, stop, unload
   * @param {Object} [options.metadata] - Additional metadata (opaque to Core)
   */
  constructor(options) {
    if (!options || !options.identity || typeof options.identity !== 'string') {
      throw new Error('Plugin must specify a string identity');
    }
    if (!options.version || typeof options.version !== 'object') {
      throw new Error('Plugin must specify a version object');
    }
    if (typeof options.version.major !== 'number' ||
        typeof options.version.minor !== 'number' ||
        typeof options.version.patch !== 'number') {
      throw new Error('Plugin version must have major, minor, patch numbers');
    }
    if (!options.capabilities || !Array.isArray(options.capabilities)) {
      throw new Error('Plugin must specify an array of capabilities');
    }
    if (!options.operations || !Array.isArray(options.operations)) {
      throw new Error('Plugin must specify an array of operations');
    }
    if (!options.interface || !(options.interface instanceof InterfaceDescriptor)) {
      throw new Error('Plugin must specify an InterfaceDescriptor for its exposed interface');
    }
    if (!options.lifecycle || typeof options.lifecycle !== 'object') {
      throw new Error('Plugin must specify a lifecycle object');
    }
    // Validate lifecycle methods
    const lifecycleMethods = ['register', 'initialize', 'start', 'stop', 'unload'];
    for (const method of lifecycleMethods) {
      if (typeof options.lifecycle[method] !== 'function') {
        throw new Error(`Plugin lifecycle must provide a ${method} function`);
      }
    }

    this.identity = options.identity;
    this.version = {
      major: options.version.major,
      minor: options.version.minor,
      patch: options.version.patch
    };
    this.capabilities = [...options.capabilities]; // copy
    this.operations = [...options.operations]; // copy
    this.interface = options.interface;
    this.lifecycle = options.lifecycle;
    this.metadata = options.metadata !== undefined ? options.metadata : null;
  }

  /**
   * Get the plugin's identity
   * @returns {string}
   */
  getIdentity() {
    return this.identity;
  }

  /**
   * Get the plugin's version
   * @returns {Object}
   */
  getVersion() {
    return this.version;
  }

  /**
   * Get the plugin's capabilities
   * @returns {string[]}
   */
  getCapabilities() {
    return this.capabilities;
  }

  /**
   * Get the plugin's operations
   * @returns {Object[]}
   */
  getOperations() {
    return this.operations;
  }

  /**
   * Get the interface this plugin exposes
   * @returns {InterfaceDescriptor}
   */
  getInterface() {
    return this.interface;
  }

  /**
   * Get the plugin's lifecycle object
   * @returns {Object}
   */
  getLifecycle() {
    return this.lifecycle;
  }
}

module.exports = Plugin;