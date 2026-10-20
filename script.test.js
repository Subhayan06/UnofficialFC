const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { changeTactic, updateTimer, TacticalNode, formations, getCurrentTactic, setCurrentTactic, initMatrixEngine } = require('./script.js');

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


  describe('initMatrixEngine', () => {
    let originalDocument;
    let originalWindow;
    let originalThree;
    let originalRequestAnimationFrame;
    let originalCancelAnimationFrame;

    beforeEach(() => {
      originalDocument = global.document;
      originalWindow = global.window;
      originalThree = global.THREE;
      originalRequestAnimationFrame = global.requestAnimationFrame;
      originalCancelAnimationFrame = global.cancelAnimationFrame;
    });

    afterEach(() => {
      global.document = originalDocument;
      global.window = originalWindow;
      global.THREE = originalThree;
      global.requestAnimationFrame = originalRequestAnimationFrame;
      global.cancelAnimationFrame = originalCancelAnimationFrame;
    });

    test('returns null safely when canvas is missing', () => {
      global.document = {
        getElementById: () => null
      };

      const result = initMatrixEngine();
      assert.equal(result, null);
    });

    test('initializes matrix engine, requests animation frame, and cleans up when invoked', () => {
      let rAFCount = 0;
      let requestedFrameId = null;
      let canceledFrameId = null;

      global.requestAnimationFrame = (fn) => {
        rAFCount++;
        requestedFrameId = 42;
        return requestedFrameId;
      };

      global.cancelAnimationFrame = (id) => {
        canceledFrameId = id;
      };

      const mockCanvas = {
        getContext: () => ({})
      };

      global.document = {
        getElementById: (id) => (id === 'homepage-matrix-canvas' ? mockCanvas : null),
        addEventListener: () => {}
      };

      global.window = {
        innerWidth: 1024,
        innerHeight: 768,
        devicePixelRatio: 1,
        addEventListener: () => {},
        removeEventListener: () => {}
      };

      function MockGeometry() {
        this.setAttribute = () => {};
        this.attributes = {
          position: { array: new Float32Array(180), needsUpdate: false }
        };
      }
      function MockMaterial() {}
      function MockMesh() {
        this.position = { set: () => {} };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.geometry = new MockGeometry();
        this.material = { opacity: 1 };
      }

      global.THREE = {
        Scene: function() { this.add = () => {}; this.rotation = { x: 0, y: 0 }; },
        PerspectiveCamera: function() { this.position = { set: () => {} }; this.lookAt = () => {}; },
        WebGLRenderer: function() { this.setSize = () => {}; this.setPixelRatio = () => {}; this.render = () => {}; },
        GridHelper: function() { this.position = {}; this.rotation = {}; this.material = {}; },
        DodecahedronGeometry: MockGeometry,
        IcosahedronGeometry: MockGeometry,
        TorusKnotGeometry: MockGeometry,
        BufferGeometry: MockGeometry,
        BufferAttribute: function() {},
        MeshBasicMaterial: MockMaterial,
        PointsMaterial: MockMaterial,
        LineBasicMaterial: MockMaterial,
        Mesh: MockMesh,
        Points: MockMesh,
        LineSegments: MockMesh,
        AdditiveBlending: 1
      };

      const cleanup = initMatrixEngine();
      assert.equal(typeof cleanup, 'function');
      assert.equal(rAFCount, 1);
      assert.equal(requestedFrameId, 42);

      cleanup();
      assert.equal(canceledFrameId, 42);
    });
  });

});
