// Classifier for Standard Connector V1
// Determines the relationship between two InterfaceDescriptor instances

const { CLASSIFICATIONS } = require('./classifications');
const InterfaceDescriptor = require('./interfaceDescriptor');

/**
 * Classify the relationship between requester's target interface and provider's interface.
 * @param {InterfaceDescriptor} targetInterface - The interface the requester wants to connect to
 * @param {InterfaceDescriptor} providerInterface - The interface the provider offers
 * @returns {string} One of the five classifications
 */
function classify(targetInterface, providerInterface) {
  // Validate inputs
  if (!(targetInterface && targetInterface instanceof InterfaceDescriptor)) {
    throw new Error('classify requires a valid targetInterface as InterfaceDescriptor');
  }
  if (!(providerInterface && providerInterface instanceof InterfaceDescriptor)) {
    throw new Error('classify requires a valid providerInterface as InterfaceDescriptor');
  }

  // Check if they are exactly equivalent (same protocol, version, capabilities, operations, etc.)
  if (targetInterface.toKey() === providerInterface.toKey()) {
    return CLASSIFICATIONS.DIRECT_MATCH;
  }

  // Same protocol and same major version -> need adapter for translation/adaptation
  if (targetInterface.protocol === providerInterface.protocol &&
      targetInterface.version.major === providerInterface.version.major) {
    return CLASSIFICATIONS.ADAPTER_REQUIRED;
  }

  // Different protocol but same major version -> different mechanism, need a
  // sub-connector to bridge connection/transport/protocol.
  if (targetInterface.protocol !== providerInterface.protocol &&
      targetInterface.version.major === providerInterface.version.major) {
    return CLASSIFICATIONS.SUB_CONNECTOR_REQUIRED;
  }

  // Any major-version mismatch (same protocol or different) is incompatible.
  // NOTE: CONNECTOR_MISMATCH is intentionally not produced here. Per
  // ARCHITECTURE.md Sec 4, it represents "another compatible Standard
  // Connector implementation/version may satisfy it" -- a connector-
  // resolution concern, not a protocol/version comparison. It is reserved
  // for the resolution layer (Phase 3/4), not classify().
  return CLASSIFICATIONS.INCOMPATIBLE;
}

module.exports = { classify };