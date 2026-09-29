// The five classifications for Standard Connector V1
// MUST remain exactly these five values

const CLASSIFICATIONS = Object.freeze({
  DIRECT_MATCH: 'DIRECT_MATCH',
  ADAPTER_REQUIRED: 'ADAPTER_REQUIRED',
  SUB_CONNECTOR_REQUIRED: 'SUB_CONNECTOR_REQUIRED',
  CONNECTOR_MISMATCH: 'CONNECTOR_MISMATCH',
  INCOMPATIBLE: 'INCOMPATIBLE'
});

// Utility to check if a value is a valid classification
function isValidClassification(value) {
  return Object.values(CLASSIFICATIONS).includes(value);
}

module.exports = {
  CLASSIFICATIONS,
  isValidClassification
};