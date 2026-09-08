// ============================================================
// GSAP-POWERED PREMIUM ANIMATION ENGINE
// All manual math loops replaced with GSAP's liquid-smooth engine
// ============================================================

// ---- Ensure GSAP is loaded before proceeding ----
if (typeof gsap === 'undefined' && typeof console !== 'undefined') {
    console.warn('GSAP not loaded - falling back');
}

// ============================================================
// 1. PREMIUM FLUID CURSOR — GSAP quickTo for zero jitter
// ============================================================
if (typeof document !== 'undefined') {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    if (cursorDot && cursorOutline && typeof gsap !== 'undefined') {
        // GSAP quickTo creates ultra-efficient ticker-driven setters
        const dotX = gsap.quickTo(cursorDot, 'x', { duration: 0, ease: 'none' });
        const dotY = gsap.quickTo(cursorDot, 'y', { duration: 0, ease: 'none' });
        const outlineX = gsap.quickTo(cursorOutline, 'x', { duration: 0.5, ease: 'power2.out' });
        const outlineY = gsap.quickTo(cursorOutline, 'y', { duration: 0.5, ease: 'power2.out' });

        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;
            dotX(posX);
            dotY(posY);
            outlineX(posX);
            outlineY(posY);
        });

        // Cursor hover expansion — GSAP-driven
        document.querySelectorAll('a, .magnetic, .tilt-card, .switch-btn').forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(cursorOutline, {
                    width: 60,
                    height: 60,
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    borderColor: '#f43f5e',
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(cursorOutline, {
                    width: 40,
                    height: 40,
                    backgroundColor: 'transparent',
                    borderColor: '#3b82f6',
                    duration: 0.3,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            });
        });
    }
}

// ============================================================
// 2. MAGNETIC BUTTONS — GSAP premium inertia
// ============================================================
if (typeof document !== 'undefined') {
    const magnetics = document.querySelectorAll('.magnetic, .magnetic-slight');
    magnetics.forEach(btn => {
        let leaveTimeline;
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const w = rect.height / 2;
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - w;
            const pull = btn.classList.contains('magnetic-slight') ? 0.1 : 0.3;

            // Kill any leave tween in progress
            if (leaveTimeline) leaveTimeline.kill();

            if (typeof gsap !== 'undefined') {
                gsap.to(btn, {
                    x: x * pull,
                    y: y * pull,
                    duration: 0.6,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            }
        });
        btn.addEventListener('mouseleave', () => {
            if (typeof gsap !== 'undefined') {
                leaveTimeline = gsap.to(btn, {
                    x: 0,
                    y: 0,
                    duration: 0.5,
                    ease: 'elastic.out(1, 0.3)',
                    overwrite: 'auto'
                });
            }
        });
    });
}

// ============================================================
// 3. PREMIUM 3D TILT CARDS — GSAP fluid rotation + neon glow
// ============================================================
if (typeof document !== 'undefined') {
    const tiltCards = document.querySelectorAll('.tilt-card');
    tiltCards.forEach(card => {
        let leaveTween;
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -8;
            const rotateY = ((x - centerX) / centerX) * 8;

            if (leaveTween) leaveTween.kill();

            if (typeof gsap !== 'undefined') {
                gsap.to(card, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    scale: 1.02,
                    borderColor: 'rgba(244, 63, 94, 0.6)',
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: 'auto',
                    transformPerspective: 1000,
                    transformOrigin: 'center center'
                });
            }
        });
        card.addEventListener('mouseleave', () => {
            if (typeof gsap !== 'undefined') {
                leaveTween = gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    scale: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                    duration: 0.7,
                    ease: 'elastic.out(1, 0.4)',
                    overwrite: 'auto'
                });
            }
        });
    });
}

