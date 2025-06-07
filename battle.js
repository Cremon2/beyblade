import {
  normalizedVector,
  angleBetween,
  distance,
  reflectVector
} from './vectorUtils.js';
import Beyblade from './beyblade.js';

function getTypeMass(type) {
  switch (type) {
    case "attack":  return 1.0;
    case "stamina": return 1.5;
    case "defense": return 2.5;
    case "balance": return 2.0;
    default:        return 1.5;
  }
}

function getTypeEffect(type) {
  switch (type) {
    case "attack":  return { knockback: 5.0, staminaDrain: 1.6, reflect: 0.2 };
    case "defense": return { knockback: 0.8, staminaDrain: 0.8, reflect: 0.7 };
    case "stamina": return { knockback: 0.9, staminaDrain: 1.4, reflect: 0.2 };
    case "balance": return { knockback: 1.0, staminaDrain: 1.0, reflect: 0.1 };
    default:        return { knockback: 1.0, staminaDrain: 1.0, reflect: 0.5 };
  }
}

export default class BattleEngine {
  constructor(stadiumEl, blades, {
    staminaDrain = 0.5,
    wallBounceFactor = 2,
    tickMs = 16
  } = {}) {
    this.stadiumEl = stadiumEl;
    this.blades = blades;
    this.staminaDrain = staminaDrain;
    this.wallBounceFactor = wallBounceFactor;
    this.tickMs = tickMs;
    this.running = false;

    const rect = stadiumEl.getBoundingClientRect();
    this.cx = rect.left + rect.width / 2;
    this.cy = rect.top + rect.height / 2;
    this.radius = rect.width / 2;
    this.circleRadius = this.radius * 0.2;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    setTimeout(() => {
      requestAnimationFrame(this.loop.bind(this));
    }, 6000);
  }

