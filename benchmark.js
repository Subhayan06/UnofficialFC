// Benchmark to measure performance difference between getBoundingClientRect on mousemove vs caching on mouseenter

const { performance } = require('perf_hooks');

// Benchmark configuration
const NUM_EVENTS = 100000;
const mouseEvents = Array.from({ length: NUM_EVENTS }, (_, i) => ({
    clientX: 100 + (i % 200),
    clientY: 100 + ((i * 3) % 200)
}));

// Mock DOM button element
function createMockButton() {
    return {
        classList: {
            contains: (className) => className === 'magnetic-slight'
        },
        getBoundingClientRect: () => ({
            left: 150,
            top: 150,
            width: 200,
            height: 60,
            right: 350,
            bottom: 210
        })
    };
}

// 1. Original Unoptimized Pattern (re-evaluating getBoundingClientRect on every mousemove)
function benchmarkUnoptimized(btn, events) {
    let dummyX = 0, dummyY = 0;
    const start = performance.now();

    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const rect = btn.getBoundingClientRect();
        const h = rect.width / 2;
        const w = rect.height / 2;
        const x = e.clientX - rect.left - h;
        const y = e.clientY - rect.top - w;
        const pull = btn.classList.contains('magnetic-slight') ? 0.1 : 0.3;
        dummyX += x * pull;
        dummyY += y * pull;
    }

    const end = performance.now();
    return { duration: end - start, result: dummyX + dummyY };
}

// 2. Optimized Pattern (Caching rect dimensions on mouseenter / update)
function benchmarkOptimized(btn, events) {
    let dummyX = 0, dummyY = 0;
    const start = performance.now();

    // Simulated mouseenter / cache step
    let rect = btn.getBoundingClientRect();
    let h = rect.width / 2;
    let w = rect.height / 2;
    let left = rect.left;
    let top = rect.top;
    const pull = btn.classList.contains('magnetic-slight') ? 0.1 : 0.3;

    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const x = e.clientX - left - h;
        const y = e.clientY - top - w;
        dummyX += x * pull;
        dummyY += y * pull;
    }

    const end = performance.now();
    return { duration: end - start, result: dummyX + dummyY };
}

console.log(`Running benchmark with ${NUM_EVENTS} mousemove events...`);
const btn = createMockButton();

// Warmup
benchmarkUnoptimized(btn, mouseEvents.slice(0, 1000));
benchmarkOptimized(btn, mouseEvents.slice(0, 1000));

const unoptimizedRes = benchmarkUnoptimized(btn, mouseEvents);
const optimizedRes = benchmarkOptimized(btn, mouseEvents);

console.log(`Unoptimized (getBoundingClientRect per move): ${unoptimizedRes.duration.toFixed(3)} ms`);
console.log(`Optimized (Cached geometry on mouseenter):    ${optimizedRes.duration.toFixed(3)} ms`);
console.log(`Speedup factor: ${(unoptimizedRes.duration / optimizedRes.duration).toFixed(2)}x faster`);

if (Math.abs(unoptimizedRes.result - optimizedRes.result) < 1e-5) {
    console.log(`Verification: Results match identical positions!`);
} else {
    console.error(`Verification FAILED!`);
}
