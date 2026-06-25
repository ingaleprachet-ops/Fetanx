// ===== PART 1 =====
// Canvas + Socket + Menu + Tank + Mobile Variables

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const socket = io();

ctx.imageSmoothingEnabled = false;







canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

let playerName = "";
let gameStarted = false;

const menu = document.getElementById("menu");
const playBtn = document.getElementById("playBtn");
const nameInput = document.getElementById("nameInput");

playBtn.onclick = () => {
    playerName =
        nameInput.value.trim() || "Player";

    gameStarted = true;
    menu.style.display = "none";

    if ("ontouchstart" in window) {
        document.body.classList.add(
            "mobile-controls"
        );
    }
};

nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        playBtn.click();
    }
});

let players = {};

const tank = {
    x: canvas.width / 2,
    y: canvas.height / 2,

    angle: 0,

    speed: 0,
    maxSpeed: 3,
    accel: 0.05,

    hp: 1000,

    alive: true,
    respawnTimer: 0
};


const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 3000;

let kills = 0;
let deaths = 0;
let score = 0;

let frameCount = 0;

let mouseX = tank.x;
let mouseY = tank.y;

const bullets = [];

let reloadTimer = 0;

const explosions = [];
const tower = {
    x: 250,
    y: canvas.height / 2,
    hp: 5000,
    angle: 0
};

const enemyBullets = [];

let towerShootTimer = 0;

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();

mouseX = e.clientX - rect.left;
mouseY = e.clientY - rect.top;
});

// ===== MOBILE CONTROLS =====

const joystick =
    document.getElementById("joystick");

const stick =
    document.getElementById("stick");

const shootBtn =
    document.getElementById("shootBtn");

let joyX = 0;
let joyY = 0;

let joyStartX = 0;
let joyStartY = 0;

const isMobile =
    "ontouchstart" in window;

    // ===== PART 2 =====
// Shooting + Joystick + Movement

function shootBullet() {
    if (!tank.alive) return;
    if (reloadTimer > 0) return;

    const bullet = {
        x: tank.x,
        y: tank.y,
        angle: tank.angle,
        speed: 8,
        owner: socket.id
    };

    bullets.push(bullet);

    socket.emit("shoot", bullet);

    reloadTimer = 30;
}

canvas.addEventListener("click", () => {
    if (!isMobile) {
        shootBullet();
    }
});

shootBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    shootBullet();
});

joystick.addEventListener("touchstart", (e) => {
    joyStartX = e.touches[0].clientX;
    joyStartY = e.touches[0].clientY;
});

joystick.addEventListener("touchmove", (e) => {
  e.preventDefault();
    const dx = e.touches[0].clientX - joyStartX;
    const dy = e.touches[0].clientY - joyStartY;

    const dist = Math.min(
        Math.sqrt(dx * dx + dy * dy),
        100
    );

    const angle = Math.atan2(dy, dx);

    joyX = Math.cos(angle) * (dist / 100);
    joyY = Math.sin(angle) * (dist / 100);

    stick.style.transform =
        `translate(${joyX * 35}px, ${joyY * 35}px)`;
});

joystick.addEventListener("touchend", () => {
    joyX = 0;
    joyY = 0;

    stick.style.transform =
        "translate(0px,0px)";
});

function updateMovement() {

    // MOBILE
    if (isMobile) {

        tank.x += joyX * tank.maxSpeed;
        tank.y += joyY * tank.maxSpeed;

        if (joyX !== 0 || joyY !== 0) {
            tank.angle =
                Math.atan2(joyY, joyX);
        }

    } else {

        // PC
        const dx = mouseX - tank.x;
const dy = mouseY - tank.y;

        const distance =
            Math.sqrt(dx * dx + dy * dy);

        tank.angle =
            Math.atan2(dy, dx);

        if (distance > 20) {

            tank.speed = Math.min(
                tank.speed + tank.accel,
                tank.maxSpeed
            );

            tank.x +=
                Math.cos(tank.angle) *
                tank.speed;

            tank.y +=
                Math.sin(tank.angle) *
                tank.speed;

        } else {
            tank.speed = 0;
        }
    }

   tank.x = Math.max(
    25,
    Math.min(WORLD_WIDTH - 25, tank.x)
);

tank.y = Math.max(
    25,
    Math.min(WORLD_HEIGHT - 25, tank.y)
);
}
// ===== PART 3 =====
// Main Loop + Drawing + Multiplayer HP Sync

const bushes = [];
const rocks = [];
const trees = [];
const grassPatches = [];

for (let i = 0; i < 20; i++) {
    trees.push({
    x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
        size: 18 + Math.random() * 8
    });
}

