const wizardTypes = [
  { name: "Red Wizard", robe: "#b33535", trim: "#ffd3a1" },
  { name: "Blue Wizard", robe: "#3165c6", trim: "#d6e9ff" },
  { name: "Green Wizard", robe: "#2f8b47", trim: "#d3ffe1" },
  { name: "Grey Wizard", robe: "#7d7f88", trim: "#f0f2f5" },
  { name: "White Wizard", robe: "#e7ecf2", trim: "#5c6576" },
  { name: "Black Wizard", robe: "#191919", trim: "#b8b8b8" },
];

const menu = document.getElementById("menu");
const gamePanel = document.getElementById("game-panel");
const optionsRoot = document.getElementById("wizard-options");
const selectedName = document.getElementById("selected-name");
const previewHat = document.getElementById("preview-hat");
const previewRobe = document.getElementById("preview-robe");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const hudWizard = document.getElementById("hud-wizard");
const statusText = document.getElementById("status-text");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = new Set();
let selectedWizard = wizardTypes[0];
let gameState = null;
let animationFrameId = null;
let lastTimestamp = 0;

const levelWidth = 2800;
const gravity = 1700;
const fireballSpeed = 920;
const fireballCost = 1;
const maxMp = 3;

function createPlatforms() {
  return [
    { x: 0, y: 470, w: 420, h: 100 },
    { x: 360, y: 405, w: 180, h: 26 },
    { x: 610, y: 350, w: 140, h: 24 },
    { x: 820, y: 425, w: 160, h: 24 },
    { x: 1030, y: 360, w: 210, h: 24 },
    { x: 1320, y: 300, w: 120, h: 24 },
    { x: 1500, y: 380, w: 220, h: 24 },
    { x: 1815, y: 450, w: 240, h: 100 },
    { x: 2055, y: 370, w: 180, h: 24 },
    { x: 2310, y: 320, w: 160, h: 24 },
    { x: 2500, y: 450, w: 320, h: 100 },
  ];
}

function createEnemies() {
  return [
    makeEnemy(680, 300, 70),
    makeEnemy(1110, 310, 90),
    makeEnemy(1590, 330, 80),
    makeEnemy(2100, 320, 100),
  ];
}

function makeEnemy(x, y, patrolDistance) {
  return {
    x,
    y,
    w: 34,
    h: 34,
    vx: 80,
    baseX: x,
    patrolDistance,
    alive: true,
    bob: Math.random() * Math.PI * 2,
  };
}

function createPlayer() {
  return {
    x: 70,
    y: 320,
    w: 38,
    h: 58,
    vx: 0,
    vy: 0,
    speed: 270,
    jumpPower: 640,
    onGround: false,
    facing: 1,
    attacking: false,
    attackTimer: 0,
    attackDuration: 0.18,
    health: 3,
    mp: maxMp,
    invincibleTimer: 0,
  };
}

function resetGame() {
  gameState = {
    player: createPlayer(),
    platforms: createPlatforms(),
    enemies: createEnemies(),
    projectiles: [],
    cameraX: 0,
    goalX: 2640,
    won: false,
    lost: false,
  };
  statusText.textContent = "Walk, jump, swing your stick, or spend 1 MP to launch a fireball.";
}

function buildWizardPicker() {
  optionsRoot.innerHTML = "";
  wizardTypes.forEach((wizard) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wizard-option";
    button.setAttribute("data-name", wizard.name);
    button.innerHTML = `
      <div class="swatch" style="background:${wizard.robe}"></div>
      <span class="name">${wizard.name}</span>
    `;
    button.addEventListener("click", () => {
      selectedWizard = wizard;
      updateWizardSelection();
    });
    optionsRoot.appendChild(button);
  });
}

function updateWizardSelection() {
  selectedName.textContent = selectedWizard.name;
  hudWizard.textContent = selectedWizard.name;
  previewHat.style.borderBottomColor = selectedWizard.robe;
  previewRobe.style.background = selectedWizard.robe;

  document.querySelectorAll(".wizard-option").forEach((button) => {
    button.classList.toggle("selected", button.getAttribute("data-name") === selectedWizard.name);
  });
}

function startGame() {
  menu.classList.add("hidden");
  gamePanel.classList.remove("hidden");
  resetGame();
  lastTimestamp = 0;
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(gameLoop);
}

function showMenu() {
  gamePanel.classList.add("hidden");
  menu.classList.remove("hidden");
  cancelAnimationFrame(animationFrameId);
}

