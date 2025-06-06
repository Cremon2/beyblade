// beyblade.js
// Defines the Beyblade class and all related behavior

export default class Beyblade {
    constructor(id, name, owner, { stamina = 700, power = 150, type = "balance" } = {}) {
        this.id = id;
        this.name = name;
        this.owner = owner;
        this.stamina = stamina;
        this.maxStamina = stamina;
        this.power = power;
        this.type = type; 
        this.lastHitTime = 0;

      
        this.posX = 0;
        this.posY = 0;
        this.velX = 0;
        this.velY = 0;
      }      
  
    /** Adjust base stats based on Beyblade type */
    setStatsByType(baseStamina, basePower) {
      switch (this.type) {
        case "attack":
          this.power = basePower + 50;
          this.stamina = baseStamina - 200;
          break;
        case "defense":
          this.power = basePower - 20;
          this.stamina = baseStamina + 100;
          break;
        case "stamina":
          this.power = basePower - 30;
          this.stamina = baseStamina + 300;
          break;
        case "balance":
        default:
          this.power = basePower;
          this.stamina = baseStamina;
          break;
      }
      this.maxStamina = this.stamina;
    }
  
    get element() {
      return document.getElementById(this.id);
    }
  
    get staminaBar() {
      return document.getElementById(`${this.id}-stamina`);
    }
  
    get spinDuration() {
        const inverse = 1 - (this.stamina / this.maxStamina);
        const factor = Math.min(0.75, 0.25 + (inverse * 0.5)); // 0.25s when full, 0.75s when empty
        return factor.toFixed(2) + "s";
      }     
  
    spawn(x, y) {
      this.posX = x;
      this.posY = y;
  
      const el = this.element;
      el.style.display = "block";
      el.style.left = `${x - 40}px`;
      el.style.top = `${y - 40}px`;
      el.style.animation = `spin ${this.spinDuration} linear infinite`;
  
      const bar = this.staminaBar;
      bar.style.display = "block";
      bar.style.width = "100%";
    }
  
    drain(amount) {
      this.stamina = Math.max(0, this.stamina - amount);
  
      const pct = (this.stamina / this.maxStamina) * 100;
      this.staminaBar.style.width = pct + "%";
  
      this.element.style.animationDuration = this.spinDuration;
  
      if (this.stamina === 0) this.element.style.animation = "none";
    }
  
    bounceFromBoundary(cx, cy, radius, bladeRadius = 40) {
      const dx = this.posX - cx;
      const dy = this.posY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist + bladeRadius > radius) {
        const ang = Math.atan2(dy, dx);
        this.velX = -Math.cos(ang) * Math.abs(this.velX);
        this.velY = -Math.sin(ang) * Math.abs(this.velY);
        this.posX = cx + Math.cos(ang) * (radius - bladeRadius - 1);
        this.posY = cy + Math.sin(ang) * (radius - bladeRadius - 1);
      }
    }
  
    render() {
      this.element.style.left = `${this.posX - 40}px`;
      this.element.style.top = `${this.posY - 40}px`;
    }
  
    isColliding(other, bladeRadius = 40) {
      const dx = this.posX - other.posX;
      const dy = this.posY - other.posY;
      return Math.hypot(dx, dy) < bladeRadius * 2.2;
    }
  }
  