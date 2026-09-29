const assert = require('assert');

const {
  LIFECYCLE_STATE,
  LifecycleManager,
  VALID_TRANSITIONS
} = require('../../src/core/lifecycle');

const states = Object.values(LIFECYCLE_STATE);

const expected = {
  REGISTERED: ['INITIALIZED', 'FAILED', 'REJECTED'],
  INITIALIZED: ['STARTED', 'FAILED', 'REJECTED'],
  STARTED: ['ACTIVE', 'FAILED', 'REJECTED'],
  ACTIVE: ['STOPPED', 'FAILED', 'REJECTED'],
  STOPPED: ['STARTED', 'UNLOADED', 'FAILED'],
  UNLOADED: [],
  FAILED: [],
  REJECTED: []
};

for (const state of states) {
  assert.deepStrictEqual(
    VALID_TRANSITIONS[state],
    expected[state],
    `Unexpected transitions from ${state}`
  );
}

for (const state of states) {
  const manager = new LifecycleManager('test-component');
  manager.state = state;

  for (const allowed of expected[state]) {
    assert.strictEqual(
      manager.canTransition(allowed),
      true,
      `${state} should allow ${allowed}`
    );
  }

  for (const candidate of states) {
    if (!expected[state].includes(candidate)) {
      assert.strictEqual(
        manager.canTransition(candidate),
        false,
        `${state} should reject ${candidate}`
      );
    }
  }
}

const manager = new LifecycleManager('test-component');

assert.throws(
  () => manager.transition('NOT_A_STATE'),
  (err) =>
    err.code === 'LIFECYCLE_INVALID_STATE' &&
    err.category === 'LIFECYCLE'
);

assert.throws(
  () => manager.transition('ACTIVE'),
  (err) =>
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

manager.register();
manager.initialize();
manager.start();
manager.stop();
manager.transition(LIFECYCLE_STATE.STARTED);
manager.start();

assert.strictEqual(manager.getState(), 'ACTIVE');

manager.stop();
manager.unload();

assert.strictEqual(manager.getState(), 'UNLOADED');

assert.throws(
  () => manager.start(),
  (err) =>
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

const failed = new LifecycleManager('failed-component');
failed.fail();

assert.strictEqual(failed.getState(), 'FAILED');

assert.throws(
  () => failed.start(),
  (err) =>
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

const rejected = new LifecycleManager('rejected-component');
rejected.reject();

assert.strictEqual(rejected.getState(), 'REJECTED');

assert.throws(
  () => rejected.unload(),
  (err) =>
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

console.log('PASS: complete lifecycle integrity');
