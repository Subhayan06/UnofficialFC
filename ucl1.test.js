const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { TacticalPitch, HeatmapCanvas, DropletSystem } = require('./ucl1.js');

describe('TacticalPitch.tweenArray', () => {
  test('returns points array sliced directly if points length >= totalFrames', () => {
    const pitch = new TacticalPitch();
    // Create 605 points
    const points = Array.from({ length: 605 }, (_, i) => [i, i]);
    const result = pitch.tweenArray(...points);

    assert.equal(result.length, pitch.totalFrames);
    assert.deepEqual(result[0], [0, 0]);
    assert.deepEqual(result[599], [599, 599]);
  });

  test('interpolates linear trajectory accurately for two keyframe points', () => {
    const pitch = new TacticalPitch();
    const result = pitch.tweenArray([0, 0], [100, 200]);

    assert.equal(result.length, pitch.totalFrames); // 600
    // Start frame
    assert.deepEqual(result[0], [0, 0]);
    // Midpoint (frame 300 / 600) -> t = 300/600 = 0.5
    assert.deepEqual(result[300], [50, 100]);
    // Frame 150 -> t = 150/600 = 0.25
    assert.deepEqual(result[150], [25, 50]);
    // End frame (frame 599 -> t = 599/600)
    assert.deepEqual(result[599], [100 * (599 / 600), 200 * (599 / 600)]);
  });

  test('interpolates multi-segment keyframes across segments', () => {
    const pitch = new TacticalPitch();
    // 3 points -> 2 segments of 300 frames each
    const result = pitch.tweenArray([0, 0], [50, 100], [100, 0]);

    assert.equal(result.length, pitch.totalFrames);
    // Segment 0 start
    assert.deepEqual(result[0], [0, 0]);
    // Segment 0 mid (f = 150 in seg 0, framesPerSegment = 300, t = 150/300 = 0.5)
    assert.deepEqual(result[150], [25, 50]);
    // Segment 1 start (f = 300)
    assert.deepEqual(result[300], [50, 100]);
    // Segment 1 mid (f = 450 -> seg 1 f = 150, t = 0.5)
    assert.deepEqual(result[450], [75, 50]);
  });

  test('pads remaining frames with final keyframe point when result is shorter than totalFrames', () => {
    const pitch = new TacticalPitch();
    // 3 points -> 2 segments
    // Math.floor(600 / 2) = 300 per segment, 2 * 300 = 600 points total.
    // Let's test with 7 points -> 6 segments. Math.floor(600 / 6) = 100. 6 * 100 = 600.
    // What if segments = 7 -> Math.floor(600 / 7) = 85. 7 * 85 = 595. 5 points padded at the end!
    const keyframes = [
      [0, 0], [10, 10], [20, 20], [30, 30],
      [40, 40], [50, 50], [60, 60], [70, 70]
    ];
    const result = pitch.tweenArray(...keyframes);

    assert.equal(result.length, pitch.totalFrames);
    // Padded frames at the end should equal the last keyframe [70, 70]
    assert.deepEqual(result[595], [70, 70]);
    assert.deepEqual(result[599], [70, 70]);
  });

  test('handles negative and floating point coordinates correctly', () => {
    const pitch = new TacticalPitch();
    const result = pitch.tweenArray([-10.5, 20.25], [10.5, -20.25]);

    assert.equal(result.length, pitch.totalFrames);
    assert.deepEqual(result[0], [-10.5, 20.25]);
    // At t = 0.5 (frame 300) -> x = -10.5 + 21 * 0.5 = 0, y = 20.25 - 40.5 * 0.5 = 0
    assert.deepEqual(result[300], [0, 0]);
  });

  test('handles single point input safely', () => {
    const pitch = new TacticalPitch();
    const result = pitch.tweenArray([45, 55]);

    assert.equal(result.length, pitch.totalFrames);
    for (let i = 0; i < pitch.totalFrames; i++) {
      assert.deepEqual(result[i], [45, 55]);
    }
  });

  test('handles identical keyframe points across all frames', () => {
    const pitch = new TacticalPitch();
    const result = pitch.tweenArray([30, 40], [30, 40], [30, 40]);

    assert.equal(result.length, pitch.totalFrames);
    for (let i = 0; i < pitch.totalFrames; i++) {
      assert.deepEqual(result[i], [30, 40]);
    }
  });
});

