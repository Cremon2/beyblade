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

const beyOptions = {
  beyblade: dragoon,
  dranzer: dranzer,
  draciel: draciel,
  byakko: byakko
};

// Prepare scoreboard UI
document.getElementById('player').textContent = player1.name;

// dragoon.spawn(stadiumEl.offsetLeft + 150, stadiumEl.offsetTop + 130);
// dranzer.spawn(stadiumEl.offsetLeft + 250, stadiumEl.offsetTop + 170);
// draciel.spawn(stadiumEl.offsetLeft + 350, stadiumEl.offsetTop + 210);
// byakko.spawn(stadiumEl.offsetLeft + 450, stadiumEl.offsetTop + 250);



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

  countdownSound.currentTime = 0;
  countdownSound.play();

  // 1. Get the selected player's Beyblade from dropdown
  const selectedId = beySelect.value;
  const playerBlade = beyOptions[selectedId];

  // 2. Choose a random enemy Beyblade (not the same one)
  const enemyCandidates = Object.keys(beyOptions).filter(id => id !== selectedId);
  const randomId = enemyCandidates[Math.floor(Math.random() * enemyCandidates.length)];
  const enemyBlade = beyOptions[randomId];

  // 3. Hide all Beyblades and stamina bars
  Object.values(beyOptions).forEach(b => {
    b.element.style.display = "none";
    b.staminaBar.style.display = "none";
  });

  // 4. Reset selected blades
  [playerBlade, enemyBlade].forEach(b => {
    b.stamina = b.maxStamina;
    b.velX = Math.random() * 4 - 2;
    b.velY = Math.random() * 4 - 2;
    b.element.style.animation = `spin ${b.spinDuration} linear infinite`;
  });

  const rect = stadiumEl.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Offset slightly so they don't overlap but still stay in the stadium
  playerBlade.posX = centerX + 80;
  playerBlade.posY = centerY;

  enemyBlade.posX = centerX - 80;
  enemyBlade.posY = centerY;

  // 6. Show only selected blades
  [playerBlade, enemyBlade].forEach(b => b.spawn(b.posX, b.posY));

  // 7. Start the battle
  engine = new BattleEngine(stadiumEl, [playerBlade, enemyBlade]);
  engine.start();
});