// ============================================================
// 4. MOUSE GLOW — GSAP-driven radial gradient position
// ============================================================
if (typeof document !== 'undefined') {
    const glowBg = document.querySelector('.glow-bg');
    if (glowBg) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth) * 100;
            const y = (e.clientY / window.innerHeight) * 100;
            if (typeof gsap !== 'undefined') {
                gsap.to(glowBg, {
                    '--mouse-x': `${x}%`,
                    '--mouse-y': `${y}%`,
                    duration: 1.2,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            }
        });
    }
}

// ============================================================
// 5. SCROLL REVEAL — GSAP-powered (kept simple)
// ============================================================
function reveal() {
    if (typeof document === 'undefined') return;
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) {
            if (typeof gsap !== 'undefined') {
                gsap.to(el, {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    ease: 'power3.out',
                    overwrite: 'auto'
                });
            }
        }
    });
}
if (typeof window !== 'undefined') {
    window.addEventListener('scroll', reveal);
    reveal();
}

// ============================================================
// 6. TACTICAL ENGINE — 2D Canvas (keeps rAF, GSAP not needed for canvas drawing)
// ============================================================
let canvas, ctx;
if (typeof document !== 'undefined') {
    canvas = document.getElementById('tactical-bg');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}
if (!canvas) {
    canvas = { width: 1000, height: 800 };
}

let nodes = [];
let currentTactic = 'press';

const formations = {
    press: [
        {x: 0.5, y: 0.15, r: false}, {x: 0.3, y: 0.25, r: false}, {x: 0.7, y: 0.25, r: false},
        {x: 0.4, y: 0.38, r: false}, {x: 0.6, y: 0.38, r: false}, {x: 0.5, y: 0.48, r: false},
        {x: 0.2, y: 0.5, r: false}, {x: 0.8, y: 0.5, r: false}, {x: 0.35, y: 0.6, r: false}, {x: 0.65, y: 0.6, r: false},
        {x: 0.5, y: 0.28, r: true}, {x: 0.45, y: 0.33, r: true}, {x: 0.55, y: 0.33, r: true},
        {x: 0.35, y: 0.42, r: true}, {x: 0.65, y: 0.42, r: true}, {x: 0.5, y: 0.43, r: true}
    ],
    block: [
        {x: 0.5, y: 0.45, r: false}, {x: 0.25, y: 0.52, r: false}, {x: 0.75, y: 0.52, r: false},
        {x: 0.4, y: 0.55, r: false}, {x: 0.6, y: 0.55, r: false}, {x: 0.5, y: 0.62, r: false},
        {x: 0.3, y: 0.72, r: false}, {x: 0.7, y: 0.72, r: false}, {x: 0.45, y: 0.8, r: false}, {x: 0.55, y: 0.8, r: false},
        {x: 0.5, y: 0.82, r: true}, {x: 0.48, y: 0.75, r: true}, {x: 0.52, y: 0.75, r: true},
        {x: 0.42, y: 0.73, r: true}, {x: 0.58, y: 0.73, r: true}, {x: 0.5, y: 0.68, r: true}
    ]
};