describe('HeatmapCanvas', () => {
  function createMockCanvas(width = 800, height = 600) {
    const calls = [];
    const ctx = {
      scale: (...args) => calls.push(['scale', ...args]),
      clearRect: (...args) => calls.push(['clearRect', ...args]),
      fillRect: (...args) => calls.push(['fillRect', ...args]),
      strokeRect: (...args) => calls.push(['strokeRect', ...args]),
      beginPath: (...args) => calls.push(['beginPath', ...args]),
      moveTo: (...args) => calls.push(['moveTo', ...args]),
      lineTo: (...args) => calls.push(['lineTo', ...args]),
      stroke: (...args) => calls.push(['stroke', ...args]),
      fill: (...args) => calls.push(['fill', ...args]),
      ellipse: (...args) => calls.push(['ellipse', ...args]),
      fillText: (...args) => calls.push(['fillText', ...args]),
      createRadialGradient: (...args) => {
        calls.push(['createRadialGradient', ...args]);
        return { addColorStop: (...stopArgs) => calls.push(['addColorStop', ...stopArgs]) };
      },
      createLinearGradient: (...args) => {
        calls.push(['createLinearGradient', ...args]);
        return { addColorStop: (...stopArgs) => calls.push(['addColorStop', ...stopArgs]) };
      },
    };

    const canvas = {
      width: 0,
      height: 0,
      parentElement: {
        getBoundingClientRect: () => ({ width, height }),
      },
      getContext: (type) => (type === '2d' ? ctx : null),
    };

    return { canvas, ctx, calls };
  }

  test('initializes correctly and sets dimensions on resize', () => {
    const { canvas } = createMockCanvas(1000, 500);
    const heatmap = new HeatmapCanvas(canvas);

    assert.equal(heatmap.w, 1000);
    assert.equal(heatmap.h, 500);
    assert.equal(canvas.width, 1000);
    assert.equal(canvas.height, 500);
    assert.equal(heatmap.intensity, 0);
    assert.equal(heatmap.animId, null);
  });

  test('handles null parentElement during resize', () => {
    const { canvas } = createMockCanvas();
    canvas.parentElement = null;
    const heatmap = new HeatmapCanvas(canvas);

    assert.equal(heatmap.w, 800);
    assert.equal(heatmap.h, 600);
  });

  test('handles null canvas safely in constructor', () => {
    const heatmap = new HeatmapCanvas(null);
    assert.equal(heatmap.canvas, null);
    assert.equal(heatmap.ctx, null);
  });

  test('setIntensity updates intensity value', () => {
    const { canvas } = createMockCanvas();
    const heatmap = new HeatmapCanvas(canvas);

    heatmap.setIntensity(0.85);
    assert.equal(heatmap.intensity, 0.85);
  });

  test('draw executes required context rendering methods', () => {
    const { canvas, calls } = createMockCanvas(800, 600);
    const heatmap = new HeatmapCanvas(canvas);

    calls.length = 0; // Clear initialization calls
    heatmap.draw(0.7);

    const methodNames = calls.map((c) => c[0]);
    assert.ok(methodNames.includes('clearRect'));
    assert.ok(methodNames.includes('createRadialGradient'));
    assert.ok(methodNames.includes('fillRect'));
    assert.ok(methodNames.includes('strokeRect'));
    assert.ok(methodNames.includes('ellipse'));
    assert.ok(methodNames.includes('fillText'));
    assert.ok(methodNames.includes('createLinearGradient'));
  });

  test('start, animate, and destroy manage requestAnimationFrame lifecycle', () => {
    const { canvas } = createMockCanvas(800, 600);
    const heatmap = new HeatmapCanvas(canvas);

    let rafCallback = null;
    let nextId = 1;
    const origRaf = globalThis.requestAnimationFrame;
    const origCaf = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb) => {
      rafCallback = cb;
      return nextId++;
    };
    globalThis.cancelAnimationFrame = (id) => {
      if (heatmap.animId === id) {
        heatmap.animId = null;
      }
    };

    try {
      heatmap.start();
      assert.equal(heatmap.animId, 1);
      assert.notEqual(rafCallback, null);

      // Execute animation frame callback
      const initialIntensity = heatmap.intensity;
      const cb = rafCallback;
      rafCallback = null;
      cb();

      assert.ok(heatmap.intensity > initialIntensity); // Intensity moved towards 0.7
      assert.equal(heatmap.animId, 2);

      heatmap.destroy();
      assert.equal(heatmap.animId, null);
    } finally {
      globalThis.requestAnimationFrame = origRaf;
      globalThis.cancelAnimationFrame = origCaf;
    }
  });
});

