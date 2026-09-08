const test = require('node:test');
const assert = require('node:assert/strict');
const { RainSystem } = require('../ucl1.js');

test('RainSystem.createDrop - returned object structure and property types', () => {
  const rain = new RainSystem(null, { width: 800, height: 600 });
  const drop = rain.createDrop();

  assert.equal(typeof drop, 'object');
  assert.notEqual(drop, null);

  const keys = ['x', 'y', 'vy', 'len', 'opacity'];
  for (const key of keys) {
    assert.ok(key in drop, `Drop object missing key: ${key}`);
    assert.equal(typeof drop[key], 'number', `Property ${key} should be a number`);
    assert.ok(!Number.isNaN(drop[key]), `Property ${key} should not be NaN`);
  }
});

test('RainSystem.createDrop - range assertions with default options (1000 iterations)', () => {
  const width = 1000;
  const height = 800;
  const speed = 4;
  const length = 12;
  const opacity = 0.35;

  const rain = new RainSystem(null, { width, height, speed, length, opacity });

  for (let i = 0; i < 1000; i++) {
    const drop = rain.createDrop();

    assert.ok(drop.x >= 0 && drop.x <= width, `x (${drop.x}) out of bounds [0, ${width}]`);
    assert.ok(drop.y >= 0 && drop.y <= height, `y (${drop.y}) out of bounds [0, ${height}]`);
    assert.ok(drop.vy >= 2 && drop.vy <= 2 + speed, `vy (${drop.vy}) out of bounds [2, ${2 + speed}]`);
    assert.ok(drop.len >= 6 && drop.len <= 6 + length, `len (${drop.len}) out of bounds [6, ${6 + length}]`);
    assert.ok(
      drop.opacity >= 0.15 && drop.opacity <= 0.15 + opacity,
      `opacity (${drop.opacity}) out of bounds [0.15, ${0.15 + opacity}]`
    );
  }
});

test('RainSystem.createDrop - range assertions with custom options (1000 iterations)', () => {
  const width = 1920;
  const height = 1080;
  const speed = 10;
  const length = 20;
  const opacity = 0.5;

  const rain = new RainSystem(null, { width, height, speed, length, opacity });

  for (let i = 0; i < 1000; i++) {
    const drop = rain.createDrop();

    assert.ok(drop.x >= 0 && drop.x <= width, `x (${drop.x}) out of bounds [0, ${width}]`);
    assert.ok(drop.y >= 0 && drop.y <= height, `y (${drop.y}) out of bounds [0, ${height}]`);
    assert.ok(drop.vy >= 2 && drop.vy <= 2 + speed, `vy (${drop.vy}) out of bounds [2, ${2 + speed}]`);
    assert.ok(drop.len >= 6 && drop.len <= 6 + length, `len (${drop.len}) out of bounds [6, ${6 + length}]`);
    assert.ok(
      drop.opacity >= 0.15 && drop.opacity <= 0.15 + opacity,
      `opacity (${drop.opacity}) out of bounds [0.15, ${0.15 + opacity}]`
    );
  }
});

test('RainSystem.createDrop - zero dimension canvas bounds', () => {
  const rain = new RainSystem(null, { width: 0, height: 0 });
  const drop = rain.createDrop();

  assert.equal(drop.x, 0);
  assert.equal(drop.y, 0);
});

test('RainSystem.createDrop - deterministic outputs with mocked Math.random()', () => {
  const originalRandom = Math.random;
  const width = 800;
  const height = 600;
  const speed = 4;
  const length = 12;
  const opacity = 0.35;

  const rain = new RainSystem(null, { width, height, speed, length, opacity });

  try {
    // Case 1: Math.random() returns 0 (minimum bounds)
    Math.random = () => 0;
    const minDrop = rain.createDrop();
    assert.equal(minDrop.x, 0);
    assert.equal(minDrop.y, 0);
    assert.equal(minDrop.vy, 2);
    assert.equal(minDrop.len, 6);
    assert.equal(minDrop.opacity, 0.15);

    // Case 2: Math.random() returns 0.5 (midpoint bounds)
    Math.random = () => 0.5;
    const midDrop = rain.createDrop();
    assert.equal(midDrop.x, 400);
    assert.equal(midDrop.y, 300);
    assert.equal(midDrop.vy, 4);
    assert.equal(midDrop.len, 12);
    assert.ok(Math.abs(midDrop.opacity - 0.325) < 1e-6);

    // Case 3: Math.random() returns 0.999999 (maximum bounds)
    Math.random = () => 0.999999;
    const maxDrop = rain.createDrop();
    assert.ok(Math.abs(maxDrop.x - 799.9992) < 1e-4);
    assert.ok(Math.abs(maxDrop.y - 599.9994) < 1e-4);
    assert.ok(Math.abs(maxDrop.vy - 5.999996) < 1e-4);
    assert.ok(Math.abs(maxDrop.len - 17.999988) < 1e-4);
    assert.ok(Math.abs(maxDrop.opacity - 0.49999965) < 1e-4);
  } finally {
    Math.random = originalRandom;
  }
});
