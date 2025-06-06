// player.js
// Defines the Player class used to group Beyblades and scores

export default class Player {
    constructor(name) {
      this.name = name;
      this.score = 0;
      this.beyblades = [];
    }
  
    addBeyblade(blade) {
      this.beyblades.push(blade);
    }
  
    incScore(pts = 1) {
      this.score += pts;
    }
  
    toString() {
      return `${this.name} (Score: ${this.score})`;
    }
  }
  