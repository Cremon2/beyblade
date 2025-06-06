// main.js
// Entry point – wire UI to game
import Beyblade from "./beyblade.js";
import Player from "./player.js";
import BattleEngine from './battle.js';

// DOM references
const stadiumEl = document.getElementById('stadium');
const launchBtn  = document.getElementById('launchBeyblade');
const hitSound   = document.getElementById('hitSound');

// Single player & 2 blades demo
const player1 = new Player('Player 1');

// Type-based instantiation
const dragoon = new Beyblade("beyblade", "Dragoon", player1, {
    stamina: 1200,
    power: 500,
    type: "attack"
  });
  
  const dranzer = new Beyblade("dranzer", "Dranzer", player1, {
    stamina: 1200,
    power: 25,
    type: "stamina"
  });

  const draciel = new Beyblade("draciel", "Draciel", player1, {
    stamina: 1200,
    power: 25,
    type: "defense"
  });

  const byakko = new Beyblade("byakko", "Byakko", player1, {
    stamina: 1200,
    power: 25,
    type: "balance"
  });
  
player1.addBeyblade(dragoon);
player1.addBeyblade(dranzer);
player1.addBeyblade(draciel);
player1.addBeyblade(byakko);

// Prepare scoreboard UI
document.getElementById('player').textContent = player1.name;

dragoon.spawn(stadiumEl.offsetLeft + 150, stadiumEl.offsetTop + 130);
dranzer.spawn(stadiumEl.offsetLeft + 250, stadiumEl.offsetTop + 170);
draciel.spawn(stadiumEl.offsetLeft + 350, stadiumEl.offsetTop + 210);
byakko.spawn(stadiumEl.offsetLeft + 450, stadiumEl.offsetTop + 250);

let engine = null;

// SFX callback
BattleEngine.onHit = () => {
  hitSound.currentTime = 0;
  hitSound.play();
};

BattleEngine.onEnd = winner => {
  if (winner) {
    alert(`${winner.name} wins!`);
  } else {
    alert('It\'s a draw!');
  }
  launchBtn.disabled = false;
};

const countdownSound = new Audio('goshoot.mp3');

launchBtn.addEventListener('click', () => {
    if (engine?.running) return;
    launchBtn.disabled = true;

    // Play countdown sound
    countdownSound.currentTime = 0;
    countdownSound.play();

    // Reset stamina & positions each battle
    [dragoon, dranzer].forEach(b => {
        b.stamina = b.maxStamina;
        b.velX = Math.random() * 4 - 2;
        b.velY = Math.random() * 4 - 2;
        b.element.style.animation = `spin ${b.spinDuration} linear infinite`;
    });

    dragoon.posX = stadiumEl.offsetLeft + 550;
    dragoon.posY = stadiumEl.offsetTop + 550;
    dranzer.posX = stadiumEl.offsetLeft + -200;
    dranzer.posY = stadiumEl.offsetTop + -200;

    // Create new engine instance
    engine = new BattleEngine(stadiumEl, [dragoon, dranzer, draciel, byakko]);
    engine.start();
});
