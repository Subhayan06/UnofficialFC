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

const canvas = document.getElementById('tactical-bg');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
    requestAnimationFrame(animateTactics);
}

initTactics();
animateTactics();

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function changeTactic(type) {
    currentTactic = type;
    const buttons = document.querySelectorAll('.switch-btn');
    buttons.forEach(b => b.classList.remove('active'));
    
    buttons.forEach(b => {
        if(type === 'press' && b.textContent.includes('High Press')) b.classList.add('active');
        if(type === 'block' && b.textContent.includes('Low Block')) b.classList.add('active');
    });
}

const launchDate = new Date("August 29, 2026 00:00:00").getTime();

function updateTimer() {
    const now = new Date().getTime();
    const distance = launchDate - now;

    if (distance < 0) {
        document.getElementById('days').innerText = "00";
        document.getElementById('hours').innerText = "00";
        document.getElementById('mins').innerText = "00";
        document.getElementById('secs').innerText = "00";
        return;
    }

    const d = Math.floor(distance / (1000 * 60 * 60 * 24));
    const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = d.toString().padStart(2, '0');
    document.getElementById('hours').innerText = h.toString().padStart(2, '0');
    document.getElementById('mins').innerText = m.toString().padStart(2, '0');
    document.getElementById('secs').innerText = s.toString().padStart(2, '0');
}

setInterval(updateTimer, 1000);
updateTimer();

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

            fetch('https://api.web3forms.com/submit', { method: 'POST', body: formData }).catch(err => console.error(err));

            setTimeout(() => {
                bgNodes[0].style.left = "40%"; 
                bgNodes[1].style.left = "55%"; bgNodes[1].style.top = "20%";
                bgNodes[2].style.left = "60%"; bgNodes[2].style.top = "70%";
                bgNodes[3].style.left = "75%"; bgNodes[3].style.top = "15%";
                bgNodes[4].style.left = "85%"; bgNodes[4].style.top = "45%"; 

                bkNodes[0].style.left = "70%"; bkNodes[0].style.top = "25%";
                bkNodes[1].style.left = "80%"; bkNodes[1].style.top = "40%";
                bkNodes[2].style.left = "75%"; bkNodes[2].style.top = "65%";
                bkNodes[3].style.left = "65%"; bkNodes[3].style.top = "85%";
                bkNodes[4].style.left = "55%"; bkNodes[4].style.top = "55%";

                ball.style.transition = "all 1.2s linear";
                ball.style.left = "37%"; ball.style.top = "27%"; 

                setTimeout(() => {
                    ball.style.transition = "all 1.5s linear";
                    ball.style.left = "62%"; ball.style.top = "72%"; 
                }, 1200);

                setTimeout(() => {
                    ball.style.transition = "all 1.3s linear";
                    ball.style.left = "83%"; ball.style.top = "47%"; 
                }, 2700);

                setTimeout(() => {
                    ball.style.transition = "all 0.5s cubic-bezier(0.1, 0.9, 0.2, 1)";
                    ball.style.left = "96%"; ball.style.top = "42%"; 
                }, 4200);
            }, 100);

            setTimeout(() => {
                statusText.innerText = "INTEL RECEIVED";
                statusText.style.color = "#fff";
                tickPop.classList.add('show');

                setTimeout(() => {
                    animContainer.style.opacity = "0"; 

                    setTimeout(() => {
                        animContainer.style.display = "none";
                        animContainer.style.opacity = "1"; 
                        statusText.innerText = "UPLOADING TACTICS...";
                        statusText.style.color = "#00ff66";
                        tickPop.classList.remove('show');
                        
                        bgNodes[0].style.left = "20%"; bgNodes[0].style.top = "50%";
                        bgNodes[1].style.left = "35%"; bgNodes[1].style.top = "25%";
                        bgNodes[2].style.left = "35%"; bgNodes[2].style.top = "75%";
                        bgNodes[3].style.left = "45%"; bgNodes[3].style.top = "10%";
                        bgNodes[4].style.left = "50%"; bgNodes[4].style.top = "85%";
                        
                        bkNodes[0].style.left = "60%"; bkNodes[0].style.top = "20%";
                        bkNodes[1].style.left = "65%"; bkNodes[1].style.top = "40%";
                        bkNodes[2].style.left = "65%"; bkNodes[2].style.top = "60%";
                        bkNodes[3].style.left = "60%"; bkNodes[3].style.top = "80%";
                        bkNodes[4].style.left = "45%"; bkNodes[4].style.top = "50%";
                        
                        ball.style.transition = "none";
                        ball.style.left = "22%"; ball.style.top = "52%";
                        
                        form.reset();
                        form.style.display = "block"; 
                    }, 500); 
                }, 2500); 
            }, 5000); 
        });
    }
});

// ==========================================
// 7. WEBGL 3D ENGINE (THREE.JS + GSAP)
// ==========================================
gsap.registerPlugin(ScrollTrigger);

const webglCanvas = document.getElementById('webgl-canvas');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, alpha: true, antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const geometry = new THREE.BufferGeometry();
const particlesCount = 4000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5;
}
geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const material = new THREE.PointsMaterial({
    size: 0.015,
    color: 0x3b82f6, 
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(geometry, material);
scene.add(particlesMesh);

camera.position.z = 3;

let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX / window.innerWidth) - 0.5;
    mouseY = (event.clientY / window.innerHeight) - 0.5;
});

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5 
    }
});

tl.to(particlesMesh.position, {
    x: -1.5,
    y: 0.5,
    z: 1.5,
    ease: "power1.inOut"
}, 0);

tl.to(particlesMesh.rotation, {
    x: -Math.PI / 2,
    ease: "power2.inOut"
}, 0.5);

const clock = new THREE.Clock();

function tick() {
    const elapsedTime = clock.getElapsedTime();
    
    particlesMesh.rotation.y = elapsedTime * 0.15;
    
    camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
}
tick();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
