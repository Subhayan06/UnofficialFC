/**
 * ========================================
 * 2006 UCL Final — Digital Museum
 * State Machine · 3D Pitch · Rain Particles
 * ScrollTrigger · Tactical Simulation
 * ========================================
 * State: idle → playing → finished
 */

(function () {
  'use strict';

  // ============================================
  // STATE MACHINE
  // ============================================
  const StateMachine = {
    current: 'idle',
    transitions: {
      idle: ['playing'],
      playing: ['finished'],
      finished: ['idle'],
    },
    enter(state) {
      if (this.transitions[this.current].includes(state)) {
        this.current = state;
        this.onChange(state);
      }
    },
    onChange(state) {
      console.log(`[StateMachine] → ${state}`);
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('stateChange', { detail: { state } }));
      }
    },
  };

  // ============================================
  // PRE-LOADER
  // ============================================
  function initPreloader() {
    return new Promise((resolve) => {
      const preloader = typeof document !== 'undefined' ? document.getElementById('preloader') : null;
      const preloaderBar = typeof document !== 'undefined' ? document.getElementById('preloader-bar') : null;
      if (preloaderBar) preloaderBar.style.width = '100%';
      setTimeout(() => {
        if (preloader) preloader.classList.add('hidden');
        resolve();
      }, 2200);
    });
  }

  // ============================================
  // RAIN PARTICLE SYSTEM
  // ============================================
  class RainSystem {
    constructor(canvas, opts = {}) {
      this.canvas = canvas || null;
      this.ctx = canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
      this.count = opts.count || 120;
      this.speed = opts.speed || 4;
      this.length = opts.length || 12;
      this.opacity = opts.opacity || 0.35;
      this.w = opts.width || (canvas && canvas.width ? canvas.width : 0);
      this.h = opts.height || (canvas && canvas.height ? canvas.height : 0);
      this.drops = [];
      this.animId = null;
      this.resize();
      this.init();
    }

    resize() {
      if (this.canvas) {
        const offsetW = this.canvas.offsetWidth;
        const offsetH = this.canvas.offsetHeight;
        const winW = typeof window !== 'undefined' ? window.innerWidth : 800;
        const winH = typeof window !== 'undefined' ? window.innerHeight : 600;

        this.canvas.width = offsetW || winW;
        this.canvas.height = offsetH || winH;
        this.w = this.canvas.width;
        this.h = this.canvas.height;
      }
    }

    init() {
      this.drops = [];
      for (let i = 0; i < this.count; i++) {
        this.drops.push(this.createDrop());
      }
    }

    createDrop() {
      return {
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vy: 2 + Math.random() * this.speed,
        len: 6 + Math.random() * this.length,
        opacity: 0.15 + Math.random() * this.opacity,
      };
    }

    update() {
      for (let i = 0; i < this.drops.length; i++) {
        const d = this.drops[i];
        d.y += d.vy;
        d.x += d.vy * 0.15;
        if (d.y > this.h + 20 || d.x > this.w + 20) {
          this.drops[i] = this.createDrop();
          this.drops[i].y = -10;
          this.drops[i].x = Math.random() * this.w;
        }
      }
    }

    draw() {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.strokeStyle = 'rgba(180, 200, 255, 0.4)';
      ctx.lineWidth = 1;
      for (const d of this.drops) {
        ctx.globalAlpha = d.opacity;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.vy * 0.15, d.y - d.len);
        ctx.stroke();
      }
    }

    loop() {
      this.update();
      this.draw();
      if (typeof requestAnimationFrame === 'function') {
        this.animId = requestAnimationFrame(() => this.loop());
      }
    }

    start() {
      if (!this.animId) this.loop();
    }

    stop() {
      if (this.animId) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.animId);
        }
        this.animId = null;
      }
    }

    destroy() {
      this.stop();
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }
  }

  // ============================================
  // WATER DROPLET OVERLAY — slides down glass
  // ============================================
  class DropletSystem {
    constructor(container) {
      this.container = container;
      this.droplets = [];
      this.maxDroplets = 25;
      this.intervalId = null;
      if (container) {
        this.generate();
        this.loop();
      }
    }

    createDroplet() {
      if (typeof document === 'undefined') return null;
      const el = document.createElement('div');
      el.className = 'droplet';
      const sizeW = 3 + Math.random() * 6;
      const sizeH = sizeW * (1.5 + Math.random() * 2);
      el.style.width = `${sizeW}px`;
      el.style.height = `${sizeH}px`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `-${sizeH * 0.5}px`;
      const duration = 3 + Math.random() * 4;
      el.style.setProperty('--drop-duration', `${duration}s`);
      el.style.setProperty('--drop-delay', '0s');
      el.style.setProperty('--drop-distance', `${200 + Math.random() * 400}px`);
      return el;
    }

    generate() {
      if (!this.container) return;
      const existing = this.container.querySelectorAll('.droplet');
      if (existing.length < this.maxDroplets) {
        const count = Math.min(this.maxDroplets - existing.length, 3);
        for (let i = 0; i < count; i++) {
          const d = this.createDroplet();
          if (!d) continue;
          this.container.appendChild(d);
          d.style.animation = 'none';
          d.style.opacity = '0';
          void d.offsetHeight;
          d.style.animation = `dropletSlide ${d.style.getPropertyValue('--drop-duration')} ease-in forwards`;
          d.addEventListener('animationend', () => {
            d.remove();
          });
        }
      }
    }

    loop() {
      this.generate();
      this.intervalId = setInterval(() => this.generate(), 1000);
    }

    destroy() {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      if (this.container) {
        while (this.container.firstChild) {
          this.container.removeChild(this.container.firstChild);
        }
      }
    }
  }

  // ============================================
  // TACTICAL PITCH — 22 NODES + BALL + 3 MOMENTS
  // ============================================
  class TacticalPitch {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.currentMoment = 0;
      this.frame = 0;
      this.animId = null;
      this.running = false;
      this.FPS = 30;
      this.totalFrames = 600; // 20 seconds at 30fps
      if (canvas) this.resize();

      // ============ FIXED PITCH DIMENSIONS (normalized 0-100) ============
      this.pitchW = 100;
      this.pitchH = 75;

      // ============ MOMENT 0 — Ronaldinho → Eto'o / Lehmann red (18') ============
      this.moments = [
        // MOMENT 0: 18th minute — the red card
        {
          name: '18\' — Lehmann Red Card',
          ball: this.tweenArray(
            [48, 55], [50, 52], [52, 48], [54, 44], [52, 40], [50, 38],
            [48, 36], [46, 34], [44, 32], [42, 30],
            [40, 28], [38, 26], [36, 24], [36, 22], [36, 20],
            [34, 20], [32, 20], [30, 20], [28, 20], [26, 20],
            [24, 22], [22, 24], [20, 26], [20, 28], [20, 28]
          ),
          players: {
            ronaldinho:  { path: this.tweenArray([55,60],[54,58],[53,56],[52,54],[51,52],[50,50],[49,48],[48,46],[47,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46],[46,46]), label: '10' },
            etoo:         { path: this.tweenArray([60,45],[58,44],[56,42],[54,40],[52,38],[50,36],[48,34],[46,32],[44,30],[42,28],[40,26],[38,24],[36,22],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20],[34,20]), label: '9' },
            deco:         { path: this.tweenArray([50,58],[50,56],[50,54],[50,52],[50,50],[50,48],[50,46],[50,44],[50,42],[50,40],[50,38],[50,36],[50,34],[50,32],[50,30],[50,30],[50,30],[50,30],[50,30],[50,30],[50,30],[50,30],[50,30],[50,30],[50,30]), label: '20' },
            giuly:        { path: this.tweenArray([58,48],[56,46],[54,44],[52,42],[50,40],[48,38],[46,36],[44,34],[42,32],[40,30],[38,28],[36,26],[34,24],[32,22],[30,20],[28,18],[26,18],[24,18],[22,18],[20,18],[20,18],[20,18],[20,18],[20,18],[20,18]), label: '8' },
            vanBronckhorst:{path: this.tweenArray([45,55],[44,54],[43,53],[42,52],[41,51],[40,50],[39,49],[38,48],[37,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48]), label: '12' },
            edmilson:     { path: this.tweenArray([48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52],[48,52]), label: '15' },
            puyol:        { path: this.tweenArray([42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50]), label: '5' },
            marquez:      { path: this.tweenArray([44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48],[44,48]), label: '4' },
            oleguer:      { path: this.tweenArray([42,45],[42,45],[42,45],[42,45],[42,45],[42,45],[42,45],[42,45],[42,45],[42,45],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52],[42,52]), label: '2' },
            valdes:       { path: this.tweenArray([40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40],[40,40]), label: '1' },
            lehmann:      { path: this.tweenArray([30,40],[30,40],[30,40],[28,38],[26,36],[24,34],[22,32],[20,30],[18,28],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26],[16,26]), label: '1' },
            campbell:     { path: this.tweenArray([35,45],[35,44],[35,43],[35,42],[35,41],[35,40],[35,39],[35,38],[35,37],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36],[35,36]), label: '23' },
            toure:        { path: this.tweenArray([36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48]), label: '28' },
            eboue:        { path: this.tweenArray([35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42]), label: '27' },
            cole:         { path: this.tweenArray([38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50],[38,50]), label: '3' },
            pires:        { path: this.tweenArray([42,52],[42,51],[42,50],[42,49],[42,48],[42,47],[42,46],[42,45],[42,44],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43]), label: '7' },
            gilberto:     { path: this.tweenArray([40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50],[40,50]), label: '19' },
            fabregas:     { path: this.tweenArray([44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52],[44,52]), label: '15' },
            ljungberg:    { path: this.tweenArray([46,50],[46,49],[46,48],[46,47],[46,46],[46,45],[46,44],[46,43],[46,42],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41],[46,41]), label: '8' },
            henry:        { path: this.tweenArray([50,50],[50,48],[50,46],[50,44],[50,42],[50,40],[50,38],[50,36],[50,34],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32],[50,32]), label: '14' },
            hleb:         { path: this.tweenArray([45,50],[45,49],[45,48],[45,47],[45,46],[45,45],[45,44],[45,43],[45,42],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41],[45,41]), label: '13' },
            almunia:      { path: this.tweenArray([30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40]), label: '24' },
          },
        },
        // MOMENT 1: 76th minute — Iniesta → Larsson → Eto'o
        {
          name: '76\' — Eto\'o Equaliser',
          ball: this.tweenArray(
            [60,50], [58,48], [56,46], [54,44], [52,42], [50,40],
            [48,38], [46,36], [44,34], [42,32],
            [40,30], [38,28], [36,26], [34,24], [32,22],
            [30,22],
            [28,22], [26,22], [24,22], [22,22], [20,22],
            [18,24], [16,26], [16,28], [16,28], [16,28]
          ),
          players: {
            ronaldinho:   { path: this.tweenArray([55,55],[54,54],[53,53],[52,52],[51,51],[50,50],[49,49],[48,48],[47,47],[46,46],[45,45],[44,44],[43,43],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42],[42,42]), label: '10' },
            etoo:         { path: this.tweenArray([58,42],[56,40],[54,38],[52,36],[50,34],[48,32],[46,30],[44,28],[42,26],[40,24],[38,22],[36,20],[34,18],[32,16],[30,16],
              [28,16],[26,16],[24,16],[22,16],[20,16],[18,18],[16,20],[16,22],[16,22],[16,22]), label: '9' },
            iniesta:      { path: this.tweenArray([56,58],[55,56],[54,54],[53,52],[52,50],[51,48],[50,46],[49,44],[48,42],[47,40],[46,38],[45,36],[44,34],[43,32],[42,30],[42,30],[42,30],[42,30],[42,30],[42,30],[42,30],[42,30],[42,30],[42,30],[42,30]), label: '24' },
            larsson:      { path: this.tweenArray([55,48],[54,46],[53,44],[52,42],[51,40],[50,38],[49,36],[48,34],[47,32],[46,30],[45,28],[44,26],[43,24],[42,22],[41,20],[40,18],[40,18],[40,18],[40,18],[40,18],[40,18],[40,18],[40,18],[40,18],[40,18]), label: '17' },
            deco:         { path: this.tweenArray([52,58],[52,56],[52,54],[52,52],[52,50],[52,48],[52,46],[52,44],[52,42],[52,40],[52,38],[52,36],[52,34],[52,32],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30]), label: '20' },
            vanBronckhorst:{path: this.tweenArray([48,55],[48,54],[48,53],[48,52],[48,51],[48,50],[48,49],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48],[48,48]), label: '12' },
            edmilson:     { path: this.tweenArray([46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52],[46,52]), label: '15' },
            puyol:        { path: this.tweenArray([40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48],[40,48]), label: '5' },
            marquez:      { path: this.tweenArray([42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46],[42,46]), label: '4' },
            oleguer:      { path: this.tweenArray([42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43],[42,43]), label: '2' },
            valdes:       { path: this.tweenArray([38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40]), label: '1' },
            campbell:     { path: this.tweenArray([36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44]), label: '23' },
            toure:        { path: this.tweenArray([35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46],[35,46]), label: '28' },
            eboue:        { path: this.tweenArray([35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42],[35,42]), label: '27' },
            cole:         { path: this.tweenArray([38,50],[38,48],[38,46],[38,44],[38,42],[38,40],[38,38],[38,36],[38,34],[38,32],[38,30],[38,28],[38,26],[38,24],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22]), label: '3' },
            pires:        { path: this.tweenArray([40,52],[40,50],[40,48],[40,46],[40,44],[40,42],[40,40],[40,38],[40,36],[40,34],[40,32],[40,30],[40,28],[40,26],[40,24],[40,24],[40,24],[40,24],[40,24],[40,24],[40,24],[40,24],[40,24],[40,24],[40,24]), label: '7' },
            gilberto:     { path: this.tweenArray([42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50]), label: '19' },
            fabregas:     { path: this.tweenArray([44,52],[44,50],[44,48],[44,46],[44,44],[44,42],[44,40],[44,38],[44,36],[44,34],[44,32],[44,30],[44,28],[44,26],[44,24],[44,24],[44,24],[44,24],[44,24],[44,24],[44,24],[44,24],[44,24],[44,24],[44,24]), label: '15' },
            ljungberg:    { path: this.tweenArray([46,50],[46,48],[46,46],[46,44],[46,42],[46,40],[46,38],[46,36],[46,34],[46,32],[46,30],[46,28],[46,26],[46,24],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22]), label: '8' },
            henry:        { path: this.tweenArray([52,48],[52,46],[52,44],[52,42],[52,40],[52,38],[52,36],[52,34],[52,32],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30],[52,30]), label: '14' },
            hleb:         { path: this.tweenArray([44,50],[44,48],[44,46],[44,44],[44,42],[44,40],[44,38],[44,36],[44,34],[44,32],[44,30],[44,28],[44,26],[44,24],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22]), label: '13' },
            lehmann:      { path: this.tweenArray([30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40]), label: '1 (off)' },
            almunia:      { path: this.tweenArray([30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,38],[30,36],[30,34],[30,32],[30,30],[30,28],[30,26],[30,24],[30,22],
              [30,20],[30,18],[30,18],[30,18],[30,18],[30,18],[30,18],[30,18],[30,18],[30,18]), label: '24' },
          },
        },
        // MOMENT 2: 81st minute — Xavi → Belletti → Larsson dummy → Belletti goal
        {
          name: '81\' — Belletti Winner',
          ball: this.tweenArray(
            [55,55], [52,52], [50,48], [48,44], [46,40], [44,36],
            [42,32], [40,28], [38,24], [36,22],
            [34,22], [32,22], [30,22], [28,22], [26,22],
            [24,22], [22,22],
            [20,22], [18,22], [16,22], [14,22], [14,24],
            [14,26], [14,26], [14,26], [14,26], [14,26]
          ),
          players: {
            ronaldinho:   { path: this.tweenArray([52,52],[52,50],[52,48],[52,46],[52,44],[52,42],[52,40],[52,38],[52,36],[52,34],[52,32],[52,30],[52,28],[52,26],[52,24],[52,22],[52,22],[52,22],[52,22],[52,22],[52,22],[52,22],[52,22],[52,22],[52,22]), label: '10' },
            etoo:         { path: this.tweenArray([54,44],[54,42],[54,40],[54,38],[54,36],[54,34],[54,32],[54,30],[54,28],[54,26],[54,24],[54,22],[54,20],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18],[54,18]), label: '9' },
            xavi:         { path: this.tweenArray([58,55],[56,54],[54,53],[52,52],[50,51],[48,50],[46,49],[44,48],[42,47],[40,46],[38,45],[36,44],[34,43],[32,42],[30,41],[30,41],[30,41],[30,41],[30,41],[30,41],[30,41],[30,41],[30,41],[30,41],[30,41]), label: '6' },
            larsson:      { path: this.tweenArray([52,46],[50,44],[48,42],[46,40],[44,38],[42,36],[40,34],[38,32],[36,30],[34,28],[32,26],[30,24],[28,22],[26,20],[24,18],[22,18],[22,18],[22,18],[22,18],[22,18],[22,18],[22,18],[22,18],[22,18],[22,18]), label: '17' },
            belletti:     { path: this.tweenArray([56,48],[54,46],[52,44],[50,42],[48,40],[46,38],[44,36],[42,34],[40,32],[38,30],[36,28],[34,26],[32,24],[30,22],[28,20],[26,18],[24,16],[22,16],
              [20,16],[18,16],[16,16],[16,18],[16,20],[16,22],[16,22],[16,22],[16,22],[16,22]), label: '2' },
            deco:         { path: this.tweenArray([50,56],[50,54],[50,52],[50,50],[50,48],[50,46],[50,44],[50,42],[50,40],[50,38],[50,36],[50,34],[50,32],[50,30],[50,28],[50,26],[50,26],[50,26],[50,26],[50,26],[50,26],[50,26],[50,26],[50,26],[50,26]), label: '20' },
            vanBronckhorst:{path: this.tweenArray([48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54],[48,54]), label: '12' },
            puyol:        { path: this.tweenArray([42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48],[42,48]), label: '5' },
            marquez:      { path: this.tweenArray([44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46],[44,46]), label: '4' },
            oleguer:      { path: this.tweenArray([40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42],[40,42]), label: '2' },
            valdes:       { path: this.tweenArray([38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40],[38,40]), label: '1' },
            campbell:     { path: this.tweenArray([36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,44],[36,42],[36,40],[36,38],[36,36],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34]), label: '23' },
            toure:        { path: this.tweenArray([36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,48],[36,46],[36,44],[36,42],[36,40],[36,38],[36,36],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34],[36,34]), label: '28' },
            eboue:        { path: this.tweenArray([34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42],[34,42]), label: '27' },
            cole:         { path: this.tweenArray([38,52],[38,50],[38,48],[38,46],[38,44],[38,42],[38,40],[38,38],[38,36],[38,34],[38,32],[38,30],[38,28],[38,26],[38,24],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22],[38,22]), label: '3' },
            gilberto:     { path: this.tweenArray([42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50],[42,50]), label: '19' },
            fabregas:     { path: this.tweenArray([44,52],[44,50],[44,48],[44,46],[44,44],[44,42],[44,40],[44,38],[44,36],[44,34],[44,32],[44,30],[44,28],[44,26],[44,24],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22]), label: '15' },
            ljungberg:    { path: this.tweenArray([46,50],[46,48],[46,46],[46,44],[46,42],[46,40],[46,38],[46,36],[46,34],[46,32],[46,30],[46,28],[46,26],[46,24],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22],[46,22]), label: '8' },
            henry:        { path: this.tweenArray([50,48],[50,46],[50,44],[50,42],[50,40],[50,38],[50,36],[50,34],[50,32],[50,30],[50,28],[50,26],[50,24],[50,22],[50,20],[50,18],[50,18],[50,18],[50,18],[50,18],[50,18],[50,18],[50,18],[50,18],[50,18]), label: '14' },
            hleb:         { path: this.tweenArray([44,50],[44,48],[44,46],[44,44],[44,42],[44,40],[44,38],[44,36],[44,34],[44,32],[44,30],[44,28],[44,26],[44,24],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22],[44,22]), label: '13' },
            almunia:      { path: this.tweenArray([30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,40],[30,38],[30,36],[30,34],[30,32],[30,30],[30,28],[30,26],[30,24],[30,22],
              [28,20],[26,20],[24,20],[24,20],[24,20],[24,20],[24,20],[24,20],[24,20],[24,20]), label: '24' },
          },
        },
      ];
    }

    tweenArray(...points) {
      if (points.length >= this.totalFrames) {
        return points.slice(0, this.totalFrames);
      }
      const result = [];
      const segments = points.length - 1;
      const framesPerSegment = Math.floor(this.totalFrames / segments);
      for (let s = 0; s < segments; s++) {
        const [x1, y1] = points[s];
        const [x2, y2] = points[s + 1];
        for (let f = 0; f < framesPerSegment; f++) {
          const t = f / framesPerSegment;
          result.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
        }
      }
      while (result.length < this.totalFrames) {
        result.push(points[points.length - 1]);
      }
      return result.slice(0, this.totalFrames);
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 800, height: 600 };
      const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      if (this.ctx && typeof this.ctx.scale === 'function') {
        this.ctx.scale(dpr, dpr);
      }
      this.w = rect.width;
      this.h = rect.height;
    }

    toCanvas(x, y) {
      const padX = this.w * 0.06;
      const padY = this.h * 0.08;
      const scaleX = (this.w - padX * 2) / 100;
      const scaleY = (this.h - padY * 2) / 100;
      return [padX + x * scaleX, padY + y * scaleY];
    }

    drawPitch() {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w;
      const h = this.h;
      const padX = w * 0.06;
      const padY = h * 0.08;
      const pw = w - padX * 2;
      const ph = h - padY * 2;

      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
      gradient.addColorStop(0, '#0d2818');
      gradient.addColorStop(1, '#060e08');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padX, padY, pw, ph);

      const cx = w / 2;
      ctx.beginPath();
      ctx.moveTo(cx, padY);
      ctx.lineTo(cx, padY + ph);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, h / 2, ph * 0.12, 0, Math.PI * 2);
      ctx.stroke();

      const goalAreaW = pw * 0.17;
      const goalAreaH = ph * 0.44;
      const goalX = padX;
      const goalX2 = w - padX - goalAreaW;
      const goalY = padY + (ph - goalAreaH) / 2;

      ctx.strokeRect(goalX, goalY, goalAreaW, goalAreaH);
      ctx.strokeRect(goalX2, goalY, goalAreaW, goalAreaH);

      const sixW = pw * 0.06;
      const sixH = ph * 0.18;
      const sixY = padY + (ph - sixH) / 2;
      ctx.strokeRect(goalX, sixY, sixW, sixH);
      ctx.strokeRect(goalX2, sixY, sixW, sixH);

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.04)';
      ctx.lineWidth = 0.5;
      const gridSpacing = pw / 10;
      for (let i = 1; i < 10; i++) {
        const gx = padX + i * gridSpacing;
        ctx.beginPath();
        ctx.moveTo(gx, padY);
        ctx.lineTo(gx, padY + ph);
        ctx.stroke();
      }
      const gridSpacingY = ph / 10;
      for (let i = 1; i < 10; i++) {
        const gy = padY + i * gridSpacingY;
        ctx.beginPath();
        ctx.moveTo(padX, gy);
        ctx.lineTo(padX + pw, gy);
        ctx.stroke();
      }
    }

    drawNode(cx, cy, radius, fillColor, strokeColor, label, isBall = false) {
      const ctx = this.ctx;
      if (!ctx) return;
      if (isBall) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fill();
        return;
      }

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.shadowColor = fillColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (label) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(radius * 0.8)}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
      }
    }

    drawFrame(momentIdx, frameIdx) {
      if (!this.ctx || !this.moments[momentIdx]) return;
      const moment = this.moments[momentIdx];
      const f = Math.min(frameIdx, this.totalFrames - 1);

      this.ctx.clearRect(0, 0, this.w, this.h);
      this.drawPitch();

      for (const [key, player] of Object.entries(moment.players)) {
        if (!player.path || !player.path[f]) continue;
        const [px, py] = player.path[f];
        const [cx, cy] = this.toCanvas(px, py);
        const isBarca = ['ronaldinho','etoo','deco','iniesta','larsson','xavi','belletti','vanBronckhorst','edmilson','puyol','marquez','oleguer','valdes'].includes(key);
        const fillColor = isBarca ? '#1a1a6b' : '#f5c842';
        const strokeColor = isBarca ? '#a50034' : '#333333';
        const radius = (isBarca ? 10 : 10) * (this.w / 800);
        this.drawNode(cx, cy, radius, fillColor, strokeColor, player.label || '');
      }

      if (moment.ball && moment.ball[f]) {
        const [bx, by] = moment.ball[f];
        const [bcx, bcy] = this.toCanvas(bx, by);
        this.drawNode(bcx, bcy, 5 * (this.w / 800), null, null, null, true);
      }

      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.font = `${Math.round(this.w * 0.016)}px "Plus Jakarta Sans", sans-serif`;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'top';
      this.ctx.fillText(moment.name, this.w * 0.04, this.h * 0.04);

      this.ctx.textAlign = 'right';
      this.ctx.fillText(`Frame ${f + 1}/${this.totalFrames}`, this.w * 0.96, this.h * 0.04);
    }

    setMoment(idx) {
      if (idx >= 0 && idx < this.moments.length) {
        this.currentMoment = idx;
        this.frame = 0;
        this.drawFrame(idx, 0);
      }
    }

    startAnimation() {
      if (this.running) return;
      this.running = true;
      this.frame = 0;
      const interval = 1000 / this.FPS;
      this.animId = setInterval(() => {
        if (this.frame >= this.totalFrames) {
          this.frame = 0;
        }
        this.drawFrame(this.currentMoment, this.frame);
        this.frame++;
      }, interval);
    }

    stopAnimation() {
      this.running = false;
      if (this.animId) {
        clearInterval(this.animId);
        this.animId = null;
      }
    }

    render() {
      this.drawFrame(this.currentMoment, this.frame);
    }

    destroy() {
      this.stopAnimation();
    }
  }

  // ============================================
  // HEATMAP CANVAS — Larsson's Operational Zones
  // ============================================
  class HeatmapCanvas {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas ? canvas.getContext('2d') : null;
      this.intensity = 0;
      this.animId = null;
      if (canvas) this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 800, height: 600 };
      const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      if (this.ctx && typeof this.ctx.scale === 'function') {
        this.ctx.scale(dpr, dpr);
      }
      this.w = rect.width;
      this.h = rect.height;
    }

    draw(intensity) {
      const ctx = this.ctx;
      if (!ctx) return;
      ctx.clearRect(0, 0, this.w, this.h);

      const gradient = ctx.createRadialGradient(this.w / 2, this.h / 2, 0, this.w / 2, this.h / 2, this.w * 0.7);
      gradient.addColorStop(0, '#0d2818');
      gradient.addColorStop(1, '#060e08');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.w, this.h);

      const padX = this.w * 0.06;
      const padY = this.h * 0.08;
      const pw = this.w - padX * 2;
      const ph = this.h - padY * 2;

      ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(padX, padY, pw, ph);

      ctx.beginPath();
      ctx.moveTo(this.w / 2, padY);
      ctx.lineTo(this.w / 2, padY + ph);
      ctx.stroke();

      const zones = [
        { x: this.w * 0.38, y: this.h * 0.4, rx: pw * 0.1, ry: ph * 0.12, intensity: 0.9 },
        { x: this.w * 0.42, y: this.h * 0.6, rx: pw * 0.08, ry: ph * 0.1, intensity: 0.75 },
        { x: this.w * 0.48, y: this.h * 0.5, rx: pw * 0.06, ry: ph * 0.08, intensity: 0.6 },
        { x: this.w * 0.35, y: this.h * 0.32, rx: pw * 0.07, ry: ph * 0.09, intensity: 0.5 },
        { x: this.w * 0.32, y: this.h * 0.55, rx: pw * 0.09, ry: ph * 0.11, intensity: 0.65 },
      ];

      const activeIntensity = intensity * 0.8;

      for (const zone of zones) {
        const grad = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, Math.max(zone.rx, zone.ry));
        const alpha = zone.intensity * activeIntensity;
        grad.addColorStop(0, `rgba(255, 50, 0, ${alpha})`);
        grad.addColorStop(0.3, `rgba(255, 150, 0, ${alpha * 0.6})`);
        grad.addColorStop(0.6, `rgba(255, 220, 50, ${alpha * 0.3})`);
        grad.addColorStop(1, `rgba(0, 100, 255, ${alpha * 0.05})`);
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(zone.x, zone.y, zone.rx, zone.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = `rgba(255, 100, 20, ${activeIntensity * 0.1})`;
      ctx.fillRect(0, 0, this.w, this.h);

      ctx.fillStyle = `rgba(255,255,255,${0.2 + activeIntensity * 0.2})`;
      ctx.font = `${Math.round(this.w * 0.025)}px "Plus Jakarta Sans", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText('Henrik Larsson #17', this.w * 0.06, this.h * 0.92);

      const barX = this.w * 0.75;
      const barY = this.h * 0.04;
      const barW = this.w * 0.18;
      const barH = this.h * 0.025;
      const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      barGrad.addColorStop(0, 'rgba(0,100,255,0.3)');
      barGrad.addColorStop(0.5, 'rgba(255,200,0,0.6)');
      barGrad.addColorStop(1, 'rgba(255,0,0,0.8)');
      ctx.fillStyle = barGrad;
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(barX, barY, barW, barH);
    }

    animate(intensityTarget) {
      this.intensity += (intensityTarget - this.intensity) * 0.05;
      this.draw(this.intensity);
      if (typeof requestAnimationFrame === 'function') {
        this.animId = requestAnimationFrame(() => this.animate(intensityTarget));
      }
    }

    start() {
      if (!this.animId) {
        this.animate(0.7);
      }
    }

    setIntensity(val) {
      this.intensity = val;
    }

    destroy() {
      if (this.animId) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(this.animId);
        }
        this.animId = null;
      }
    }
  }

  // ============================================
  // WORD-BY-WORD SCROLLTELLING ENGINE
  // ============================================
  class WordScroller {
    constructor() {
      this.words = typeof document !== 'undefined' ? document.querySelectorAll('.word') : [];
      this.paragraphs = typeof document !== 'undefined' ? document.querySelectorAll('.essay-paragraph') : [];
      this.init();
    }

    init() {
      if (!this.words.length) return;

      this.words.forEach(w => {
        w.style.opacity = '0.2';
      });

      if (typeof ScrollTrigger !== 'undefined') {
        this.words.forEach((word) => {
          ScrollTrigger.create({
            trigger: word,
            start: 'top center',
            end: 'bottom center',
            onEnter: () => {
              word.classList.add('active');
              word.classList.remove('inactive');
            },
            onLeave: () => {
              word.classList.remove('active');
              word.classList.add('inactive');
            },
            onEnterBack: () => {
              word.classList.add('active');
              word.classList.remove('inactive');
            },
            onLeaveBack: () => {
              word.classList.remove('active');
              word.classList.add('inactive');
            },
          });
        });
      }
    }

    refresh() {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.refresh();
      }
    }
  }

  // ============================================
  // GSAP + SCROLLTRIGGER ORCHESTRATION
  // ============================================
  function initGSAP(pitch, heatmap, wordScroller) {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    if (typeof ScrollToPlugin !== 'undefined') {
      gsap.registerPlugin(ScrollToPlugin);
    }

    const preloader = document.getElementById('preloader');
    const stickyNav = document.getElementById('sticky-nav');
    const rainCanvasGlobal = document.getElementById('rain-canvas-global');

    if (preloader) {
      gsap.to('#preloader', {
        opacity: 0,
        duration: 1,
        delay: 2.2,
        ease: 'power2.inOut',
        onComplete: () => {
          preloader.classList.add('hidden');
          StateMachine.enter('playing');
        },
      });
    }

    const heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '+=100%',
        scrub: 1.5,
        pin: false,
        invalidateOnRefresh: true,
      },
    });

    heroTimeline
      .to('#hero-left', { width: '5%', duration: 1, ease: 'power3.inOut' })
      .to('#hero-right', { width: '5%', duration: 1, ease: 'power3.inOut' }, '<')
      .to('#hero-left img', { scale: 0.4, duration: 1, ease: 'power3.inOut' }, '<')
      .to('#hero-right img', { scale: 0.4, duration: 1, ease: 'power3.inOut' }, '<')
      .to('#hero-vs', { opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.5')
      .to('.scroll-hint', { opacity: 0, duration: 0.4 }, '<');

    if (stickyNav) {
      ScrollTrigger.create({
        trigger: '#hero',
        start: 'bottom 10%',
        onEnter: () => { stickyNav.classList.add('visible'); },
        onLeaveBack: () => { stickyNav.classList.remove('visible'); },
      });
    }

    ScrollTrigger.create({
      trigger: '#section-1',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const progress = self.progress;
        const rainOpacity = 0.2 + progress * 0.4;
        if (rainCanvasGlobal) {
          rainCanvasGlobal.style.opacity = rainOpacity;
        }
      },
    });

    if (pitch) {
      ScrollTrigger.create({
        trigger: '#section-2',
        start: 'top 70%',
        onEnter: () => { pitch.startAnimation(); },
        onLeave: () => { pitch.stopAnimation(); },
        onEnterBack: () => { pitch.startAnimation(); },
        onLeaveBack: () => { pitch.stopAnimation(); },
      });
    }

    if (heatmap) {
      ScrollTrigger.create({
        trigger: '#section-3',
        start: 'top 80%',
        onEnter: () => { heatmap.start(); },
      });
    }

    ScrollTrigger.create({
      trigger: '#essay-container',
      start: 'top 15%',
      end: 'bottom bottom',
      pin: false,
      invalidateOnRefresh: true,
    });

    ScrollTrigger.refresh();
  }

  // ============================================
  // MOMENT TABS
  // ============================================
  function initMomentTabs(pitch) {
    const momentTabs = typeof document !== 'undefined' ? document.querySelectorAll('.moment-tab') : [];
    const momentAnalyses = typeof document !== 'undefined' ? document.querySelectorAll('.moment-analysis') : [];

    momentTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const idx = parseInt(tab.getAttribute('data-moment'), 10);
        momentTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');

        momentAnalyses.forEach((analysis) => {
          const mid = parseInt(analysis.getAttribute('data-moment'), 10);
          if (mid === idx) {
            analysis.classList.remove('hidden');
          } else {
            analysis.classList.add('hidden');
          }
        });

        pitch.setMoment(idx);
        pitch.startAnimation();
      });
    });

    if (momentTabs.length > 0) {
      momentTabs[0].classList.add('active');
    }
  }

  // ============================================
  // RESIZE HANDLER
  // ============================================
  function initResizeHandlers(pitch, heatmap, rainSystems) {
    if (typeof window === 'undefined') return;
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        for (const rain of rainSystems) {
          rain.resize();
          rain.init();
        }
        if (pitch) pitch.resize();
        if (heatmap) heatmap.resize();
        if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
        }
      }, 200);
    });
  }

  // ============================================
  // MOBILE DETECTION
  // ============================================
  function isMobile() {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  }

  // ============================================
  // INIT
  // ============================================
  async function init() {
    if (typeof document === 'undefined') return;
    console.log('[2006] Initializing Digital Museum...');

    const rainCanvasHero = document.getElementById('rain-canvas-hero');
    const rainCanvasGlobal = document.getElementById('rain-canvas-global');
    const tacticalCanvas = document.getElementById('tactical-pitch');
    const heatmapCanvas = document.getElementById('heatmap-canvas');

    await initPreloader();

    const rainSystems = [];
    if (rainCanvasHero) {
      const heroRain = new RainSystem(rainCanvasHero, {
        count: isMobile() ? 80 : 160,
        speed: 6,
        length: 18,
        opacity: 0.6,
      });
      heroRain.start();
      rainSystems.push(heroRain);
    }
    if (rainCanvasGlobal) {
      const globalRain = new RainSystem(rainCanvasGlobal, {
        count: isMobile() ? 120 : 250,
        speed: 7,
        length: 20,
        opacity: 0.65,
      });
      globalRain.start();
      rainSystems.push(globalRain);
    }

    const dropletContainer = document.getElementById('droplet-overlay');
    let dropletSystem = null;
    if (dropletContainer && !isMobile()) {
      dropletSystem = new DropletSystem(dropletContainer);
    } else if (dropletContainer) {
      dropletSystem = new DropletSystem(dropletContainer);
      dropletSystem.maxDroplets = 8;
    }

    let pitch = null;
    if (tacticalCanvas) {
      pitch = new TacticalPitch(tacticalCanvas);
      pitch.setMoment(0);
    }

    let heatmap = null;
    if (heatmapCanvas) {
      heatmap = new HeatmapCanvas(heatmapCanvas);
      heatmap.draw(0.5);
    }

    if (pitch) {
      initMomentTabs(pitch);
    }

    const wordScroller = new WordScroller();

    initGSAP(pitch, heatmap, wordScroller);

    initResizeHandlers(pitch, heatmap, rainSystems);

    StateMachine.onChange = (state) => {
      console.log(`[State] ${state}`);
    };

    console.log('[2006] Digital Museum initialized successfully.');
  }

  // Export for Node / CommonJS testing
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      RainSystem,
      StateMachine,
      DropletSystem,
      TacticalPitch,
      HeatmapCanvas,
      WordScroller,
    };
  }

  // Auto-init in browser environment
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
