// Lifecycle Contract for Standard Connector V1
// Defines the lifecycle states and valid transitions

const { StandardError } = require('./error');

/**
 * Lifecycle states for Standard Connector V1
 * @readonly
 * @enum {string}
 */
const LIFECYCLE_STATE = Object.freeze({
  REGISTERED: 'REGISTERED',
  INITIALIZED: 'INITIALIZED',
  STARTED: 'STARTED',
  ACTIVE: 'ACTIVE',
  STOPPED: 'STOPPED',
  UNLOADED: 'UNLOADED',
  FAILED: 'FAILED',
  REJECTED: 'REJECTED'
});

/**
 * Valid transitions: from state -> array of allowed next states
 * @type {Object.<string, string[]>}
 */
const VALID_TRANSITIONS = Object.freeze({
  [LIFECYCLE_STATE.REGISTERED]: [LIFECYCLE_STATE.INITIALIZED, LIFECYCLE_STATE.FAILED, LIFECYCLE_STATE.REJECTED],
  [LIFECYCLE_STATE.INITIALIZED]: [LIFECYCLE_STATE.STARTED, LIFECYCLE_STATE.FAILED, LIFECYCLE_STATE.REJECTED],
  [LIFECYCLE_STATE.STARTED]: [LIFECYCLE_STATE.ACTIVE, LIFECYCLE_STATE.FAILED, LIFECYCLE_STATE.REJECTED],
  [LIFECYCLE_STATE.ACTIVE]: [LIFECYCLE_STATE.STOPPED, LIFECYCLE_STATE.FAILED, LIFECYCLE_STATE.REJECTED],
  [LIFECYCLE_STATE.STOPPED]: [LIFECYCLE_STATE.STARTED, LIFECYCLE_STATE.UNLOADED, LIFECYCLE_STATE.FAILED],
  [LIFECYCLE_STATE.UNLOADED]: [], // terminal
  [LIFECYCLE_STATE.FAILED]: [], // terminal
  [LIFECYCLE_STATE.REJECTED]: [] // terminal
});

/**
 * Lifecycle manager for a plugin or component.
 * @param {string} identity - Identity of the component
 */
class LifecycleManager {
  constructor(identity) {
    if (!identity || typeof identity !== 'string') {
      throw new Error('LifecycleManager requires a string identity');
    }
    this.identity = identity;
    this.state = LIFECYCLE_STATE.REGISTERED;
  }

  /**
   * Get current lifecycle state
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Attempt to transition to a new state.
   * @param {string} newState - The state to transition to
   * @throws {StandardError} if transition is invalid
   */
  transition(newState) {
    if (!LIFECYCLE_STATE[newState]) {
      throw new StandardError({
        code: 'LIFECYCLE_INVALID_STATE',
        category: 'LIFECYCLE',
        message: `Invalid lifecycle state: ${newState}`,
        recoverable: false
      });
    }

    const allowed = VALID_TRANSITIONS[this.state] || [];
    if (!allowed.includes(newState)) {
      throw new StandardError({
        code: 'LIFECYCLE_INVALID_TRANSITION',
        category: 'LIFECYCLE',
        message: `Invalid transition from ${this.state} to ${newState}`,
        recoverable: false
      });
    }

    this.state = newState;
  }

  /**
   * Register the component (transition to INITIALIZED)
   * @throws {StandardError}
   */
  register() {
    this.transition(LIFECYCLE_STATE.INITIALIZED);
  }

  /**
   * Initialize the component (transition to STARTED)
   * @throws {StandardError}
   */
  initialize() {
    this.transition(LIFECYCLE_STATE.STARTED);
  }

  /**
   * Start the component (transition to ACTIVE)
   * @throws {StandardError}
   */
  start() {
    this.transition(LIFECYCLE_STATE.ACTIVE);
  }

  /**
   * Stop the component (transition to STOPPED)
   * @throws {StandardError}
   */
  stop() {
    this.transition(LIFECYCLE_STATE.STOPPED);
  }

  /**
   * Unload the component (transition to UNLOADED)
   * @throws {StandardError}
   */
  unload() {
    this.transition(LIFECYCLE_STATE.UNLOADED);
  }

  /**
   * Mark as failed (transition to FAILED)
   * @throws {StandardError}
   */
  fail() {
    this.transition(LIFECYCLE_STATE.FAILED);
  }

  /**
   * Mark as rejected (transition to REJECTED)
   * @throws {StandardError}
   */
  reject() {
    this.transition(LIFECYCLE_STATE.REJECTED);
  }

  /**
   * Check if a transition is allowed
   * @param {string} newState
   * @returns {boolean}
   */
  canTransition(newState) {
    if (!LIFECYCLE_STATE[newState]) return false;
    const allowed = VALID_TRANSITIONS[this.state] || [];
    return allowed.includes(newState);
  }
}

module.exports = {
  LIFECYCLE_STATE,
  LifecycleManager,
  VALID_TRANSITIONS
};