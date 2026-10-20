const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { RainSystem, TacticalPitch, HeatmapCanvas } = require('./ucl1.js');

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

describe('RainSystem', () => {
  function createMockCanvas(offsetWidth = 800, offsetHeight = 600) {
    const calls = [];
    const ctx = {
      clearRect: (...args) => calls.push(['clearRect', ...args]),
      beginPath: (...args) => calls.push(['beginPath', ...args]),
      moveTo: (...args) => calls.push(['moveTo', ...args]),
      lineTo: (...args) => calls.push(['lineTo', ...args]),
      stroke: (...args) => calls.push(['stroke', ...args]),
      strokeStyle: '',
      lineWidth: 0,
      globalAlpha: 1,
    };

    const canvas = {
      width: 0,
      height: 0,
      offsetWidth,
      offsetHeight,
      getContext: (type) => (type === '2d' ? ctx : null),
    };

    return { canvas, ctx, calls };
  }

  test('initializes with default options and generates drops', () => {
    const { canvas } = createMockCanvas(800, 600);
    const rain = new RainSystem(canvas);

    assert.equal(rain.count, 120);
    assert.equal(rain.speed, 4);
    assert.equal(rain.length, 12);
    assert.equal(rain.opacity, 0.35);
    assert.equal(rain.w, 800);
    assert.equal(rain.h, 600);
    assert.equal(rain.drops.length, 120);
    assert.equal(rain.animId, null);

    const firstDrop = rain.drops[0];
    assert.ok(typeof firstDrop.x === 'number');
    assert.ok(typeof firstDrop.y === 'number');
    assert.ok(firstDrop.vy >= 2 && firstDrop.vy <= 6);
    assert.ok(firstDrop.len >= 6 && firstDrop.len <= 18);
    assert.ok(firstDrop.opacity >= 0.15 && firstDrop.opacity <= 0.5);
  });

  test('initializes with custom options', () => {
    const { canvas } = createMockCanvas(1000, 500);
    const opts = { count: 50, speed: 10, length: 25, opacity: 0.8 };
    const rain = new RainSystem(canvas, opts);

    assert.equal(rain.count, 50);
    assert.equal(rain.speed, 10);
    assert.equal(rain.length, 25);
    assert.equal(rain.opacity, 0.8);
    assert.equal(rain.w, 1000);
    assert.equal(rain.h, 500);
    assert.equal(rain.drops.length, 50);

    const firstDrop = rain.drops[0];
    assert.ok(firstDrop.vy >= 2 && firstDrop.vy <= 12);
    assert.ok(firstDrop.len >= 6 && firstDrop.len <= 31);
    assert.ok(firstDrop.opacity >= 0.15 && firstDrop.opacity <= 0.95);
  });

  test('handles null canvas safely in constructor and resize', () => {
    const rain = new RainSystem(null);
    assert.equal(rain.canvas, null);
    assert.equal(rain.ctx, null);
    assert.equal(rain.drops.length, 120);

    // resize should be no-op when canvas is null
    rain.resize();
    assert.equal(rain.canvas, null);
  });

  test('updates particle positions and recycles out-of-bounds drops', () => {
    const { canvas } = createMockCanvas(800, 600);
    const rain = new RainSystem(canvas, { count: 2 });

    const initialX0 = rain.drops[0].x;
    const initialY0 = rain.drops[0].y;
    const vy0 = rain.drops[0].vy;

    // Force second drop out of bounds
    rain.drops[1].y = 700; // > h + 20 (620)

    rain.update();

    // First drop should have moved
    assert.equal(rain.drops[0].y, initialY0 + vy0);
    assert.equal(rain.drops[0].x, initialX0 + vy0 * 0.15);

    // Second drop should have recycled
    assert.equal(rain.drops[1].y, -10);
    assert.ok(rain.drops[1].x >= 0 && rain.drops[1].x <= rain.w);
  });

  test('recycles drops that move past the right boundary', () => {
    const { canvas } = createMockCanvas(800, 600);
    const rain = new RainSystem(canvas, { count: 1 });

    rain.drops[0].x = 850; // > w + 20 (820)
    rain.update();

    assert.equal(rain.drops[0].y, -10);
    assert.ok(rain.drops[0].x >= 0 && rain.drops[0].x <= rain.w);
  });

  test('draw calls required context methods and updates stroke styles', () => {
    const { canvas, ctx, calls } = createMockCanvas(800, 600);
    const rain = new RainSystem(canvas, { count: 2 });

    calls.length = 0; // Clear setup calls
    rain.draw();

    assert.equal(ctx.strokeStyle, 'rgba(180, 200, 255, 0.4)');
    assert.equal(ctx.lineWidth, 1);

    const methodNames = calls.map((c) => c[0]);
    assert.ok(methodNames.includes('clearRect'));
    assert.ok(methodNames.includes('beginPath'));
    assert.ok(methodNames.includes('moveTo'));
    assert.ok(methodNames.includes('lineTo'));
    assert.ok(methodNames.includes('stroke'));

    // Verify clearRect called with full width and height
    const clearRectCall = calls.find((c) => c[0] === 'clearRect');
    assert.deepEqual(clearRectCall, ['clearRect', 0, 0, 800, 600]);
  });

  test('start, loop, stop, and destroy manage animation frame lifecycle', () => {
    const { canvas, calls } = createMockCanvas(800, 600);
    const rain = new RainSystem(canvas, { count: 2 });

    let rafCallback = null;
    let nextId = 1;
    const origRaf = globalThis.requestAnimationFrame;
    const origCaf = globalThis.cancelAnimationFrame;

    globalThis.requestAnimationFrame = (cb) => {
      rafCallback = cb;
      return nextId++;
    };
    globalThis.cancelAnimationFrame = (id) => {
      if (rain.animId === id) {
        rain.animId = null;
      }
    };

    try {
      rain.start();
      assert.equal(rain.animId, 1);
      assert.notEqual(rafCallback, null);

      // Calling start again when already running should be a no-op
      rain.start();
      assert.equal(rain.animId, 1);

      // Execute loop callback
      const cb = rafCallback;
      rafCallback = null;
      cb();

      assert.equal(rain.animId, 2);

      rain.stop();
      assert.equal(rain.animId, null);

      // Stop when already stopped is a no-op
      rain.stop();
      assert.equal(rain.animId, null);

      // Destroy stops animation and clears context
      rain.start();
      assert.equal(rain.animId, 3);
      calls.length = 0;

      rain.destroy();
      assert.equal(rain.animId, null);
      const clearRectCall = calls.find((c) => c[0] === 'clearRect');
      assert.deepEqual(clearRectCall, ['clearRect', 0, 0, 800, 600]);
    } finally {
      globalThis.requestAnimationFrame = origRaf;
      globalThis.cancelAnimationFrame = origCaf;
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
