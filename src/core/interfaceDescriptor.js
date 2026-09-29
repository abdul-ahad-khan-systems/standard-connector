// InterfaceDescriptor
// Deterministic and complete representation of an interface

class InterfaceDescriptor {
  /**
   * @param {Object} options
   * @param {string} options.protocol - The protocol identifier (e.g., 'http', 'grpc', 'ws')
   * @param {Object} options.version - The semantic version object {major, minor, patch}
   * @param {string[]} [options.capabilities] - Array of capability strings
   * @param {Object[]} [options.operations] - Array of operation descriptors
   * @param {Object} [options.inputSchema] - JSON Schema for input validation
   * @param {Object} [options.outputSchema] - JSON Schema for output validation
   * @param {Object} [options.authRequirements] - Authentication requirements (opaque to Core)
   * @param {Object} [options.scopeRequirements] - Scope requirements (opaque to Core)
   * @param {Object} [options.lifecycleRequirements] - Lifecycle requirements (opaque to Core)
   * @param {Object} [options.versionCompatibility] - Version compatibility requirements (opaque to Core)
   */
  constructor(options) {
    if (!options || !options.protocol || typeof options.protocol !== 'string') {
      throw new Error('InterfaceDescriptor must specify a string protocol');
    }
    if (!options.version || typeof options.version !== 'object') {
      throw new Error('InterfaceDescriptor must specify a version object');
    }
    // Validate version has major, minor, patch
    if (typeof options.version.major !== 'number' ||
        typeof options.version.minor !== 'number' ||
        typeof options.version.patch !== 'number') {
      throw new Error('InterfaceDescriptor version must have major, minor, patch numbers');
    }

    this.protocol = options.protocol;
    this.version = {
      major: options.version.major,
      minor: options.version.minor,
      patch: options.version.patch
    };
    this.capabilities = options.capabilities ? [...options.capabilities] : [];
    this.operations = options.operations ? [...options.operations] : [];
    this.inputSchema = options.inputSchema !== undefined ? options.inputSchema : null;
    this.outputSchema = options.outputSchema !== undefined ? options.outputSchema : null;
    this.authRequirements = options.authRequirements !== undefined ? options.authRequirements : null;
    this.scopeRequirements = options.scopeRequirements !== undefined ? options.scopeRequirements : null;
    this.lifecycleRequirements = options.lifecycleRequirements !== undefined ? options.lifecycleRequirements : null;
    this.versionCompatibility = options.versionCompatibility !== undefined ? options.versionCompatibility : null;
  }

  /**
   * Returns a deterministic string representation for hashing/visited-state tracking
   * @returns {string}
   */
  toKey() {
    // We need a deterministic representation. JSON.stringify with sorted keys is deterministic.
    // However, we need to handle functions? No, InterfaceDescriptor should be plain data.
    // We'll assume all properties are JSON-serializable.
    const obj = {
      protocol: this.protocol,
      version: this.version,
      capabilities: this.capabilities.slice().sort(), // sort for determinism
      operations: this.operations.map(op => ({
        // Assuming operations are plain objects; we'd need to sort if they have keys
        ...op
      })).sort((a, b) => {
        // Simple sort by name if available, otherwise JSON string
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
      }),
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      authRequirements: this.authRequirements,
      scopeRequirements: this.scopeRequirements,
      lifecycleRequirements: this.lifecycleRequirements,
      versionCompatibility: this.versionCompatibility
    };
    return JSON.stringify(obj);
  }

  /**
   * Check if this interface is compatible with another based on protocol and major version
   * @param {InterfaceDescriptor} other
   * @returns {boolean}
   */
  isCompatibleWith(other) {
    if (!(other instanceof InterfaceDescriptor)) {
      return false;
    }
    return this.protocol === other.protocol &&
           this.version.major === other.version.major;
  }
}

module.exports = InterfaceDescriptor;