function gameLoop(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const delta = Math.min((timestamp - lastTimestamp) / 1000, 0.033);
  lastTimestamp = timestamp;

  update(delta);
  render();

  if (!gameState.won && !gameState.lost) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function update(delta) {
  const { player, platforms, enemies, projectiles } = gameState;

  const movingLeft = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const movingRight = keys.has("ArrowRight") || keys.has("d") || keys.has("D");

  if (movingLeft && !movingRight) {
    player.vx = -player.speed;
    player.facing = -1;
  } else if (movingRight && !movingLeft) {
    player.vx = player.speed;
    player.facing = 1;
  } else {
    player.vx *= 0.82;
    if (Math.abs(player.vx) < 5) {
      player.vx = 0;
    }
  }

  player.vy += gravity * delta;
  player.onGround = false;

  player.x += player.vx * delta;
  resolveHorizontalCollisions(player, platforms);

  player.y += player.vy * delta;
  resolveVerticalCollisions(player, platforms);

  player.x = Math.max(0, Math.min(levelWidth - player.w, player.x));

  if (player.attackTimer > 0) {
    player.attackTimer -= delta;
    if (player.attackTimer <= 0) {
      player.attacking = false;
      player.attackTimer = 0;
    }
  }

  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= delta;
  }

  projectiles.forEach((projectile) => {
    if (!projectile.active) {
      return;
    }

    projectile.x += projectile.vx * delta;
    projectile.distance += Math.abs(projectile.vx) * delta;

    if (projectile.distance >= canvas.width || projectile.x < -80 || projectile.x > levelWidth + 80) {
      projectile.active = false;
    }
  });

  enemies.forEach((enemy) => {
    if (!enemy.alive) {
      return;
    }

    enemy.x += enemy.vx * delta;
    enemy.bob += delta * 5;
    if (enemy.x < enemy.baseX - enemy.patrolDistance || enemy.x > enemy.baseX + enemy.patrolDistance) {
      enemy.vx *= -1;
    }

    if (player.attacking && overlaps(getAttackHitbox(player), enemy)) {
      enemy.alive = false;
      statusText.textContent = "Nice hit. Your stick knocked a critter away.";
      return;
    }

    const hitByFireball = projectiles.find(
      (projectile) => projectile.active && overlaps(getProjectileHitbox(projectile), enemy),
    );

    if (hitByFireball) {
      enemy.alive = false;
      hitByFireball.active = false;
      statusText.textContent = "The fireball hit cleanly and burned a critter away.";
      return;
    }

    if (overlaps(player, enemy) && player.invincibleTimer <= 0) {
      player.health -= 1;
      player.invincibleTimer = 1.1;
      player.vx = -player.facing * 240;
      player.vy = -260;
      statusText.textContent = `Ouch. Wizard health: ${player.health}`;
      if (player.health <= 0) {
        gameState.lost = true;
        statusText.textContent = "The wizard fell in battle. Pick a wizard and try again.";
      }
    }
  });

  gameState.cameraX = Math.max(0, Math.min(levelWidth - canvas.width, player.x - canvas.width * 0.35));

  if (player.y > canvas.height + 180) {
    gameState.lost = true;
    statusText.textContent = "The wizard fell off the path. Pick a wizard and try again.";
  }

  if (player.x >= gameState.goalX) {
    gameState.won = true;
    statusText.textContent = `Victory. ${selectedWizard.name} cleared the forest with stick and spellcraft.`;
  }

  gameState.projectiles = projectiles.filter((projectile) => projectile.active);
}

function resolveHorizontalCollisions(player, platforms) {
  platforms.forEach((platform) => {
    if (!overlaps(player, platform)) {
      return;
    }

    if (player.vx > 0) {
      player.x = platform.x - player.w;
    } else if (player.vx < 0) {
      player.x = platform.x + platform.w;
    }
    player.vx = 0;
  });
}