for (let i = 0; i < 35; i++) {
    rocks.push({
        x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
        size: 8 + Math.random() * 10
    });
}

for (let i = 0; i < 50; i++) {
    bushes.push({
        x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
        size: 12 + Math.random() * 8
    });
}

for (let i = 0; i < 250; i++) {
    grassPatches.push({
        x: Math.random() * WORLD_WIDTH,
    y: Math.random() * WORLD_HEIGHT,
    });
}

function roundRect(x, y, w, h, r, color) {

    ctx.fillStyle = color;

    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);

    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(
        x + w,
        y + h,
        x + w - r,
        y + h
    );

    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(
        x,
        y + h,
        x,
        y + h - r
    );

    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
    );

    ctx.fill();
}
function loop() {

    // Background
ctx.fillStyle = "#5A8F47";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Grid
ctx.strokeStyle = "#4A7A3B";
ctx.lineWidth = 1;

for (let x = 0; x < canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
}


for (let y = 0; y < canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
}
for (let i = 0; i < 150; i++) {

    const gx =
        (i * 73) % canvas.width;

    const gy =
        (i * 47) % canvas.height;

    ctx.fillStyle =
        "rgba(255,255,255,0.05)";

    ctx.fillRect(gx, gy, 2, 2);
}
for (const g of grassPatches) {

    ctx.fillStyle = "#6EA95A";

    ctx.beginPath();
    ctx.arc(g.x, g.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(g.x + 3, g.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(g.x - 3, g.y + 1, 2, 0, Math.PI * 2);
    ctx.fill();
}

for (const rock of rocks) {

    ctx.fillStyle = "#777";

    ctx.beginPath();
    ctx.arc(
        rock.x,
        rock.y,
        rock.size,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#999";

    ctx.beginPath();
    ctx.arc(
        rock.x - 2,
        rock.y - 2,
        rock.size / 3,
        0,
        Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = "#555";
ctx.lineWidth = 2;

ctx.beginPath();
ctx.moveTo(rock.x - rock.size / 2, rock.y);
ctx.lineTo(rock.x + rock.size / 2, rock.y);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(rock.x, rock.y - rock.size / 2);
ctx.lineTo(rock.x, rock.y + rock.size / 2);
ctx.stroke();
}

for (const tree of trees) {

    // trunk
    ctx.fillStyle = "#6B3F00";
    ctx.beginPath();
    roundRect(
    tree.x - 4,
    tree.y,
    8,
    14,
    2,
    "#6B3F00"
);

    // leaves
    ctx.fillStyle = "#2E7D32";
    ctx.beginPath();
    ctx.arc(tree.x, tree.y - 8, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tree.x - 8, tree.y + 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(tree.x + 8, tree.y + 2, 10, 0, Math.PI * 2);
    ctx.fill();

    // highlight
    ctx.fillStyle = "#66BB6A";
    ctx.beginPath();
    ctx.arc(tree.x - 4, tree.y - 10, 4, 0, Math.PI * 2);
    ctx.fill();
}
for (const bush of bushes) {
    

    ctx.fillStyle = "#3D6B2F";

    ctx.beginPath();
    ctx.arc(
    bush.x,
    bush.y,
    bush.size,
    0,
    Math.PI * 2
);
    ctx.fill();

    ctx.fillStyle = "#4E8A3C";

    ctx.beginPath();
    ctx.arc(bush.x - 5, bush.y - 4, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(bush.x + 5, bush.y + 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6EB85A";

ctx.beginPath();
ctx.arc(
    bush.x - 4,
    bush.y - 5,
    3,
    0,
    Math.PI * 2
);
ctx.fill();
}

    if (!gameStarted) {
        requestAnimationFrame(loop);
        return;
    }

    if (tank.alive) {
        updateMovement();
    }
    // Tower AI
towerShootTimer--;

if (towerShootTimer <= 0 &&
    tank.alive &&
    tower.hp > 0) {

    const angle = Math.atan2(
        tank.y - tower.y,
        tank.x - tower.x
    );

    tower.angle = angle;
    enemyBullets.push({
        x: tower.x,
        y: tower.y,
        angle,
        speed: 4
    });

    towerShootTimer = 45;
}      
    if (tower.hp > 0) {

    // shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(
        tower.x,
        tower.y + 22,
        42,
        14,
        0,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = "#B0892D";
ctx.beginPath();
ctx.arc(
    tower.x,
    tower.y,
    42,
    0,
    Math.PI * 2
);
ctx.fill();

    // inner section
    roundRect(
        tower.x - 25,
        tower.y - 25,
        50,
        50,
        10,
        "#FFD54A"
    );

    // center turret
ctx.save();
ctx.translate(tower.x, tower.y);
ctx.rotate(tower.angle);

ctx.fillStyle = "#C9A63A";
ctx.beginPath();
ctx.arc(0, 0, 18, 0, Math.PI * 2);
ctx.fill();

roundRect(
    0,
    -5,
    42,
    10,
    4,
    "#333"
);

ctx.restore();
// door
roundRect(
    tower.x - 8,
    tower.y + 12,
    16,
    18,
    3,
    "#6B3F00"
);

// bolts
ctx.fillStyle = "#444";

ctx.beginPath();
ctx.arc(tower.x - 20, tower.y - 20, 2, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(tower.x + 20, tower.y - 20, 2, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(tower.x - 20, tower.y + 20, 2, 0, Math.PI * 2);
ctx.fill();

ctx.beginPath();
ctx.arc(tower.x + 20, tower.y + 20, 2, 0, Math.PI * 2);
ctx.fill();

ctx.fillStyle = "#ffd54a";
ctx.font = "bold 14px monospace";
ctx.textAlign = "center";

ctx.fillText(
    tower.hp,
    tower.x,
    tower.y - 50
    );
roundRect(
    tower.x - 40,
    tower.y - 65,
    80,
    8,
    4,
    "#222"
);

roundRect(
    tower.x - 40,
    tower.y - 65,
    80 * (tower.hp / 5000),
    8,
    4,
    "#FF4444"

    
);
}

if (tower.hp <= 0) {

    ctx.fillStyle = "#FF4444";
    ctx.font = "bold 40px monospace";
    ctx.textAlign = "center";

    ctx.fillText(
        "TOWER DESTROYED",
        canvas.width / 2,
        100
    );
}
    
    if (tank.alive) {

    ctx.fillStyle = "rgba(0,0,0,0.25)";

    ctx.beginPath();
    ctx.ellipse(
        tank.x,
        tank.y + 10,
        25,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();
}
    // Draw yourself
    if (tank.alive) {
        ctx.save();
        ctx.translate(tank.x, tank.y);
        ctx.rotate(tank.angle);
        roundRect(
    -28,
    -18,
    56,
    8,
    4,
    "#333"
);

roundRect(
    -28,
    10,
    56,
    8,
    4,
    "#333"
);

        ctx.shadowBlur = 15;
ctx.shadowColor = "#FFD54A";

roundRect(
    -25,
    -15,
    50,
    30,
    8,
    "#FFD54A"
);

ctx.shadowBlur = 0;

       
ctx.fillStyle = "#E6C13D";

ctx.beginPath();
ctx.arc(0, 0, 10, 0, Math.PI * 2);
ctx.fill();
ctx.fillStyle = "#FFF3B0";

ctx.beginPath();
ctx.arc(-3, -3, 3, 0, Math.PI * 2);
ctx.fill();
roundRect(
    0,
    -3,
    30,
    6,
    3,
    "#111"
);

        ctx.restore();
        ctx.fillStyle = "#FFD54A";
ctx.font = "bold 16px monospace";
ctx.textAlign = "center";
ctx.fillText(`${tank.hp}`, tank.x, tank.y - 60);
ctx.fillStyle = "#222";
roundRect(
    tank.x - 25,
    tank.y - 35,
    50,
    6,
    3,
    "#222"
);

ctx.fillStyle = "#FFD54A";
roundRect(
    tank.x - 25,
    tank.y - 35,
    50 * Math.max(
        0,
        Math.min(1, 1 - reloadTimer / 30)
    ),
    6,
    3,
    "#FFD54A"
);
    }

    // Draw other players
    for (const id in players) {
        if (id === socket.id) continue;

        const p = players[id];

        if ((p.hp || 0) <= 0) continue;
       
        
        ctx.fillStyle = "rgba(0,0,0,0.25)";

ctx.beginPath();
ctx.ellipse(
    p.x,
    p.y + 10,
    25,
    10,
    0,
    0,
    Math.PI * 2
);

ctx.fill();
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        roundRect(
    -25,
    -15,
    50,
    30,
    8,
    "#F4A261"
);

        ctx.fillStyle = "black";
        ctx.fillRect(0, -3, 30, 6);
        ctx.fillStyle = "#E08B44";

ctx.beginPath();
ctx.arc(0, 0, 10, 0, Math.PI * 2);
ctx.fill();

        ctx.restore();

        ctx.fillStyle = "#ffd54a";
ctx.font = "16px monospace";
ctx.textAlign = "center";

ctx.fillText(
    Math.floor(p.hp),
    p.x,
    p.y - 60
);

        ctx.fillStyle = "white";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";

        ctx.strokeStyle = "#000";
ctx.lineWidth = 3;

ctx.strokeText(
    p.name || "Player",
    p.x,
    p.y - 42
);
        ctx.fillText(
            p.name || "Player",
            p.x,
            p.y - 42
        );
    }

    frameCount++;

    if (frameCount % 6 === 0) {
            
           socket.emit("updatePlayer", {
            x: tank.x,
            y: tank.y,
            angle: tank.angle,
            
            name: playerName
        });
    }

    
    ctx.fillStyle = "#FFF";
ctx.font = "bold 18px monospace";
ctx.textAlign = "left";

ctx.fillText(
    `Kills: ${kills}`,
    20,
    40
);

ctx.fillText(
    `Deaths: ${deaths}`,
    20,
    70
);
    updateBullets();

if (reloadTimer > 0) {
    reloadTimer--;
}

ctx.fillStyle = "#FFD54A";
ctx.font = "bold 18px monospace";
ctx.textAlign = "left";

ctx.fillText(`Score: ${score}`, 20, 40);
ctx.fillText(`Deaths: ${deaths}`, 20, 70);

requestAnimationFrame(loop);
}
// ===== PART 4 =====
// Bullets + Damage + Respawn + Socket Events

// Receive players
socket.on("players", (serverPlayers) => {
    players = serverPlayers;

    if (players[socket.id]) {
    tank.hp = players[socket.id].hp;
    tank.alive = players[socket.id].hp > 0;
}
});

// Receive bullets
socket.on("shoot", (bullet) => {
    if (bullet.owner !== socket.id) {
        bullets.push(bullet);
    }
});

// Bullet movement + collisions
function updateBullets() {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const b = bullets[i];

        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        if (
    b.x < 0 ||
    b.x > canvas.width ||
    b.y < 0 ||
    b.y > canvas.height
) {
    bullets.splice(i, 1);
    continue;
}
        // Hit other players
if (b.owner === socket.id) {
    const dxTower = b.x - tower.x;
const dyTower = b.y - tower.y;

if (Math.sqrt(dxTower * dxTower + dyTower * dyTower) < 35) {
    tower.hp -= 50;

    if (tower.hp < 0) tower.hp = 0;

    bullets.splice(i, 1);
    continue;
}

    for (const id in players) {

        if (id === socket.id) continue;

        const p = players[id];

        const dx = b.x - p.x;
const dy = b.y - p.y;
if (Math.sqrt(dx * dx + dy * dy) < 30) {
    score += 100;
    socket.emit("hitPlayer", id);
    bullets.splice(i, 1);
    break;
}
    }
}

        // Hit me
        if (
            b.owner !== socket.id &&
            tank.alive &&
            Math.abs(b.x - tank.x) < 25 &&
            Math.abs(b.y - tank.y) < 15
        ) {

            tank.hp -= 250;
tank.hp = Math.max(0, tank.hp);

            bullets.splice(i, 1);

            if (tank.hp <= 0) {

                tank.hp = 0;
                tank.alive = false;

                deaths++;

                tank.respawnTimer = 180;

                socket.emit("updatePlayer", {
                    x: tank.x,
                    y: tank.y,
                    angle: tank.angle,
                    hp: 0,
                    name: playerName
                });
            }

            continue;
        }

        // Remove offscreen bullets
        if (
            b.x < 0 ||
            b.x > canvas.width ||
            b.y < 0 ||
            b.y > canvas.height
        ) {
            bullets.splice(i, 1);
            continue;
        }

        ctx.shadowBlur = 15;
ctx.shadowColor = "#FFD54A";

ctx.fillStyle = "#FFD54A";
ctx.beginPath();
ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
ctx.fill();

ctx.shadowBlur = 0;
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {

    const b = enemyBullets[i];

    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;

    if (
    b.x < 0 ||
    b.x > canvas.width ||
    b.y < 0 ||
    b.y > canvas.height
) {
    enemyBullets.splice(i, 1);
    continue;
}

    ctx.shadowBlur = 12;
ctx.shadowColor = "#FF8800";

ctx.fillStyle = "#FFAA00";
ctx.beginPath();
ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
ctx.fill();

ctx.shadowBlur = 0;

    if (
    tank.alive &&
    Math.abs(b.x - tank.x) < 25 &&
    Math.abs(b.y - tank.y) < 15
) {

    socket.emit("hitPlayer", socket.id);

    enemyBullets.splice(i, 1);

    continue;
}
}
    // Respawn
if (!tank.alive) {

    tank.respawnTimer--;

    if (tank.respawnTimer <= 0) {

        tank.alive = true;
        tank.hp = 1000;

        tank.x = 80;
        tank.y = canvas.height / 2;

        socket.emit("updatePlayer", {
            x: tank.x,
            y: tank.y,
            angle: tank.angle,
            hp: 1000,
            name: playerName
        });
    }
}

} // closes updateBullets()



loop();
