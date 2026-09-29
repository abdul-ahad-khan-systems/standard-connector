// Result Contract
// A normalized object describing the outcome of an operation

class Result {
  /**
   * @param {Object} options
   * @param {'OK'|'ERROR'} options.status - The status of the operation
   * @param {*} [options.payload] - Payload from the operation (opaque to Core)
   * @param {Object} [options.metadata] - Deterministic, bounded metadata
   */
  constructor(options) {
    if (!options || (options.status !== 'OK' && options.status !== 'ERROR')) {
      throw new Error('Result must specify a status of either "OK" or "ERROR"');
    }

    this.status = options.status;
    this.payload = options.payload !== undefined ? options.payload : null;
    this.metadata = options.metadata !== undefined ? options.metadata : {};
  }
}

module.exports = Result;