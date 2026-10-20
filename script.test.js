const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { changeTactic, updateTimer, TacticalNode, formations, getCurrentTactic, setCurrentTactic, drawNodeConnections } = require('./script.js');

function createMockElement(textContent, initialClasses = []) {
  const classSet = new Set(initialClasses);
  return {
    textContent,
    classList: {
      add: (cls) => classSet.add(cls),
      remove: (cls) => classSet.delete(cls),
      contains: (cls) => classSet.has(cls)
    }
  };
}

describe('script.js Unit Tests', () => {

  describe('changeTactic', () => {
    let mockButtons;
    let originalDocument;

    beforeEach(() => {
      originalDocument = global.document;
      mockButtons = [
        createMockElement('Execute High Press', ['switch-btn', 'active']),
        createMockElement('Drop Low Block', ['switch-btn'])
      ];

      global.document = {
        querySelectorAll: (selector) => {
          if (selector === '.switch-btn') return mockButtons;
          return [];
        }
      };
    });

    afterEach(() => {
      global.document = originalDocument;
    });

    test('updates tactic state to "block" and sets active button class', () => {
      setCurrentTactic('press');
      changeTactic('block');

      assert.equal(getCurrentTactic(), 'block');
      assert.equal(mockButtons[0].classList.contains('active'), false);
      assert.equal(mockButtons[1].classList.contains('active'), true);
    });

    test('updates tactic state to "press" and sets active button class', () => {
      setCurrentTactic('block');
      mockButtons[0].classList.remove('active');
      mockButtons[1].classList.add('active');

      changeTactic('press');

      assert.equal(getCurrentTactic(), 'press');
      assert.equal(mockButtons[0].classList.contains('active'), true);
      assert.equal(mockButtons[1].classList.contains('active'), false);
    });

    test('handles switch-btn query returning empty list safely', () => {
      global.document.querySelectorAll = () => [];
      changeTactic('press');
      assert.equal(getCurrentTactic(), 'press');
    });
  });

  describe('updateTimer', () => {
    let originalDocument;
    let mockElements;

    beforeEach(() => {
      originalDocument = global.document;
      mockElements = {
        days: { innerText: '' },
        hours: { innerText: '' },
        mins: { innerText: '' },
        secs: { innerText: '' }
      };

      global.document = {
        getElementById: (id) => mockElements[id] || null
      };
    });

    afterEach(() => {
      global.document = originalDocument;
    });

    test('populates days, hours, mins, secs elements with formatted string values', () => {
      updateTimer();

      assert.match(mockElements.days.innerText, /^\d+$/);
      assert.match(mockElements.hours.innerText, /^\d{2}$/);
      assert.match(mockElements.mins.innerText, /^\d{2}$/);
      assert.match(mockElements.secs.innerText, /^\d{2}$/);
    });

    test('safely returns if document or any required DOM timer element is missing', () => {
      global.document = {
        getElementById: () => null
      };
      // Should not throw
      assert.doesNotThrow(() => updateTimer());
    });
  });

  describe('TacticalNode', () => {
    test('initializes node with default values and randomized canvas coordinates', () => {
      const node = new TacticalNode(0);
      assert.equal(node.index, 0);
      assert.equal(typeof node.x, 'number');
      assert.equal(typeof node.y, 'number');
      assert.equal(node.vx, 0);
      assert.equal(node.vy, 0);
      assert.equal(node.size, 7);
    });

    test('updates node velocity and position towards high press target formation', () => {
      setCurrentTactic('press');
      const node = new TacticalNode(0);
      const initialX = node.x;
      const initialY = node.y;

      node.update();

      assert.notEqual(node.x, initialX);
      assert.notEqual(node.y, initialY);
      assert.equal(node.isRed, formations.press[0].r);
    });

    test('updates node velocity and position towards low block target formation', () => {
      setCurrentTactic('block');
      const node = new TacticalNode(2);
      const initialX = node.x;

      node.update();

      assert.notEqual(node.x, initialX);
      assert.equal(node.isRed, formations.block[2].r);
    });

    test('returns early on update if node index exceeds formation positions', () => {
      setCurrentTactic('press');
      const outOfBoundsIndex = 999;
      const node = new TacticalNode(outOfBoundsIndex);
      const initialX = node.x;
      const initialY = node.y;

      node.update();

      assert.equal(node.x, initialX);
      assert.equal(node.y, initialY);
    });
  });

  describe('drawNodeConnections', () => {
    function createMockContext() {
      const calls = [];
      return {
        calls,
        beginPath: () => calls.push('beginPath'),
        stroke: () => calls.push('stroke'),
        moveTo: (x, y) => calls.push(['moveTo', x, y]),
        lineTo: (x, y) => calls.push(['lineTo', x, y]),
        strokeStyle: '',
        lineWidth: 0
      };
    }

    test('returns false and performs no drawing if context is missing or nodeGroup has <= 1 nodes', () => {
      const mockCtx = createMockContext();
      assert.equal(drawNodeConnections([], '#fff', 10000, mockCtx), false);
      assert.equal(drawNodeConnections([{ x: 10, y: 10 }], '#fff', 10000, mockCtx), false);
      assert.equal(drawNodeConnections([{ x: 10, y: 10 }, { x: 20, y: 20 }], '#fff', 10000, null), false);
      assert.equal(mockCtx.calls.length, 0);
    });

    test('does not stroke if nodes exceed maxDistSq threshold', () => {
      const mockCtx = createMockContext();
      const nodes = [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ];
      const maxDistSq = 10000;

      const connected = drawNodeConnections(nodes, 'rgba(255,0,0,0.5)', maxDistSq, mockCtx);

      assert.equal(connected, false);
      assert.equal(mockCtx.calls.includes('stroke'), false);
    });

    test('draws lines and strokes when nodes are within maxDistSq threshold', () => {
      const mockCtx = createMockContext();
      const nodes = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 500, y: 500 }
      ];
      const maxDistSq = 1000;

      const connected = drawNodeConnections(nodes, 'rgba(244, 63, 94, 0.35)', maxDistSq, mockCtx);

      assert.equal(connected, true);
      assert.equal(mockCtx.strokeStyle, 'rgba(244, 63, 94, 0.35)');
      assert.equal(mockCtx.lineWidth, 1.5);
      assert.ok(mockCtx.calls.includes('beginPath'));
      assert.ok(mockCtx.calls.includes('stroke'));
      assert.deepEqual(mockCtx.calls.find(c => Array.isArray(c) && c[0] === 'moveTo'), ['moveTo', 0, 0]);
      assert.deepEqual(mockCtx.calls.find(c => Array.isArray(c) && c[0] === 'lineTo'), ['lineTo', 10, 10]);
    });
  });

});
