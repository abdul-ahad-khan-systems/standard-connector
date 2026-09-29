// Standard Connector V1 Protocol Definition
// Frozen architecture: MAJOR version is 1 for V1

const VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  },
  // Compatibility: same major version is compatible
  isCompatible(otherVersion) {
    if (!otherVersion || typeof otherVersion !== 'object') return false;
    return this.major === otherVersion.major;
  }
};

module.exports = VERSION;
module.exports = { VERSION };
