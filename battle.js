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
    this.circleRadius = this.radius * 0.2; 

  }

  /** Begin animation loop */
start() {
    this.running = true;
    this.lastTime = performance.now();
    setTimeout(() => {
        requestAnimationFrame(this.loop.bind(this));
    }, 6500);
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
          const perpendicularAngle = angle + (b.clockwise ? Math.PI / 2 : -Math.PI / 2);      
          // Set speed based on stamina and type
          let baseSpeed = Math.min(5, b.stamina / 100); // Default base
          let orbitMultiplier = 1.5;
      
          switch (b.type) {
            case "attack":
              orbitMultiplier = 1.5; // ⚡ Attack types move fastest
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

          if (b.reducedOrbit) {
            // Reduce orbit effect temporarily after strong knockback
            b.velX *= 0.5;
            b.velY *= 0.5;
            b.reducedOrbit = false; // Only apply once
          } else {
            b.velX = Math.cos(perpendicularAngle) * tangentialSpeed;
            b.velY = Math.sin(perpendicularAngle) * tangentialSpeed;
          }

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
      case "attack":  return { knockback: 1.5, staminaDrain: 1.6 };
      case "defense": return { knockback: 0.8, staminaDrain: 0.8 };
      case "stamina": return { knockback: 0.9, staminaDrain: 1.4 };
      case "balance": return { knockback: 1.0, staminaDrain: 1.0 };
      default:        return { knockback: 1.0, staminaDrain: 1.0 };
    }
  };

  const effectA = typeEffect(a);
  const effectB = typeEffect(b);
  const totalKnockback = effectA.knockback + effectB.knockback;

  // Stamina drain
  const baseDrain = 20;
  a.drain(baseDrain * effectB.staminaDrain);
  b.drain(baseDrain * effectA.staminaDrain);

  // Apply knockback based on type effects
  a.velX += Math.cos(angle) * (totalKnockback * 100);
  a.velY += Math.sin(angle) * (totalKnockback * 100);
  b.velX -= Math.cos(angle) * (totalKnockback * 100);
  b.velY -= Math.sin(angle) * (totalKnockback * 100);
  a.clockwise = !a.clockwise;
  b.clockwise = !b.clockwise;
  a.reducedOrbit = false; // Reset reduced orbit state
  b.reducedOrbit = false;
  a.name = a.name || "Beyblade A"; // Fallback name
  b.name = b.name || "Beyblade B"; // Fallback name
  // Log collision
  console.log(`${a.name} hit ${b.name}: drained ${baseDrain * effectB.staminaDrain} stamina`);

  // Knockback
  const knockStrength = 500;
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

// Check if collision midpoint is inside the inner circle
const midX = (a.posX + b.posX) / 2;
const midY = (a.posY + b.posY) / 2;
const distToCenter = Math.hypot(midX - this.cx, midY - this.cy);
const insideCircle = distToCenter < this.circleRadius;

if (insideCircle) {
  const ejectForce = 1500; // Stronger knockback
  const dampingFactor = 0.4; // Reduce tangential motion

  if (effectA.knockback < effectB.knockback) {
    // Knock A harder and damp orbit
    a.velX = Math.cos(angle) * ejectForce * dampingFactor;
    a.velY = Math.sin(angle) * ejectForce * dampingFactor;
    a.reducedOrbit = true;
  } else if (effectB.knockback < effectA.knockback) {
    b.velX = -Math.cos(angle) * ejectForce * dampingFactor;
    b.velY = -Math.sin(angle) * ejectForce * dampingFactor;
    b.reducedOrbit = true;
  } else {
    // Equal knockback: knock both and reduce both
    a.velX = Math.cos(angle) * ejectForce * dampingFactor;
    a.velY = Math.sin(angle) * ejectForce * dampingFactor;
    b.velX = -Math.cos(angle) * ejectForce * dampingFactor;
    b.velY = -Math.sin(angle) * ejectForce * dampingFactor;
    a.reducedOrbit = true;
    b.reducedOrbit = true;
  }
} else {
  // Outside center: reverse weaker spin direction
  if (effectA.knockback < effectB.knockback) {
    a.clockwise = !a.clockwise;
  } else if (effectB.knockback < effectA.knockback) {
    b.clockwise = !b.clockwise;
  }
}



  a.clockwise = !a.clockwise;
  b.clockwise = !b.clockwise;

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
