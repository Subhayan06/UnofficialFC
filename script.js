// 1. Custom Fluid Cursor
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

document.querySelectorAll('a, .magnetic, .tilt-card, .switch-btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorOutline.style.width = '60px';
        cursorOutline.style.height = '60px';
        cursorOutline.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
        cursorOutline.style.borderColor = '#f43f5e';
    });
    el.addEventListener('mouseleave', () => {
        cursorOutline.style.width = '40px';
        cursorOutline.style.height = '40px';
        cursorOutline.style.backgroundColor = 'transparent';
        cursorOutline.style.borderColor = '#3b82f6';
    });
});

// 2. Magnetic Buttons
const magnetics = document.querySelectorAll('.magnetic, .magnetic-slight');
magnetics.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const h = rect.width / 2;
        const w = rect.height / 2;
        const x = e.clientX - rect.left - h;
        const y = e.clientY - rect.top - w;
        const pull = btn.classList.contains('magnetic-slight') ? 0.1 : 0.3;
        btn.style.transform = `translate(${x * pull}px, ${y * pull}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = `translate(0px, 0px)`;
        btn.style.transition = 'transform 0.3s ease';
    });
    btn.addEventListener('mouseenter', () => { btn.style.transition = 'none'; });
});

// 3. 3D Tilt Effect
const tiltCards = document.querySelectorAll('.tilt-card');
tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.border = '1px solid rgba(244, 63, 94, 0.6)';
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        card.style.border = '1px solid rgba(255, 255, 255, 0.05)';
        card.style.transition = 'all 0.5s ease';
    });
});

// 4. Mouse Glow & Scroll Reveal
const glowBg = document.querySelector('.glow-bg');
document.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth) * 100;
    const y = (e.clientY / window.innerHeight) * 100;
    glowBg.style.setProperty('--mouse-x', `${x}%`);
    glowBg.style.setProperty('--mouse-y', `${y}%`);
});

function reveal() {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(el => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < windowHeight - 100) el.classList.add("active");
    });
}
window.addEventListener("scroll", reveal);
reveal();

// 5. OVERHAULED HIGH-VISIBILITY INTERACTIVE TACTICAL ENGINE
const canvas = document.getElementById('tactical-bg');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let nodes = [];
let currentTactic = 'press';

// Coordinates for formations mapping a 4-3-3 setup on screen space
const formations = {
    press: [
        // Attacking Blue Team (High, wide pressing shapes)
        {x: 0.5, y: 0.15, r: false}, {x: 0.3, y: 0.25, r: false}, {x: 0.7, y: 0.25, r: false},
        {x: 0.4, y: 0.38, r: false}, {x: 0.6, y: 0.38, r: false}, {x: 0.5, y: 0.48, r: false},
        {x: 0.2, y: 0.5, r: false}, {x: 0.8, y: 0.5, r: false}, {x: 0.35, y: 0.6, r: false}, {x: 0.65, y: 0.6, r: false},
        // Defending Red Team (Squeezed and suffocating mid-lines)
        {x: 0.5, y: 0.28, r: true}, {x: 0.45, y: 0.33, r: true}, {x: 0.55, y: 0.33, r: true},
        {x: 0.35, y: 0.42, r: true}, {x: 0.65, y: 0.42, r: true}, {x: 0.5, y: 0.43, r: true}
    ],
    block: [
        // Attacking Blue Team (Pushed deep down controlling possession lines)
        {x: 0.5, y: 0.45, r: false}, {x: 0.25, y: 0.52, r: false}, {x: 0.75, y: 0.52, r: false},
        {x: 0.4, y: 0.55, r: false}, {x: 0.6, y: 0.55, r: false}, {x: 0.5, y: 0.62, r: false},
        {x: 0.3, y: 0.72, r: false}, {x: 0.7, y: 0.72, r: false}, {x: 0.45, y: 0.8, r: false}, {x: 0.55, y: 0.8, r: false},
        // Defending Red Team (Ultra-compact low block rows inside the box)
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
        this.size = 7; // Increased size for visibility
    }
    update() {
        const targetList = formations[currentTactic];
        if (this.index >= targetList.length) return;
        
        const target = targetList[this.index];
        const targetX = target.x * canvas.width;
        const targetY = target.y * canvas.height;
        this.isRed = target.r;

        // Fluid spring physics calculation to target locations
        let ax = (targetX - this.x) * 0.04;
        let ay = (targetY - this.y) * 0.04;
        
        this.vx = (this.vx + ax) * 0.85;
        this.vy = (this.vy + ay) * 0.85;
        this.x += this.vx;
        this.y += this.vy;
    }
    draw() {
        // High visibility nodes with neon core shadows
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.isRed ? '#f43f5e' : '#3b82f6';
        ctx.fillStyle = this.isRed ? '#f43f5e' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(node => { node.update(); node.draw(); });
    
    // Connect structural passing channels explicitly
    for(let i = 0; i < nodes.length; i++) {
        for(let j = i + 1; j < nodes.length; j++) {
            if(nodes[i].isRed === nodes[j].isRed) {
                const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
                // Draw high clarity connection channels if within tactical proximity limits
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
    requestAnimationFrame(animateTactics);
}

initTactics();
animateTactics();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Tactical Switch Engine Trigger
function changeTactic(type) {
    currentTactic = type;
    const buttons = document.querySelectorAll('.switch-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    buttons.forEach(b => {
        if(type === 'press' && b.textContent.includes('High Press')) b.classList.add('active');
        if(type === 'block' && b.textContent.includes('Low Block')) b.classList.add('active');
    });
}

// 6. Real-Time Absolute Countdown Timer (Synced Globally)
// TARGET LAUNCH DATE: August 29, 2026 at 00:00:00 (Exactly 86 days from today, June 4)
const launchDate = new Date("August 29, 2026 00:00:00").getTime();

function updateTimer() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    // If the countdown is finished
    if (distance < 0) {
        document.getElementById('days').innerText = "00";
        document.getElementById('hours').innerText = "00";
        document.getElementById('mins').innerText = "00";
        document.getElementById('secs').innerText = "00";
        return;
    }

    // Absolute time calculations for Days, Hours, Minutes, and Seconds
    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    // Inject into DOM with padding zeroes
    document.getElementById('days').innerText = d.toString().padStart(2, '0');
    document.getElementById('hours').innerText = h.toString().padStart(2, '0');
    document.getElementById('mins').innerText = m.toString().padStart(2, '0');
    document.getElementById('secs').innerText = s.toString().padStart(2, '0');
}

// Execute loop precisely every 1 second
setInterval(updateTimer, 1000);
updateTimer();