// 1. Custom Fluid Cursor
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    // Dot follows instantly
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Outline follows with slight delay for fluidity
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Hover state for cursor
document.querySelectorAll('a, .magnetic, .tilt-card').forEach(el => {
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

// 2. Magnetic Buttons UI Effect
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
    btn.addEventListener('mouseenter', () => {
        btn.style.transition = 'none';
    });
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
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'none';
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
reveal(); // Trigger on load

// 5. Dynamic Tactical Canvas (Red vs Blue Nodes)
const canvas = document.getElementById('tactical-bg');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let nodes = [];
class TacticalNode {
    constructor(x, y, isRed) {
        this.x = x; this.y = y;
        this.baseX = x; this.baseY = y;
        this.isRed = isRed;
        this.size = Math.random() * 2 + 2;
        this.vx = (Math.random() - 0.5) * 0.8;
        this.vy = (Math.random() - 0.5) * 0.8;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        if (Math.abs(this.x - this.baseX) > 40) this.vx *= -1;
        if (Math.abs(this.y - this.baseY) > 40) this.vy *= -1;
    }
    draw() {
        ctx.fillStyle = this.isRed ? '#f43f5e' : '#3b82f6';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initTactics() {
    nodes = [];
    for(let i=0; i<60; i++) {
        nodes.push(new TacticalNode(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() > 0.5));
    }
}

function animateTactics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    nodes.forEach(node => { node.update(); node.draw(); });
    
    // Draw passing networks
    for(let i=0; i<nodes.length; i++) {
        for(let j=i+1; j<nodes.length; j++) {
            const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
            if(dist < 120 && nodes[i].isRed === nodes[j].isRed) {
                ctx.beginPath();
                ctx.strokeStyle = nodes[i].isRed ? `rgba(244, 63, 94, ${1 - dist/120})` : `rgba(59, 130, 246, ${1 - dist/120})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateTactics);
}
initTactics(); animateTactics();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initTactics();
});

// 6. Countdown Timer (86 Days)
let totalSeconds = 86 * 24 * 3600; 
function updateTimer() {
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    document.getElementById('days').innerText = d.toString().padStart(2, '0');
    document.getElementById('hours').innerText = h.toString().padStart(2, '0');
    document.getElementById('mins').innerText = m.toString().padStart(2, '0');
    document.getElementById('secs').innerText = s.toString().padStart(2, '0');
    if (totalSeconds > 0) totalSeconds--;
}
setInterval(updateTimer, 1000);
updateTimer();