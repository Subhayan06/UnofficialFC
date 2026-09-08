const { test, beforeEach } = require('node:test');
const assert = require('node:assert');

// Provide EventTarget for document in Node environment if missing
if (typeof globalThis.document === 'undefined') {
  globalThis.document = new EventTarget();
}

const { StateMachine } = require('../ucl1.js');

test('StateMachine unit tests', async (t) => {
  beforeEach(() => {
    StateMachine.current = 'idle';
  });

  await t.test('has correct initial state', () => {
    assert.strictEqual(StateMachine.current, 'idle');
    assert.deepStrictEqual(StateMachine.transitions, {
      idle: ['playing'],
      playing: ['finished'],
      finished: ['idle'],
    });
  });

  await t.test('allows valid state transitions: idle -> playing -> finished -> idle', () => {
    StateMachine.enter('playing');
    assert.strictEqual(StateMachine.current, 'playing');

    StateMachine.enter('finished');
    assert.strictEqual(StateMachine.current, 'finished');

    StateMachine.enter('idle');
    assert.strictEqual(StateMachine.current, 'idle');
  });

  await t.test('ignores invalid state transitions from idle', () => {
    StateMachine.enter('finished');
    assert.strictEqual(StateMachine.current, 'idle');

    StateMachine.enter('idle');
    assert.strictEqual(StateMachine.current, 'idle');

    StateMachine.enter('nonexistent');
    assert.strictEqual(StateMachine.current, 'idle');
  });

  await t.test('ignores invalid state transitions from playing', () => {
    StateMachine.enter('playing');
    assert.strictEqual(StateMachine.current, 'playing');

    StateMachine.enter('idle');
    assert.strictEqual(StateMachine.current, 'playing');

    StateMachine.enter('playing');
    assert.strictEqual(StateMachine.current, 'playing');

    StateMachine.enter('unknown');
    assert.strictEqual(StateMachine.current, 'playing');
  });

  await t.test('ignores invalid state transitions from finished', () => {
    StateMachine.current = 'finished';

    StateMachine.enter('playing');
    assert.strictEqual(StateMachine.current, 'finished');

    StateMachine.enter('finished');
    assert.strictEqual(StateMachine.current, 'finished');
  });

  await t.test('triggers onChange and dispatches stateChange event on valid transition', () => {
    const events = [];
    const eventHandler = (event) => {
      events.push(event.detail);
    };

    document.addEventListener('stateChange', eventHandler);

    try {
      StateMachine.enter('playing');
      assert.strictEqual(events.length, 1);
      assert.deepStrictEqual(events[0], { state: 'playing' });
    } finally {
      document.removeEventListener('stateChange', eventHandler);
    }
  });

  await t.test('does not trigger onChange or dispatch event on invalid transition', () => {
    const events = [];
    const eventHandler = (event) => {
      events.push(event.detail);
    };

    document.addEventListener('stateChange', eventHandler);

    try {
      StateMachine.enter('finished'); // invalid transition from idle
      assert.strictEqual(events.length, 0);
    } finally {
      document.removeEventListener('stateChange', eventHandler);
    }
  });
});
