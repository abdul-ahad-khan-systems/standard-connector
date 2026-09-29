// Generic Standard Connector resolution contract for V1.
//
// This surface is external to Core.
// It discovers a compatible Standard Connector implementation/version.
// It does not execute operations or define provider behavior.

const InterfaceDescriptor = require('../core/interfaceDescriptor');

class ConnectorResolver {
  constructor(candidates = []) {
    if (!Array.isArray(candidates)) {
      throw new Error('ConnectorResolver candidates must be an array');
    }

    this.candidates = candidates.slice();
  }

  resolve(targetInterface) {
    if (!(targetInterface instanceof InterfaceDescriptor)) {
      throw new Error(
        'ConnectorResolver requires a targetInterface as InterfaceDescriptor'
      );
    }

    const compatible = this.candidates.filter(candidate => (
      candidate &&
      candidate.interface instanceof InterfaceDescriptor &&
      candidate.connector !== undefined &&
      targetInterface.isCompatibleWith(candidate.interface)
    ));

    compatible.sort((a, b) => {
      const interfaceCompare = a.interface.toKey().localeCompare(
        b.interface.toKey()
      );

      if (interfaceCompare !== 0) {
        return interfaceCompare;
      }

      return JSON.stringify(a.metadata || {}).localeCompare(
        JSON.stringify(b.metadata || {})
      );
    });

    return compatible.length > 0 ? compatible[0] : null;
  }
}

module.exports = ConnectorResolver;
