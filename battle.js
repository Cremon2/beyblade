// battle.js
// BattleEngine coordinates movement, collisions, stamina drain, and victory

import Beyblade from './beyblade.js';

export default class BattleEngine {
  constructor(stadiumEl, blades, {
    staminaDrain = 0.5,
    wallBounceFactor = 2,
    tickMs = 16
  } = {}) {
    this.stadiumEl = stadiumEl;
    this.blades = blades; // array of Beyblade instances
    this.staminaDrain = staminaDrain;
    this.wallBounceFactor = wallBounceFactor;
    this.running = false;
    this.tickMs = tickMs;

    // Pre‑calc stadium geometry
    const rect = stadiumEl.getBoundingClientRect();
    this.cx = rect.left + rect.width / 2;
    this.cy = rect.top + rect.height / 2;
    this.radius = rect.width / 2;
  }

  /** Begin animation loop */
start() {
    this.running = true;
    this.lastTime = performance.now();
    setTimeout(() => {
        requestAnimationFrame(this.loop.bind(this));
    }, 7000);
}
  

  /** Main RAF loop */
  loop(now) {
    if (!this.running) return;
    const dt = (now - this.lastTime) / 1000; // seconds
    this.lastTime = now;

    // Update every blade
    for (const b of this.blades) {
        if (b.stamina > 0) {
          const dx = b.posX - this.cx;
          const dy = b.posY - this.cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);
          const perpendicularAngle = angle + Math.PI / 2;
      
          // Set speed based on stamina and type
          let baseSpeed = Math.min(5, b.stamina / 100); // Default base
          let orbitMultiplier = 1.0;
      
          switch (b.type) {
            case "attack":
              orbitMultiplier = 5.0; // ⚡ Attack types move fastest
              break;
            case "stamina":
              orbitMultiplier = 1.2;
              break;
            case "defense":
              orbitMultiplier = 0.8;
              break;
            case "balance":
            default:
              orbitMultiplier = 1.0;
              break;
          }
      
          const tangentialSpeed = baseSpeed * orbitMultiplier;
      
          b.velX = Math.cos(perpendicularAngle) * tangentialSpeed;
          b.velY = Math.sin(perpendicularAngle) * tangentialSpeed;
      
          // Optional spiral in/out based on stamina
          const centerPull = (1000 - b.stamina) / 1000;
          b.velX -= dx / dist * centerPull * 0.5;
          b.velY -= dy / dist * centerPull * 0.5;
      
          b.posX += b.velX;
          b.posY += b.velY;
      
          b.bounceFromBoundary(this.cx, this.cy, this.radius);
          b.drain(this.staminaDrain);
        }
      }
      

    // Collisions (pairwise)
    for (let i = 0; i < this.blades.length; i++) {
      for (let j = i + 1; j < this.blades.length; j++) {
        const a = this.blades[i];
        const b = this.blades[j];
        const now = performance.now();
a.lastHitTime ??= 0;
b.lastHitTime ??= 0;

if (a.isColliding(b) && now - a.lastHitTime > 200 && now - b.lastHitTime > 200) {
  a.lastHitTime = now;
  b.lastHitTime = now;

  // Knockback direction
  const dx = a.posX - b.posX;
  const dy = a.posY - b.posY;
  const angle = Math.atan2(dy, dx);

  // Type effects
  const typeEffect = (blade) => {
    switch (blade.type) {
      case "attack":  return { knockback: 5.0, staminaDrain: 1.2 };
      case "defense": return { knockback: 0.8, staminaDrain: 0.8 };
      case "stamina": return { knockback: 0.9, staminaDrain: 1.4 };
      case "balance": return { knockback: 1.0, staminaDrain: 1.0 };
      default:        return { knockback: 1.0, staminaDrain: 1.0 };
    }
  };

  const effectA = typeEffect(a);
  const effectB = typeEffect(b);

  // Stamina drain
  const baseDrain = 10;
  a.drain(baseDrain * effectB.staminaDrain);
  b.drain(baseDrain * effectA.staminaDrain);

  // Knockback
  const knockStrength = 50;
  a.velX += Math.cos(angle) * knockStrength * effectA.knockback;
  a.velY += Math.sin(angle) * knockStrength * effectA.knockback;
  b.velX -= Math.cos(angle) * knockStrength * effectB.knockback;
  b.velY -= Math.sin(angle) * knockStrength * effectB.knockback;

  // Prevent overlapping
  const separation = 10;
  a.posX += Math.cos(angle) * separation;
  a.posY += Math.sin(angle) * separation;
  b.posX -= Math.cos(angle) * separation;
  b.posY -= Math.sin(angle) * separation;

  console.log(`${a.name} hit ${b.name}: drained ${baseDrain * effectB.staminaDrain}`);
  if (BattleEngine.onHit) BattleEngine.onHit();
}

          
      }
    }

    // Render
    this.blades.forEach(b => b.render());

    // Victory check: if only one spinning
    const spinning = this.blades.filter(b => b.stamina > 0);
    if (spinning.length <= 1) {
      this.running = false;
      BattleEngine.onEnd?.(spinning[0] ?? null);
      return;
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}
