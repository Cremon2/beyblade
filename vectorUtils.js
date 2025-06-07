// vectorUtils.js

/** Returns distance between two points */
export function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
  }
  
  /** Returns normalized direction vector (unit vector) from (x1, y1) to (x2, y2) */
  export function normalizedVector(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    return dist === 0 ? { x: 0, y: 0 } : { x: dx / dist, y: dy / dist };
  }
  
  /** Returns angle in radians from (x1, y1) to (x2, y2) */
  export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
  }
  
  /**
   * Reflects a velocity vector (vx, vy) over a normal (nx, ny)
   * @param {number} vx - Velocity x
   * @param {number} vy - Velocity y
   * @param {number} nx - Normal x (should be normalized)
   * @param {number} ny - Normal y
   * @returns {{ x: number, y: number }} Reflected velocity vector
   */
  export function reflectVector(vx, vy, nx, ny) {
    const dot = vx * nx + vy * ny;
    return {
      x: vx - 2 * dot * nx,
      y: vy - 2 * dot * ny
    };
  }
  