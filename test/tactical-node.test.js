const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const script = require('../script.js');

describe('TacticalNode.update', () => {
    beforeEach(() => {
        script.currentTactic = 'press';
        script.canvas.width = 1000;
        script.canvas.height = 800;
    });

    test('updates position, velocity, and isRed property for a valid index (happy path)', () => {
        const node = new script.TacticalNode(0);
        node.x = 100;
        node.y = 100;
        node.vx = 0;
        node.vy = 0;

        const target = script.formations.press[0]; // { x: 0.5, y: 0.15, r: false }
        const targetX = target.x * script.canvas.width;  // 500
        const targetY = target.y * script.canvas.height; // 120

        node.update();

        const expectedAx = (targetX - 100) * 0.04; // (500 - 100) * 0.04 = 16
        const expectedAy = (targetY - 100) * 0.04; // (120 - 100) * 0.04 = 0.8

        const expectedVx = (0 + expectedAx) * 0.85; // 16 * 0.85 = 13.6
        const expectedVy = (0 + expectedAy) * 0.85; // 0.8 * 0.85 = 0.68

        const expectedX = 100 + expectedVx; // 113.6
        const expectedY = 100 + expectedVy; // 100.68

        assert.strictEqual(node.isRed, target.r);
        assert.ok(Math.abs(node.vx - expectedVx) < 1e-6, `vx ${node.vx} should match ${expectedVx}`);
        assert.ok(Math.abs(node.vy - expectedVy) < 1e-6, `vy ${node.vy} should match ${expectedVy}`);
        assert.ok(Math.abs(node.x - expectedX) < 1e-6, `x ${node.x} should match ${expectedX}`);
        assert.ok(Math.abs(node.y - expectedY) < 1e-6, `y ${node.y} should match ${expectedY}`);
    });

    test('returns early without modifying node state when index is out of bounds', () => {
        const outOfBoundsIndex = 999;
        const node = new script.TacticalNode(outOfBoundsIndex);
        node.x = 123;
        node.y = 456;
        node.vx = 5;
        node.vy = -5;
        node.isRed = undefined;

        node.update();

        assert.strictEqual(node.x, 123);
        assert.strictEqual(node.y, 456);
        assert.strictEqual(node.vx, 5);
        assert.strictEqual(node.vy, -5);
        assert.strictEqual(node.isRed, undefined);
    });

    test('adapts target coordinates and team color when tactic changes', () => {
        const node = new script.TacticalNode(10); // Index 10 is red in both press and block
        node.x = 100;
        node.y = 100;
        node.vx = 0;
        node.vy = 0;

        script.currentTactic = 'press';
        node.update();
        const pressTargetX = script.formations.press[10].x * script.canvas.width;
        assert.strictEqual(node.isRed, script.formations.press[10].r);

        const xAfterPress = node.x;

        script.currentTactic = 'block';
        node.update();
        const blockTargetY = script.formations.block[10].y * script.canvas.height;
        assert.strictEqual(node.isRed, script.formations.block[10].r);
        assert.notStrictEqual(node.x, xAfterPress);
    });

    test('converges toward target position over multiple update ticks', () => {
        const node = new script.TacticalNode(0);
        node.x = 0;
        node.y = 0;
        node.vx = 0;
        node.vy = 0;

        const target = script.formations.press[0];
        const targetX = target.x * script.canvas.width; // 500
        const targetY = target.y * script.canvas.height; // 120

        const initialDistance = Math.hypot(targetX - node.x, targetY - node.y);

        for (let i = 0; i < 50; i++) {
            node.update();
        }

        const finalDistance = Math.hypot(targetX - node.x, targetY - node.y);
        assert.ok(finalDistance < initialDistance * 0.1, `Final distance ${finalDistance} should be significantly smaller than initial ${initialDistance}`);
    });

    test('factors pre-existing velocity into acceleration and damping', () => {
        const node = new script.TacticalNode(0);
        node.x = 500; // Already at target X (targetX = 500)
        node.y = 120; // Already at target Y (targetY = 120)
        node.vx = 10; // Residual velocity
        node.vy = -10;

        node.update();

        // Since ax = 0 and ay = 0, vx = (10 + 0) * 0.85 = 8.5
        assert.ok(Math.abs(node.vx - 8.5) < 1e-6);
        assert.ok(Math.abs(node.vy - (-8.5)) < 1e-6);
        assert.ok(Math.abs(node.x - 508.5) < 1e-6);
        assert.ok(Math.abs(node.y - 111.5) < 1e-6);
    });
});
