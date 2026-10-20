const { performance } = require('perf_hooks');

// Mock canvas and context
const canvas = { width: 1920, height: 1080 };
const ctx = {
    beginPath: () => {},
    strokeStyle: '',
    lineWidth: 0,
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {}
};

function generateNodes(count) {
    const nodes = [];
    for (let i = 0; i < count; i++) {
        nodes.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            isRed: i % 2 === 0
        });
    }
    return nodes;
}

function unoptimizedLoop(nodes, canvas, ctx) {
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            if (nodes[i].isRed === nodes[j].isRed) {
                const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if (dist < canvas.width * 0.22) {
                    ctx.beginPath();
                    ctx.strokeStyle = nodes[i].isRed ? 'rgba(244, 63, 94, 0.35)' : 'rgba(59, 130, 246, 0.35)';
                    ctx.lineWidth = 1.5;
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }
    }
}

function optimizedLoop(nodes, canvas, ctx) {
    const maxDist = canvas.width * 0.22;
    const maxDistSq = maxDist * maxDist;

    const redNodes = [];
    const blueNodes = [];
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].isRed) {
            redNodes.push(nodes[i]);
        } else {
            blueNodes.push(nodes[i]);
        }
    }

    if (redNodes.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.35)';
        ctx.lineWidth = 1.5;
        let redConnected = false;
        for (let i = 0; i < redNodes.length; i++) {
            const nodeA = redNodes[i];
            for (let j = i + 1; j < redNodes.length; j++) {
                const nodeB = redNodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                if (dx * dx + dy * dy < maxDistSq) {
                    ctx.moveTo(nodeA.x, nodeA.y);
                    ctx.lineTo(nodeB.x, nodeB.y);
                    redConnected = true;
                }
            }
        }
        if (redConnected) ctx.stroke();
    }

    if (blueNodes.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
        ctx.lineWidth = 1.5;
        let blueConnected = false;
        for (let i = 0; i < blueNodes.length; i++) {
            const nodeA = blueNodes[i];
            for (let j = i + 1; j < blueNodes.length; j++) {
                const nodeB = blueNodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                if (dx * dx + dy * dy < maxDistSq) {
                    ctx.moveTo(nodeA.x, nodeA.y);
                    ctx.lineTo(nodeB.x, nodeB.y);
                    blueConnected = true;
                }
            }
        }
        if (blueConnected) ctx.stroke();
    }
}

function runBenchmark(nodeCount, iterations) {
    const nodes = generateNodes(nodeCount);

    // Warmup
    for (let i = 0; i < 100; i++) {
        unoptimizedLoop(nodes, canvas, ctx);
        optimizedLoop(nodes, canvas, ctx);
    }

    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
        unoptimizedLoop(nodes, canvas, ctx);
    }
    const endUnopt = performance.now();
    const durationUnopt = endUnopt - startUnopt;

    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
        optimizedLoop(nodes, canvas, ctx);
    }
    const endOpt = performance.now();
    const durationOpt = endOpt - startOpt;

    console.log(`--- Benchmark Results (Nodes: ${nodeCount}, Iterations: ${iterations}) ---`);
    console.log(`Unoptimized: ${durationUnopt.toFixed(3)} ms`);
    console.log(`Optimized:   ${durationOpt.toFixed(3)} ms`);
    const speedup = (durationUnopt / durationOpt).toFixed(2);
    const pct = (((durationUnopt - durationOpt) / durationUnopt) * 100).toFixed(2);
    console.log(`Speedup:     ${speedup}x (${pct}% faster)\n`);
}

function runScrollRevealBenchmark(iterations) {
    const mockElements = Array.from({ length: 20 }, (_, i) => ({
        className: 'reveal',
        getBoundingClientRect: () => ({ top: i * 50 })
    }));

    const mockDocument = {
        querySelectorAll: (selector) => mockElements.filter(el => el.className === selector.replace('.', ''))
    };

    // Warmup
    for (let i = 0; i < 1000; i++) {
        mockDocument.querySelectorAll('.reveal').forEach(el => el.getBoundingClientRect());
    }

    // Unoptimized: query inside scroll callback
    const startUnopt = performance.now();
    for (let i = 0; i < iterations; i++) {
        const reveals = mockDocument.querySelectorAll('.reveal');
        reveals.forEach(el => {
            const top = el.getBoundingClientRect().top;
        });
    }
    const durationUnopt = performance.now() - startUnopt;

    // Optimized: query outside scroll callback
    const revealsCached = mockDocument.querySelectorAll('.reveal');
    const startOpt = performance.now();
    for (let i = 0; i < iterations; i++) {
        revealsCached.forEach(el => {
            const top = el.getBoundingClientRect().top;
        });
    }
    const durationOpt = performance.now() - startOpt;

    const speedup = (durationUnopt / durationOpt).toFixed(2);
    const pct = (((durationUnopt - durationOpt) / durationUnopt) * 100).toFixed(2);
    console.log(`--- Scroll Reveal Query Benchmark (Iterations: ${iterations}) ---`);
    console.log(`Unoptimized (query inside scroll listener): ${durationUnopt.toFixed(3)} ms`);
    console.log(`Optimized   (cached query outside listener): ${durationOpt.toFixed(3)} ms`);
    console.log(`Speedup:                                   ${speedup}x (${pct}% faster)\n`);
}

console.log("Running benchmarks...\n");
runBenchmark(16, 50000);
runBenchmark(50, 20000);
runBenchmark(200, 1000);
runScrollRevealBenchmark(100000);