describe('DropletSystem', () => {
  let originalDocument;
  let activeSystem = null;

  function createMockDOMContainer() {
    const children = [];

    function createMockElement(tagName) {
      const customProps = new Map();
      const eventListeners = new Map();

      const styleObj = {
        width: '',
        height: '',
        left: '',
        top: '',
        animation: '',
        opacity: '',
        setProperty: (key, val) => customProps.set(key, String(val)),
        getPropertyValue: (key) => customProps.get(key) || '',
      };

      const el = {
        tagName: tagName.toUpperCase(),
        className: '',
        style: styleObj,
        offsetHeight: 20,
        addEventListener: (event, handler) => {
          if (!eventListeners.has(event)) eventListeners.set(event, []);
          eventListeners.get(event).push(handler);
        },
        dispatchEvent: (event) => {
          const handlers = eventListeners.get(event) || [];
          handlers.forEach((h) => h());
        },
        remove: () => {
          const idx = children.indexOf(el);
          if (idx !== -1) children.splice(idx, 1);
        },
      };

      return el;
    }

    const container = {
      get firstChild() {
        return children[0] || null;
      },
      appendChild: (child) => {
        children.push(child);
        return child;
      },
      removeChild: (child) => {
        const idx = children.indexOf(child);
        if (idx !== -1) children.splice(idx, 1);
        return child;
      },
      getElementsByClassName: (className) => {
        return {
          get length() {
            return children.filter((child) => child.className === className).length;
          },
          item: (i) => children.filter((child) => child.className === className)[i] || null,
          [Symbol.iterator]: function* () {
            for (const m of children.filter((child) => child.className === className)) yield m;
          },
        };
      },
      _children: children,
    };

    return { container, createMockElement, children };
  }

  beforeEach(() => {
    originalDocument = globalThis.document;
    activeSystem = null;
  });

  afterEach(() => {
    if (activeSystem) {
      activeSystem.destroy();
      activeSystem = null;
    }
    globalThis.document = originalDocument;
  });

  test('initializes properties and generates initial droplet batch', () => {
    const { container, createMockElement, children } = createMockDOMContainer();
    globalThis.document = {
      createElement: (tag) => createMockElement(tag),
    };

    activeSystem = new DropletSystem(container);

    assert.equal(activeSystem.container, container);
    assert.equal(activeSystem.maxDroplets, 25);
    assert.notEqual(activeSystem.intervalId, null);
    // Constructor calls generate() twice (once directly, once via loop()), adding 3 droplets each time
    assert.equal(children.length, 6);
  });

  test('createDroplet creates element with droplet class and styled properties', () => {
    const { container, createMockElement } = createMockDOMContainer();
    globalThis.document = {
      createElement: (tag) => createMockElement(tag),
    };

    activeSystem = new DropletSystem(container);
    const el = activeSystem.createDroplet();

    assert.equal(el.className, 'droplet');
    assert.match(el.style.width, /^\d+(\.\d+)?px$/);
    assert.match(el.style.height, /^\d+(\.\d+)?px$/);
    assert.match(el.style.left, /^\d+(\.\d+)?%$/);
    assert.match(el.style.top, /^-\d+(\.\d+)?px$/);

    assert.match(el.style.getPropertyValue('--drop-duration'), /^\d+(\.\d+)?s$/);
    assert.equal(el.style.getPropertyValue('--drop-delay'), '0s');
    assert.match(el.style.getPropertyValue('--drop-distance'), /^\d+(\.\d+)?px$/);
  });

  test('generate respects maxDroplets capacity and batches up to 3 droplets', () => {
    const { container, createMockElement, children } = createMockDOMContainer();
    globalThis.document = {
      createElement: (tag) => createMockElement(tag),
    };

    activeSystem = new DropletSystem(container);
    // Constructor created 6
    assert.equal(children.length, 6);

    // Call generate again (existing = 6, capacity left = 19, so +3 droplets = 9)
    activeSystem.generate();
    assert.equal(children.length, 9);

    // Reset container children to 23 droplets manually
    children.length = 0;
    for (let i = 0; i < 23; i++) {
      const mockEl = createMockElement('div');
      mockEl.className = 'droplet';
      children.push(mockEl);
    }
    assert.equal(children.length, 23);

    // Call generate again (existing = 23, min(25 - 23, 3) = 2 droplets added)
    activeSystem.generate();
    assert.equal(children.length, 25);

    // Call generate again when full (existing = 25 >= maxDroplets)
    activeSystem.generate();
    assert.equal(children.length, 25);
  });

  test('removes droplet from container when animationend event fires', () => {
    const { container, createMockElement, children } = createMockDOMContainer();
    globalThis.document = {
      createElement: (tag) => createMockElement(tag),
    };

    activeSystem = new DropletSystem(container);
    assert.equal(children.length, 6);

    const dropletToFinish = children[0];
    dropletToFinish.dispatchEvent('animationend');

    assert.equal(children.length, 5);
    assert.equal(children.includes(dropletToFinish), false);
  });

  test('destroy clears interval timer and removes all children from container', () => {
    const { container, createMockElement, children } = createMockDOMContainer();
    globalThis.document = {
      createElement: (tag) => createMockElement(tag),
    };

    activeSystem = new DropletSystem(container);
    assert.notEqual(activeSystem.intervalId, null);
    assert.equal(children.length, 6);

    activeSystem.destroy();

    assert.equal(activeSystem.intervalId, null);
    assert.equal(children.length, 0);
  });
});
