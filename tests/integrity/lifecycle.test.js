const assert = require('assert');
const {
  LIFECYCLE_STATE,
  LifecycleManager
} = require('../../src/core/lifecycle');

const lifecycle = new LifecycleManager('test-component');

assert.strictEqual(
  lifecycle.getState(),
  LIFECYCLE_STATE.REGISTERED
);

lifecycle.register();
assert.strictEqual(lifecycle.getState(), LIFECYCLE_STATE.INITIALIZED);

lifecycle.initialize();
assert.strictEqual(lifecycle.getState(), LIFECYCLE_STATE.STARTED);

lifecycle.start();
assert.strictEqual(lifecycle.getState(), LIFECYCLE_STATE.ACTIVE);

lifecycle.stop();
assert.strictEqual(lifecycle.getState(), LIFECYCLE_STATE.STOPPED);

lifecycle.unload();
assert.strictEqual(lifecycle.getState(), LIFECYCLE_STATE.UNLOADED);

assert.throws(
  () => lifecycle.start(),
  (err) => err &&
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

const rejected = new LifecycleManager('rejected-component');
rejected.register();
rejected.reject();

assert.strictEqual(
  rejected.getState(),
  LIFECYCLE_STATE.REJECTED
);

assert.throws(
  () => rejected.start(),
  (err) => err &&
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

const failed = new LifecycleManager('failed-component');
failed.fail();

assert.strictEqual(
  failed.getState(),
  LIFECYCLE_STATE.FAILED
);

assert.throws(
  () => failed.start(),
  (err) => err &&
    err.code === 'LIFECYCLE_INVALID_TRANSITION' &&
    err.category === 'LIFECYCLE'
);

console.log('PASS: V1 lifecycle integrity');
