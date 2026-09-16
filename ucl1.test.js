const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { TacticalPitch } = require('./ucl1.js');

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

describe('TacticalPitch.toCanvas', () => {
  test('maps normalized origin (0, 0) to top-left padding coordinates [padX, padY]', () => {
    const pitch = new TacticalPitch();
    pitch.w = 800;
    pitch.h = 600;

    const padX = pitch.w * 0.06; // 48
    const padY = pitch.h * 0.08; // 48
    const [cx, cy] = pitch.toCanvas(0, 0);

    assert.equal(cx, padX);
    assert.equal(cy, padY);
  });

  test('maps normalized max bounds (100, 100) to bottom-right pitch boundary [w - padX, h - padY]', () => {
    const pitch = new TacticalPitch();
    pitch.w = 800;
    pitch.h = 600;

    const padX = pitch.w * 0.06;
    const padY = pitch.h * 0.08;
    const [cx, cy] = pitch.toCanvas(100, 100);

    assert.equal(cx, pitch.w - padX);
    assert.equal(cy, pitch.h - padY);
  });

  test('maps normalized center (50, 50) to exact canvas center [w / 2, h / 2]', () => {
    const pitch = new TacticalPitch();
    pitch.w = 800;
    pitch.h = 600;

    const [cx, cy] = pitch.toCanvas(50, 50);

    assert.equal(cx, pitch.w / 2);
    assert.equal(cy, pitch.h / 2);
  });

  test('transforms arbitrary floating-point coordinates accurately', () => {
    const pitch = new TacticalPitch();
    pitch.w = 800;
    pitch.h = 600;

    // scaleX = (800 - 96)/100 = 7.04; cx = 48 + 25.5 * 7.04 = 227.52
    // scaleY = (600 - 96)/100 = 5.04; cy = 48 + 75.25 * 5.04 = 427.26
    const [cx, cy] = pitch.toCanvas(25.5, 75.25);

    assert.equal(Math.round(cx * 100) / 100, 227.52);
    assert.equal(Math.round(cy * 100) / 100, 427.26);
  });

  test('handles out-of-bounds inputs (< 0 and > 100) correctly', () => {
    const pitch = new TacticalPitch();
    pitch.w = 800;
    pitch.h = 600;

    // x = -10 -> 48 + (-10) * 7.04 = -22.4
    // y = 110 -> 48 + 110 * 5.04 = 602.4
    const [cx, cy] = pitch.toCanvas(-10, 110);

    assert.equal(Math.round(cx * 10) / 10, -22.4);
    assert.equal(Math.round(cy * 10) / 10, 602.4);
  });

  test('calculates coordinates correctly across different canvas dimensions and aspect ratios', () => {
    const pitch = new TacticalPitch();
    pitch.w = 1200;
    pitch.h = 400;

    // padX = 1200 * 0.06 = 72; scaleX = (1200 - 144)/100 = 10.56
    // padY = 400 * 0.08 = 32; scaleY = (400 - 64)/100 = 3.36
    const origin = pitch.toCanvas(0, 0);
    const center = pitch.toCanvas(50, 50);
    const max = pitch.toCanvas(100, 100);

    assert.deepEqual(origin, [72, 32]);
    assert.deepEqual(center, [600, 200]);
    assert.deepEqual(max, [1128, 368]);
  });
});