function resolveVerticalCollisions(player, platforms) {
  platforms.forEach((platform) => {
    if (!overlaps(player, platform)) {
      return;
    }

    if (player.vy > 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (player.vy < 0) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  });
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getAttackHitbox(player) {
  const width = 34;
  return {
    x: player.facing === 1 ? player.x + player.w - 2 : player.x - width + 2,
    y: player.y + 20,
    w: width,
    h: 14,
  };
}

function getProjectileHitbox(projectile) {
  return {
    x: projectile.x - projectile.radius,
    y: projectile.y - projectile.radius,
    w: projectile.radius * 2,
    h: projectile.radius * 2,
  };
}

function jump() {
  if (!gameState || gameState.won || gameState.lost) {
    return;
  }

  const { player } = gameState;
  if (player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }
}

function attack() {
  if (!gameState || gameState.won || gameState.lost) {
    return;
  }

  const { player } = gameState;
  if (!player.attacking) {
    player.attacking = true;
    player.attackTimer = player.attackDuration;
  }
}

function castFireball() {
  if (!gameState || gameState.won || gameState.lost) {
    return;
  }

  const { player, projectiles } = gameState;
  if (player.mp < fireballCost) {
    statusText.textContent = "Not enough MP. Fireball needs 1 MP.";
    return;
  }

  player.mp -= fireballCost;
  projectiles.push({
    x: player.facing === 1 ? player.x + player.w + 6 : player.x - 6,
    y: player.y + 28,
    vx: fireballSpeed * player.facing,
    radius: 12,
    active: true,
    distance: 0,
    facing: player.facing,
  });

  statusText.textContent = `Fireball cast. MP left: ${player.mp}`;
}

function drawBackground(cameraX) {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#88b9ff");
  sky.addColorStop(0.45, "#d8f0ff");
  sky.addColorStop(0.451, "#8fd27d");
  sky.addColorStop(1, "#406b30");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  drawCloud(120 - cameraX * 0.15, 82, 60);
  drawCloud(430 - cameraX * 0.12, 120, 48);
  drawCloud(760 - cameraX * 0.18, 90, 56);

  ctx.fillStyle = "#699fd9";
  drawHill(130 - cameraX * 0.2, 335, 210, 120);
  drawHill(480 - cameraX * 0.17, 355, 290, 110);
  drawHill(860 - cameraX * 0.2, 328, 250, 135);

  ctx.fillStyle = "#497537";
  drawHill(200 - cameraX * 0.3, 390, 280, 90);
  drawHill(670 - cameraX * 0.28, 398, 360, 96);
  drawHill(1090 - cameraX * 0.25, 388, 300, 98);
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.28, 0, Math.PI * 2);
  ctx.arc(x + size * 0.28, y - 10, size * 0.35, 0, Math.PI * 2);
  ctx.arc(x + size * 0.56, y, size * 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawHill(x, y, width, height) {
  ctx.beginPath();
  ctx.moveTo(x, canvas.height);
  ctx.quadraticCurveTo(x + width * 0.5, y - height, x + width, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function render() {
  const { player, platforms, enemies, projectiles, cameraX, goalX } = gameState;

  drawBackground(cameraX);

  ctx.save();
  ctx.translate(-cameraX, 0);

  platforms.forEach((platform) => drawPlatform(platform));
  drawGoal(goalX);
  enemies.forEach((enemy) => drawEnemy(enemy));
  projectiles.forEach((projectile) => drawFireball(projectile));
  drawPlayer(player);

  ctx.restore();

  drawOverlay(player);
}

function drawPlatform(platform) {
  const dirt = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.h);
  dirt.addColorStop(0, "#7c4e20");
  dirt.addColorStop(1, "#4d2f16");
  ctx.fillStyle = dirt;
  ctx.fillRect(platform.x, platform.y, platform.w, platform.h);

  ctx.fillStyle = "#67a34e";
  ctx.fillRect(platform.x, platform.y - 10, platform.w, 12);

  ctx.fillStyle = "#8fcf6a";
  for (let i = 0; i < platform.w; i += 26) {
    ctx.fillRect(platform.x + i + 3, platform.y - 14, 9, 5);
  }
}

function drawGoal(goalX) {
  ctx.fillStyle = "#775026";
  ctx.fillRect(goalX + 32, 245, 10, 205);
  ctx.fillStyle = "#ffe083";
  ctx.beginPath();
  ctx.moveTo(goalX + 42, 255);
  ctx.lineTo(goalX + 100, 280);
  ctx.lineTo(goalX + 42, 305);
  ctx.closePath();
  ctx.fill();
}

function drawEnemy(enemy) {
  if (!enemy.alive) {
    return;
  }

  const bobOffset = Math.sin(enemy.bob) * 2;
  ctx.fillStyle = "#7b4dc3";
  drawRoundedRect(enemy.x, enemy.y + bobOffset, enemy.w, enemy.h, 12);

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(enemy.x + 11, enemy.y + 12 + bobOffset, 4, 0, Math.PI * 2);
  ctx.arc(enemy.x + 23, enemy.y + 12 + bobOffset, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#25163f";
  ctx.beginPath();
  ctx.arc(enemy.x + 11, enemy.y + 12 + bobOffset, 2, 0, Math.PI * 2);
  ctx.arc(enemy.x + 23, enemy.y + 12 + bobOffset, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer(player) {
  const screenX = player.x;
  const hatColor = selectedWizard.robe;
  const robeColor = selectedWizard.robe;
  const trimColor = selectedWizard.trim;
  const isBlinking = player.invincibleTimer > 0 && Math.floor(player.invincibleTimer * 10) % 2 === 0;
  if (isBlinking) {
    ctx.globalAlpha = 0.45;
  }

  ctx.fillStyle = "#f2c8a8";
  ctx.fillRect(screenX + 10, player.y + 12, 18, 18);

  ctx.fillStyle = hatColor;
  ctx.beginPath();
  ctx.moveTo(screenX + 8, player.y + 18);
  ctx.lineTo(screenX + 19, player.y - 8);
  ctx.lineTo(screenX + 32, player.y + 18);
  ctx.closePath();
  ctx.strokeStyle = "rgba(22, 26, 36, 0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fill();

  ctx.fillRect(screenX + 6, player.y + 16, 28, 6);

  ctx.fillStyle = robeColor;
  ctx.beginPath();
  ctx.moveTo(screenX + 8, player.y + 30);
  ctx.lineTo(screenX + 30, player.y + 30);
  ctx.lineTo(screenX + 37, player.y + 58);
  ctx.lineTo(screenX + 1, player.y + 58);
  ctx.closePath();
  ctx.strokeStyle = "rgba(22, 26, 36, 0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fill();

  ctx.fillStyle = trimColor;
  ctx.fillRect(screenX + 17, player.y + 30, 4, 28);

  ctx.strokeStyle = "#2e1d0b";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  const staffStartX = player.facing === 1 ? screenX + 30 : screenX + 8;
  const staffEndX = player.facing === 1 ? screenX + 40 : screenX - 2;
  const attackReach = player.attacking ? player.facing * 16 : 0;
  ctx.beginPath();
  ctx.moveTo(staffStartX, player.y + 34);
  ctx.lineTo(staffEndX + attackReach, player.y + 56);
  ctx.stroke();

  ctx.fillStyle = "#1a1322";
  ctx.fillRect(screenX + 10, player.y + 58, 7, 8);
  ctx.fillRect(screenX + 21, player.y + 58, 7, 8);

  ctx.globalAlpha = 1;
}

function drawFireball(projectile) {
  if (!projectile.active) {
    return;
  }

  const trailLength = 58;
  const trailEndX = projectile.x - projectile.facing * trailLength;
  const trail = ctx.createLinearGradient(projectile.x, projectile.y, trailEndX, projectile.y);
  trail.addColorStop(0, "rgba(255, 242, 179, 0.95)");
  trail.addColorStop(0.5, "rgba(255, 123, 54, 0.7)");
  trail.addColorStop(1, "rgba(255, 79, 32, 0)");
  ctx.strokeStyle = trail;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(projectile.x, projectile.y);
  ctx.lineTo(trailEndX, projectile.y);
  ctx.stroke();

  const core = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, projectile.radius);
  core.addColorStop(0, "#fff7bf");
  core.addColorStop(0.5, "#ffb347");
  core.addColorStop(1, "#ff5a2c");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawOverlay(player) {
  ctx.fillStyle = "rgba(16, 20, 31, 0.45)";
  ctx.fillRect(16, 16, 188, 86);
  ctx.fillStyle = "#eef2ff";
  ctx.font = "700 18px Nunito";
  ctx.fillText(`Health: ${player.health}`, 28, 41);
  ctx.fillText(`MP: ${player.mp}/${maxMp}`, 28, 63);
  ctx.fillText(`Stick + Fireball`, 28, 85);

  if (gameState.won || gameState.lost) {
    ctx.fillStyle = "rgba(8, 10, 16, 0.66)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff4ce";
    ctx.font = "700 42px MedievalSharp";
    ctx.textAlign = "center";
    ctx.fillText(gameState.won ? "Forest Cleared!" : "Wizard Down!", canvas.width / 2, 220);
    ctx.font = "700 22px Nunito";
    ctx.fillStyle = "#eef2ff";
    ctx.fillText("Use the button below to pick a wizard and play again.", canvas.width / 2, 270);
    ctx.textAlign = "start";
  }
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  ctx.fill();
}

document.addEventListener("keydown", (event) => {
  keys.add(event.key);

  if (["ArrowUp", "w", "W", " "].includes(event.key)) {
    event.preventDefault();
    jump();
  }

  if (["f", "F", "j", "J", "Enter"].includes(event.key)) {
    attack();
  }

  if (["k", "K", "x", "X"].includes(event.key)) {
    castFireball();
  }
});

document.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", showMenu);

buildWizardPicker();
updateWizardSelection();