  loop(now) {
    if (!this.running) return;
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    for (const b of this.blades) {
      if (b.stamina > 0) {
        const dx = b.posX - this.cx;
        const dy = b.posY - this.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const perpendicularAngle = angle + (b.clockwise ? Math.PI / 2 : -Math.PI / 2);

        const baseSpeed = Math.min(5, b.stamina / 100);
        let orbitMultiplier = 1.0;

        switch (b.type) {
          case "attack":  orbitMultiplier = 1.5; break;
          case "stamina": orbitMultiplier = 1.2; break;
          case "defense": orbitMultiplier = 0.5; break;
        }

        const tangentialSpeed = baseSpeed * orbitMultiplier;

        if (b.reducedOrbit) {
          b.velX *= 0.5;
          b.velY *= 0.5;
          b.reducedOrbit = false;
        } else {
          b.velX = Math.cos(perpendicularAngle) * tangentialSpeed;
          b.velY = Math.sin(perpendicularAngle) * tangentialSpeed;
        }

        const basePull = 0.2;
        const centerPull = basePull + ((1000 - b.stamina) / 1000) * 0.5;
        b.velX -= dx / dist * centerPull;
        b.velY -= dy / dist * centerPull;

        b.posX += b.velX;
        b.posY += b.velY;

        b.bounceFromBoundary(this.cx, this.cy, this.radius);
        b.drain(this.staminaDrain);

        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        if (distFromCenter > this.radius - 40 + 40) {
          b.stamina = 0;
          b.element.style.animation = "none";
          console.log(`${b.name} was knocked out!`);
        }
      }
    }

    for (let i = 0; i < this.blades.length; i++) {
      for (let j = i + 1; j < this.blades.length; j++) {
        const a = this.blades[i], b = this.blades[j];
        const now = performance.now();
        a.lastHitTime ??= 0;
        b.lastHitTime ??= 0;

        if (a.isColliding(b) && now - a.lastHitTime > 200 && now - b.lastHitTime > 200) {
          a.lastHitTime = now;
          b.lastHitTime = now;

          const dx = b.posX - a.posX;
          const dy = b.posY - a.posY;
          const angle = angleBetween(a.posX, a.posY, b.posX, b.posY);
          const { x: normX, y: normY } = normalizedVector(a.posX, a.posY, b.posX, b.posY);
          const dist = distance(a.posX, a.posY, b.posX, b.posY);


          const force = (a.power + b.power) * 0.5;
          const aMass = getTypeMass(a.type);
          const bMass = getTypeMass(b.type);

          const effectA = getTypeEffect(a.type);
          const effectB = getTypeEffect(b.type);

          const knockStrength = 400;
          const baseDrain = 5;

          // Equal and opposite knockback
          a.velX -= (force / aMass) * normX;
          a.velY -= (force / aMass) * normY;
          b.velX += (force / bMass) * normX;
          b.velY += (force / bMass) * normY;

          // Knockback with type effect
          a.velX += normX * knockStrength * effectA.knockback;
          a.velY += normY * knockStrength * effectA.knockback;
          b.velX -= normX * knockStrength * effectB.knockback;
          b.velY -= normY * knockStrength * effectB.knockback;

          // Reflect attacker's velocity if defender has reflect effect
          if (effectB.reflect > 0) {
            const reflected = reflectVector(a.velX, a.velY, normX, normY);
            a.velX = reflected.x * effectB.reflect;
            a.velY = reflected.y * effectB.reflect;
          }

          // Reflect defender's velocity if attacker has reflect effect (less common)
          if (effectA.reflect > 0) {
            const reflected = reflectVector(b.velX, b.velY, -normX, -normY);
            b.velX = reflected.x * effectA.reflect;
            b.velY = reflected.y * effectA.reflect;
          }

          a.drain(baseDrain * effectB.staminaDrain);
          b.drain(baseDrain * effectA.staminaDrain);

          // Separation logic
          const separation = 30;
          a.posX += normX * separation;
          a.posY += normY * separation;
          b.posX -= normX * separation;
          b.posY -= normY * separation;

          // Minimum distance adjustment
          const minDistance = 75;
          const actualDistance = Math.hypot(a.posX - b.posX, a.posY - b.posY);
          if (actualDistance < minDistance) {
            const overlap = (minDistance - actualDistance) / 2;
            a.posX -= normX * overlap;
            a.posY -= normY * overlap;
            b.posX += normX * overlap;
            b.posY += normY * overlap;
          }

          // Inner circle knockout
          const midX = (a.posX + b.posX) / 2;
          const midY = (a.posY + b.posY) / 2;
          const distToCenter = Math.hypot(midX - this.cx, midY - this.cy);

          if (distToCenter < this.circleRadius) {
            const ejectForce = 1200;
            const centerBoost = 1.2;
            if (effectA.knockback > effectB.knockback) {
              a.velX += normX * ejectForce * effectA.knockback * centerBoost;
              a.velY += normY * ejectForce * effectA.knockback * centerBoost;
              b.velX -= normX * ejectForce * 0.5;
              b.velY -= normY * ejectForce * 0.5;
            } else {
              b.velX -= normX * ejectForce * effectB.knockback * centerBoost;
              b.velY -= normY * ejectForce * effectB.knockback * centerBoost;
              a.velX += normX * ejectForce * 0.5;
              a.velY += normY * ejectForce * 0.5;
            }
          }

          // Reverse weaker spinner outside center
          if (effectA.knockback < effectB.knockback) a.clockwise = !a.clockwise;
          else if (effectB.knockback < effectA.knockback) b.clockwise = !b.clockwise;

          console.log(`${a.name || 'Blade A'} hit ${b.name || 'Blade B'}`);
          if (BattleEngine.onHit) BattleEngine.onHit();
        }
      }
    }

    this.blades.forEach(b => b.render());

    const spinning = this.blades.filter(b => b.stamina > 0);
    if (spinning.length <= 1) {
      this.running = false;
      BattleEngine.onEnd?.(spinning[0] ?? null);
      return;
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}