class TacticalNode {
    constructor(index) {
        this.index = index;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = 0; this.vy = 0;
        this.size = 7;
    }
    update() {
        const targetList = formations[currentTactic];
        if (this.index >= targetList.length) return;

        const target = targetList[this.index];
        const targetX = target.x * canvas.width;
        const targetY = target.y * canvas.height;
        this.isRed = target.r;

        let ax = (targetX - this.x) * 0.04;
        let ay = (targetY - this.y) * 0.04;

        this.vx = (this.vx + ax) * 0.85;
        this.vy = (this.vy + ay) * 0.85;
        this.x += this.vx;
        this.y += this.vy;
    }
    draw() {
        if (!ctx) return;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.isRed ? '#f43f5e' : '#3b82f6';
        ctx.fillStyle = this.isRed ? '#f43f5e' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function initTactics() {
    nodes = [];
    const totalPositions = Math.max(formations.press.length, formations.block.length);
    for(let i = 0; i < totalPositions; i++) {
        nodes.push(new TacticalNode(i));
    }
}

function animateTactics() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(node => { node.update(); node.draw(); });

    for(let i = 0; i < nodes.length; i++) {
        for(let j = i + 1; j < nodes.length; j++) {
            if(nodes[i].isRed === nodes[j].isRed) {
                const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                if(dist < canvas.width * 0.22) {
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
    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(animateTactics);
    }
}

if (typeof window !== 'undefined' && ctx) {
    initTactics();
    animateTactics();

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

function changeTactic(type) {
    currentTactic = type;
    if (typeof document !== 'undefined') {
        const buttons = document.querySelectorAll('.switch-btn');
        buttons.forEach(b => b.classList.remove('active'));

        buttons.forEach(b => {
            if(type === 'press' && b.textContent.includes('High Press')) b.classList.add('active');
            if(type === 'block' && b.textContent.includes('Low Block')) b.classList.add('active');
        });
    }
}

// ============================================================
// 7. REAL-TIME COUNTDOWN TIMER (unchanged, pure JS)
// ============================================================
const launchDate = new Date("September 18, 2026 00:00:00 UTC").getTime();

function updateTimer() {
    if (typeof document === 'undefined') return;
    const now = new Date().getTime();
    const distance = launchDate - now;

    const daysEl = document.getElementById('days');
    if (!daysEl) return;

    if (distance < 0) {
        daysEl.innerText = "00";
        document.getElementById('hours').innerText = "00";
        document.getElementById('mins').innerText = "00";
        document.getElementById('secs').innerText = "00";
        return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    daysEl.innerText = d.toString().padStart(2, '0');
    document.getElementById('hours').innerText = h.toString().padStart(2, '0');
    document.getElementById('mins').innerText = m.toString().padStart(2, '0');
    document.getElementById('secs').innerText = s.toString().padStart(2, '0');
}

if (typeof document !== 'undefined') {
    setInterval(updateTimer, 1000);
    updateTimer();
}

// ============================================================
// 8. FORM SUBMISSION ANIMATION — GSAP Timeline for tactical play
// ============================================================
if (typeof document !== 'undefined') {
    document.addEventListener("DOMContentLoaded", () => {
        const contactForm = document.getElementById('contactForm');

        if(contactForm) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const form = e.target;
                const formData = new FormData(form);

                const animContainer = document.getElementById('mission-control');
                const statusText = document.getElementById('status-text');
                const ball = document.getElementById('anim-ball');
                const tickPop = document.getElementById('success-tick');

                const bgNodes = [document.getElementById('bg1'), document.getElementById('bg2'), document.getElementById('bg3'), document.getElementById('bg4'), document.getElementById('bg5')];
                const bkNodes = [document.getElementById('bk1'), document.getElementById('bk2'), document.getElementById('bk3'), document.getElementById('bk4'), document.getElementById('bk5')];

                form.style.display = "none";
                animContainer.style.display = "block";

                // Fire the backend payload silently
                fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData }).catch(err => console.error(err));

                // ---- GSAP POWERED TACTICAL PLAY ----
                // Create master timeline
                const masterTL = gsap.timeline();

                // Phase 1: Blaugrana team pushes up + Black team scrambles
                masterTL.to(bgNodes[0], { left: '40%', top: '50%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bgNodes[1], { left: '55%', top: '20%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bgNodes[2], { left: '60%', top: '70%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bgNodes[3], { left: '75%', top: '15%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bgNodes[4], { left: '85%', top: '45%', duration: 0.8, ease: 'power2.inOut' }, 0);

                masterTL.to(bkNodes[0], { left: '70%', top: '25%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bkNodes[1], { left: '80%', top: '40%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bkNodes[2], { left: '75%', top: '65%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bkNodes[3], { left: '65%', top: '85%', duration: 0.8, ease: 'power2.inOut' }, 0);
                masterTL.to(bkNodes[4], { left: '55%', top: '55%', duration: 0.8, ease: 'power2.inOut' }, 0);

                // Phase 2: Tiki-Taka ball movement (pass to #8, switch to #10, killer ball to #9, finish)
                masterTL.to(ball, { left: '37%', top: '27%', duration: 1.2, ease: 'power1.inOut' }, 0.3);
                masterTL.to(ball, { left: '62%', top: '72%', duration: 1.5, ease: 'power1.inOut' }, 1.6);
                masterTL.to(ball, { left: '83%', top: '47%', duration: 1.3, ease: 'power1.inOut' }, 3.2);
                masterTL.to(ball, { left: '96%', top: '42%', duration: 0.5, ease: 'back.inOut(2)' }, 4.6);

                // Phase 3: Post-goal — update status + show success tick
                masterTL.call(() => {
                    statusText.innerText = 'INTEL RECEIVED';
                    statusText.style.color = '#fff';
                }, [], '+=0.1');
                masterTL.to(tickPop, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' }, '+=0');
                masterTL.to(tickPop, { opacity: 0, duration: 0.3 }, '+=2');
                masterTL.to(animContainer, { opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.2');

                // Phase 4: Reset everything
                masterTL.call(() => {
                    // Reset state
                    statusText.innerText = 'UPLOADING TACTICS...';
                    statusText.style.color = '#00ff66';
                    tickPop.style.transform = 'translate(-50%, -50%) scale(0)';
                    tickPop.style.opacity = '0';
                    animContainer.style.display = 'none';
                    animContainer.style.opacity = '1';

                    // Reset nodes instantly
                    bgNodes[0].style.left = '20%'; bgNodes[0].style.top = '50%';
                    bgNodes[1].style.left = '35%'; bgNodes[1].style.top = '25%';
                    bgNodes[2].style.left = '35%'; bgNodes[2].style.top = '75%';
                    bgNodes[3].style.left = '45%'; bgNodes[3].style.top = '10%';
                    bgNodes[4].style.left = '50%'; bgNodes[4].style.top = '85%';

                    bkNodes[0].style.left = '60%'; bkNodes[0].style.top = '20%';
                    bkNodes[1].style.left = '65%'; bkNodes[1].style.top = '40%';
                    bkNodes[2].style.left = '65%'; bkNodes[2].style.top = '60%';
                    bkNodes[3].style.left = '60%'; bkNodes[3].style.top = '80%';
                    bkNodes[4].style.left = '45%'; bkNodes[4].style.top = '50%';

                    ball.style.left = '22%';
                    ball.style.top = '52%';
                    ball.style.transition = 'none';

                    form.reset();
                    form.style.display = 'block';
                });
            });
        }
    });
}

// ============================================================
// 9. THREE.JS 3D MATRIX ENGINE — GSAP-Enhanced Parallax & Trails
// ============================================================
(function initMatrixEngine() {
    if (typeof document === 'undefined' || typeof THREE === 'undefined') return;
    const canvas = document.getElementById('homepage-matrix-canvas');
    if (!canvas) return;

    // ---- Scene Setup ----
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ---- Neon Grids ----
    const gridHelper = new THREE.GridHelper(12, 20, 0x3b82f6, 0x1e3a8a);
    gridHelper.position.y = -0.5;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.4;
    scene.add(gridHelper);

    const gridHelper2 = new THREE.GridHelper(10, 16, 0xf43f5e, 0x1e3a8a);
    gridHelper2.position.y = 0.3;
    gridHelper2.rotation.x = 0.1;
    gridHelper2.rotation.z = 0.3;
    gridHelper2.material.transparent = true;
    gridHelper2.material.opacity = 0.2;
    scene.add(gridHelper2);

    // ---- Floating Wireframe Geometries ----
    const dodecGeo = new THREE.DodecahedronGeometry(0.6);
    const dodecMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.25
    });
    const dodec = new THREE.Mesh(dodecGeo, dodecMat);
    dodec.position.set(-2, 0.5, -1.5);
    scene.add(dodec);

    const icoGeo = new THREE.IcosahedronGeometry(0.5);
    const icoMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e, wireframe: true, transparent: true, opacity: 0.2
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    ico.position.set(2.2, -0.2, -2);
    scene.add(ico);

    const knotGeo = new THREE.TorusKnotGeometry(0.4, 0.15, 64, 8);
    const knotMat = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.15
    });
    const knot = new THREE.Mesh(knotGeo, knotMat);
    knot.position.set(0, 0.8, -3);
    scene.add(knot);

    // ---- Scattered floating node points ----
    const nodeCount = 60;
    const nodeGeo = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount; i++) {
        const radius = 4 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI - Math.PI / 2;
        nodePositions[i * 3] = Math.cos(theta) * radius;
        nodePositions[i * 3 + 1] = Math.sin(phi) * 1.5 + 0.5;
        nodePositions[i * 3 + 2] = Math.sin(theta) * radius - 2;
        const isBlue = Math.random() > 0.5;
        nodeColors[i * 3] = isBlue ? 0.23 : 0.96;
        nodeColors[i * 3 + 1] = isBlue ? 0.51 : 0.25;
        nodeColors[i * 3 + 2] = isBlue ? 0.96 : 0.37;
    }
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));
    const nodeMat = new THREE.PointsMaterial({
        size: 0.08, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
    });
    const nodePoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(nodePoints);

    // ---- Connecting lines between nearby nodes ----
    const linePairs = [];
    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const dx = nodePositions[i * 3] - nodePositions[j * 3];
            const dy = nodePositions[i * 3 + 1] - nodePositions[j * 3 + 1];
            const dz = nodePositions[i * 3 + 2] - nodePositions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 2.2 && Math.random() > 0.6) {
                linePairs.push(i, j);
            }
        }
    }
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(linePairs.length * 3 * 2);
    for (let k = 0; k < linePairs.length; k += 2) {
        const i = linePairs[k];
        const j = linePairs[k + 1];
        linePositions[k * 3 + 0] = nodePositions[i * 3];
        linePositions[k * 3 + 1] = nodePositions[i * 3 + 1];
        linePositions[k * 3 + 2] = nodePositions[i * 3 + 2];
        linePositions[(k + 1) * 3 + 0] = nodePositions[j * 3];
        linePositions[(k + 1) * 3 + 1] = nodePositions[j * 3 + 1];
        linePositions[(k + 1) * 3 + 2] = nodePositions[j * 3 + 2];
    }
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.12 });
    const lineMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lineMesh);

    // ============================================================
    // GSAP-POWERED TRAIL PARTICLE SYSTEM
    // ============================================================
    let trailParticles = [];
    const TRAIL_MAX = 30;
    const trailGeo = new THREE.BufferGeometry();
    const trailPosArr = new Float32Array(TRAIL_MAX * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPosArr, 3));
    const trailMat = new THREE.PointsMaterial({
        color: 0x3b82f6, size: 0.15, transparent: true, opacity: 0.8,
        blending: THREE.AdditiveBlending, depthWrite: false
    });
    const trailMesh = new THREE.Points(trailGeo, trailMat);
    scene.add(trailMesh);

    // ============================================================
    // GSAP-POWERED CURSOR PARALLAX — replaces manual lerp loop
    // ============================================================
    const parallaxState = { x: 0, y: 0 };
    let prevMouseX = 0, prevMouseY = 0, mouseSpeed = 0;

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) * 2 - 1;
        const y = -(e.clientY / window.innerHeight) * 2 + 1;

        // GSAP-driven smooth parallax interpolation
        if (typeof gsap !== 'undefined') {
            gsap.to(parallaxState, {
                x: x * 0.2,
                y: y * 0.15,
                duration: 0.8,
                ease: 'power2.out',
                overwrite: 'auto',
                onUpdate: () => {
                    scene.rotation.x = parallaxState.y;
                    scene.rotation.y = parallaxState.x;
                }
            });
        }

        // Speed calculation for trail spawning
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        mouseSpeed = Math.sqrt(dx * dx + dy * dy);
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
    });

    // ---- Animation Loop ----
    let lastTrailSpawn = 0;

    function animateMatrix(time) {
        requestAnimationFrame(animateMatrix);

        // ---- Rotate floating geometries ----
        dodec.rotation.x += 0.003;
        dodec.rotation.y += 0.007;
        ico.rotation.x += 0.005;
        ico.rotation.y -= 0.004;
        knot.rotation.x += 0.002;
        knot.rotation.y += 0.006;

        // Subtle node bobbing
        const positions = nodePoints.geometry.attributes.position.array;
        for (let i = 0; i < nodeCount; i++) {
            positions[i * 3 + 1] += Math.sin(time * 0.001 + i) * 0.0003;
        }
        nodePoints.geometry.attributes.position.needsUpdate = true;

        // ---- GSAP-powered Trail Particles ----
        if (mouseSpeed > 15 && time - lastTrailSpawn > 80) {
            lastTrailSpawn = time;
            const count = Math.min(3, Math.floor(mouseSpeed / 20));
            for (let c = 0; c < count; c++) {
                if (trailParticles.length >= TRAIL_MAX) {
                    trailParticles.shift();
                }
                const x = (prevMouseX / window.innerWidth) * 2 - 1;
                const y = -(prevMouseY / window.innerHeight) * 2 + 1;
                const worldX = (x * 5) + (Math.random() - 0.5) * 0.3;
                const worldY = (y * 3) + (Math.random() - 0.5) * 0.3;
                const worldZ = -1 + (Math.random() - 0.5) * 0.5;

                const particle = {
                    x: worldX, y: worldY, z: worldZ,
                    mesh: trailMesh,
                    idx: trailParticles.length
                };
                trailParticles.push(particle);

                // GSAP timeline for each trail — scale, pulse, fade to 0 with hardware acceleration
                if (typeof gsap !== 'undefined') {
                    gsap.to(particle, {
                        x: worldX + (Math.random() - 0.5) * 0.5,
                        y: worldY + (Math.random() - 0.5) * 0.5,
                        z: worldZ - 0.5,
                        duration: 0.8 + Math.random() * 0.5,
                        ease: 'power2.out',
                        overwrite: 'auto',
                        onUpdate: function() {
                            // Update the trail mesh position buffer
                            const pos = trailMesh.geometry.attributes.position.array;
                            const idx = trailParticles.indexOf(particle);
                            if (idx >= 0) {
                                pos[idx * 3] = particle.x;
                                pos[idx * 3 + 1] = particle.y;
                                pos[idx * 3 + 2] = particle.z;
                                trailMesh.geometry.attributes.position.needsUpdate = true;
                            }
                        }
                    });

                    // Fade out and remove
                    gsap.to(particle, {
                        opacity: 0,
                        duration: 1.2,
                        delay: 0.3,
                        ease: 'power2.in',
                        overwrite: 'auto',
                        onComplete: () => {
                            const idx = trailParticles.indexOf(particle);
                            if (idx >= 0) {
                                trailParticles.splice(idx, 1);
                            }
                        }
                    });
                }
            }
        }

        // ---- Mouse speed decay ----
        mouseSpeed *= 0.92;

        // ---- Update trail mesh opacity based on count ----
        trailMesh.material.opacity = Math.min(0.8, trailParticles.length / TRAIL_MAX);

        // ---- Zero out dead particle slots ----
        const trailPos = trailMesh.geometry.attributes.position.array;
        const aliveCount = trailParticles.length;
        for (let i = aliveCount; i < TRAIL_MAX; i++) {
            trailPos[i * 3] = 0;
            trailPos[i * 3 + 1] = 0;
            trailPos[i * 3 + 2] = 0;
        }
        trailMesh.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    }

    // ---- Handle Resize ----
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // ---- Start Engine ----
    animateMatrix(0);
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TacticalNode,
        formations,
        get currentTactic() { return currentTactic; },
        set currentTactic(val) { currentTactic = val; },
        canvas,
        changeTactic
    };
}
