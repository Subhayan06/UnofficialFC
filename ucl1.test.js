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

describe('TacticalPitch.setMoment', () => {
  test('updates currentMoment and resets frame to 0 when given a valid moment index', () => {
    const pitch = new TacticalPitch();
    pitch.frame = 150;

    pitch.setMoment(1);

    assert.equal(pitch.currentMoment, 1);
    assert.equal(pitch.frame, 0);

    pitch.frame = 250;
    pitch.setMoment(2);

    assert.equal(pitch.currentMoment, 2);
    assert.equal(pitch.frame, 0);
  });

  test('does not update currentMoment or frame when index is out of bounds', () => {
    const pitch = new TacticalPitch();
    pitch.setMoment(1);
    pitch.frame = 75;

    // Test negative index
    pitch.setMoment(-1);
    assert.equal(pitch.currentMoment, 1);
    assert.equal(pitch.frame, 75);

    // Test index equal to moments.length
    pitch.setMoment(pitch.moments.length);
    assert.equal(pitch.currentMoment, 1);
    assert.equal(pitch.frame, 75);

    // Test index greater than moments.length
    pitch.setMoment(99);
    assert.equal(pitch.currentMoment, 1);
    assert.equal(pitch.frame, 75);
  });

  test('calls drawFrame with (idx, 0) for valid index and does not call drawFrame for invalid index', () => {
    const pitch = new TacticalPitch();
    const drawCalls = [];
    pitch.drawFrame = (momentIdx, frameIdx) => {
      drawCalls.push([momentIdx, frameIdx]);
    };

    pitch.setMoment(2);
    assert.equal(drawCalls.length, 1);
    assert.deepEqual(drawCalls[0], [2, 0]);

    pitch.setMoment(-1);
    pitch.setMoment(10);
    assert.equal(drawCalls.length, 1);
  });
});
