// === Classes ===

class Beyblade {
    constructor(name, owner) {
        this.name = name;
        this.owner = owner;
        this.power = Math.floor(Math.random() * 100) + 100;
    }

    calculateDamage() {
        return Math.floor(Math.random() * this.power);
    }

    launchBeybladeAttack() {
        console.log(`${this.name} spins into battle!`);
    }

    get_info() {
        return `${this.name} - Power: ${this.power}`;
    }
}

class Player {
    constructor(name, score = 0) {
        this.name = name;
        this.score = score;
        this.beyblades = [];
    }

    display() {
        console.log(`Player Name: ${this.name}, Score: ${this.score}`);
    }

    updateScore(points) {
        this.score += points;
        console.log(`${this.name}'s new score: ${this.score}`);
    }

    addBeyblade(beyblade) {
        this.beyblades.push(beyblade);
    }

    launchBeybladeAttack(name) {
        const blade = this.beyblades.find(b => b.name === name);
        if (blade) {
            blade.launchBeybladeAttack();
        } else {
            console.log(`${name} not found in ${this.name}'s collection.`);
        }
    }

    getBeybladeInfo() {
        return this.beyblades.map(b => b.get_info());
    }
}

// === DOM & Game Logic ===

document.addEventListener("DOMContentLoaded", function () {
    const beyblade = document.getElementById("beyblade");
    const launchButton = document.getElementById("launchBeyblade");
    launchButton.addEventListener("click", launchBattle);

    // Draggable Logic
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    beyblade.addEventListener("mousedown", function (e) {
        isDragging = true;
        offsetX = e.clientX - beyblade.getBoundingClientRect().left;
        offsetY = e.clientY - beyblade.getBoundingClientRect().top;
    });

    document.addEventListener("mousemove", function (e) {
        if (isDragging) {
            beyblade.style.left = e.clientX - offsetX + "px";
            beyblade.style.top = e.clientY - offsetY + "px";
        }
    });

    document.addEventListener("mouseup", function () {
        isDragging = false;
    });

    // Game Initialization
    const player = new Player("Player 1");
    const dragoon = new Beyblade("Dragoon", player);
    player.addBeyblade(dragoon);
    const dranzer = new Beyblade("Dranzer", player);
    player.addBeyblade(dranzer);

    // UI labels
    document.getElementById("beyblade").innerText = dragoon.name;
    document.getElementById("player").innerText = player.name;
    document.getElementById("beybladeInfo").innerText = dragoon.get_info();

    class Game {
        constructor(player, blades) {
            this.player = player;
            this.blades = blades;
        }
        startBattle() { 
            function launchBattle() {
                const stadiumEl = document.getElementById("stadium");
                const stadiumRect = stadiumEl.getBoundingClientRect();
                const stadiumCenterX = stadiumRect.left + stadiumRect.width / 2;
                const stadiumCenterY = stadiumRect.top + stadiumRect.height / 2;
                const stadiumRadius = stadiumRect.width / 2;
            
                const blades = [
                    {
                        id: "beyblade",
                        staminaId: "staminaBar",
                        stamina: 1000,
                        staminaLossPerFrame: 0.5,
                        startX: stadiumCenterX,
                        startY: stadiumCenterY,
                        posX: 0,
                        posY: 0,
                        velX: 0,
                        velY: 0,
                        el: null,
                        bar: null
                    },
                    {
                        id: "dranzer",
                        staminaId: "staminaBarDranzer",
                        stamina: 500,
                        staminaLossPerFrame: 0.2,
                        startX: stadiumCenterX + 40,
                        startY: stadiumCenterY + 40,
                        posX: 0,
                        posY: 0,
                        velX: 0,
                        velY: 0,
                        el: null,
                        bar: null
                    }
                ];
            
                // Initialize blades
                blades.forEach(blade => {
                    blade.el = document.getElementById(blade.id);
                    blade.bar = document.getElementById(blade.staminaId);
                    blade.velX = Math.random() * 4 - 2;
                    blade.velY = Math.random() * 4 - 2;
                    blade.posX = blade.startX;
                    blade.posY = blade.startY;
            
                    blade.el.style.display = "block";
                    blade.el.style.animation = "spin 0.57s linear infinite";
                    blade.el.style.left = `${blade.posX - 40}px`;
                    blade.el.style.top = `${blade.posY - 40}px`;
            
                    blade.bar.style.display = "block";
                    blade.bar.style.width = blade.stamina + "%";
                });
            
                function animate() {
                    blades.forEach(blade => {
                        if (blade.stamina <= 0) {
                            blade.el.style.animation = "none";
                            return;
                        }
            
                        blade.stamina -= blade.staminaLossPerFrame;
                        blade.bar.style.width = blade.stamina + "%";
            
                        blade.velX += (Math.random() - 0.5) * 0.5;
                        blade.velY += (Math.random() - 0.5) * 0.5;
            
                        blade.posX += blade.velX;
                        blade.posY += blade.velY;
            
                        // Bounce off stadium wall
                        const dx = blade.posX - stadiumCenterX;
                        const dy = blade.posY - stadiumCenterY;
                        const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                        if (distanceFromCenter + 40 > stadiumRadius) {
                            const angle = Math.atan2(dy, dx);
                            blade.velX = -Math.cos(angle) * 2;
                            blade.velY = -Math.sin(angle) * 2;
                            blade.posX = stadiumCenterX + Math.cos(angle) * (stadiumRadius - 41);
                            blade.posY = stadiumCenterY + Math.sin(angle) * (stadiumRadius - 41);
                        }
            
                        blade.el.style.left = `${blade.posX - 40}px`;
                        blade.el.style.top = `${blade.posY - 40}px`;
                    });
            
                    // Handle collision between both blades
                    const [blade1, blade2] = blades;
                    const dx = blade1.posX - blade2.posX;
                    const dy = blade1.posY - blade2.posY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
            
                    if (distance < 80) { // assuming 40px radius per blade
                        // Simple bounce: swap velocities
                        const tempVelX = blade1.velX;
                        const tempVelY = blade1.velY;
                        blade1.velX = blade2.velX;
                        blade1.velY = blade2.velY;
                        blade2.velX = tempVelX;
                        blade2.velY = tempVelY;
            
                        // Move apart slightly
                        const angle = Math.atan2(dy, dx);
                        blade1.posX += Math.cos(angle) * 5;
                        blade1.posY += Math.sin(angle) * 5;
                        blade2.posX -= Math.cos(angle) * 5;
                        blade2.posY -= Math.sin(angle) * 5;
                    }
            
                    requestAnimationFrame(animate);
                }
            
                animate();
            }
         }
    }

    
    
    
    
    function checkCollision(elem1, elem2) {
        const r1 = elem1.getBoundingClientRect();
        const r2 = elem2.getBoundingClientRect();
    
        return !(
            r1.right < r2.left ||
            r1.left > r2.right ||
            r1.bottom < r2.top ||
            r1.top > r2.bottom
        );
    }
    
    function playHitSound() {
        const sound = document.getElementById("hitSound");
        sound.currentTime = 0;
        sound.play();
    }
    

    // Events
    launchButton.addEventListener("click", launchAttack);
    beyblade.addEventListener("click", launchAttack);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            launchAttack();
        }
    });

});
