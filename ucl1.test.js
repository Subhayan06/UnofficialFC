const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { TacticalPitch, HeatmapCanvas } = require('./ucl1.js');

describe('TacticalPitch.drawPitch', () => {
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
      arc: (...args) => calls.push(['arc', ...args]),
      createRadialGradient: (...args) => {
        calls.push(['createRadialGradient', ...args]);
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

  test('draws pitch elements including grid lines accurately', () => {
    const { canvas, calls } = createMockCanvas(800, 600);
    const pitch = new TacticalPitch(canvas);

    calls.length = 0; // Reset calls from constructor/resize
    pitch.drawPitch();

    // Verify background fill and pitch outline
    const methodNames = calls.map((c) => c[0]);
    assert.ok(methodNames.includes('createRadialGradient'));
    assert.ok(methodNames.includes('fillRect'));
    assert.ok(methodNames.includes('strokeRect'));

    // Verify grid line drawing calls (9 vertical and 9 horizontal grid lines = 18 move/line/stroke pairs for grid)
    const moveCalls = calls.filter((c) => c[0] === 'moveTo');
    const lineCalls = calls.filter((c) => c[0] === 'lineTo');
    const strokeCalls = calls.filter((c) => c[0] === 'stroke');

    // 1 center line + 18 grid lines = 19 moveTo & lineTo calls
    assert.equal(moveCalls.length, 19);
    assert.equal(lineCalls.length, 19);

    // Verify grid spacing calculations (pw = 800 - 96 = 704 -> pw/10 = 70.4; ph = 600 - 96 = 504 -> ph/10 = 50.4)
    // First vertical grid line (i=1): gx = 48 + 70.4 = 118.4
    const firstVertMove = moveCalls[1]; // moveCalls[0] is center line
    assert.equal(Math.round(firstVertMove[1]), 118); // gx

    // First horizontal grid line (i=1): gy = 48 + 50.4 = 98.4
    const firstHorizMove = moveCalls[2];
    assert.equal(Math.round(firstHorizMove[2]), 98); // gy
  });
});

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
