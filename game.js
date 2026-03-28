const wizardTypes = [
  {
    name: "Red Wizard",
    robe: "#b33535",
    trim: "#ffd3a1",
    leaning: "Black-leaning path",
    elements: "Fire and Earth",
    dimensionName: "Ashen Rift",
    dimensionText: "Black-leaning wizards channel Fire and Earth as they endure brutal dungeon worlds.",
  },
  {
    name: "Blue Wizard",
    robe: "#3165c6",
    trim: "#d6e9ff",
    leaning: "White-leaning path",
    elements: "Air and Water",
    dimensionName: "Tempest Mirror",
    dimensionText: "White-leaning wizards bend Air and Water to navigate unstable skies and drowning ruins.",
  },
  {
    name: "Green Wizard",
    robe: "#2f8b47",
    trim: "#d3ffe1",
    leaning: "Black-leaning path",
    elements: "Fire and Earth",
    dimensionName: "Rootfire Depths",
    dimensionText: "This path grips Fire and Earth together, where living roots twist through volcanic caverns.",
  },
  {
    name: "Grey Wizard",
    robe: "#7d7f88",
    trim: "#f0f2f5",
    leaning: "White-leaning path",
    elements: "Air and Water",
    dimensionName: "Misted Vault",
    dimensionText: "Grey wizards lean toward Air and Water, drifting between storm fog, rain, and falling stone.",
  },
  {
    name: "White Wizard",
    robe: "#e7ecf2",
    trim: "#5c6576",
    leaning: "White-leaning path",
    elements: "Air and Water",
    dimensionName: "Celestial Tide",
    dimensionText: "The White Wizard follows the lightest current of Air and Water through shining parallel worlds.",
  },
  {
    name: "Black Wizard",
    robe: "#191919",
    trim: "#b8b8b8",
    leaning: "Black-leaning path",
    elements: "Fire and Earth",
    dimensionName: "Obsidian Maw",
    dimensionText: "The Black Wizard leans deepest into Fire and Earth, where demons and dark stone answer in kind.",
  },
];

const enemyCatalog = [
  { type: "Gollum", color: "#7f8d52", eye: "#f8ffd1" },
  { type: "Elemental", color: "#4c9dce", eye: "#e3fbff" },
  { type: "Dragon", color: "#b64b39", eye: "#fff0c8" },
  { type: "Gargoyl", color: "#6d7485", eye: "#e1e7ff" },
  { type: "Demon", color: "#6a1d34", eye: "#ffd4c4" },
  { type: "Spirit", color: "#90b0ff", eye: "#ffffff" },
  { type: "Dark Wizard", color: "#332243", eye: "#f8dcff" },
];

const introScenes = [
  {
    key: "village",
    duration: 5200,
    subtitle: "Sparklebrook looked harmless. That was its first mistake.",
    caption:
      "Wizard Boy, Derek, and Destralea are having a cheerful pixel evening when ominous nonsense begins to gather above the village.",
  },
  {
    key: "possession",
    duration: 5200,
    subtitle: "A demon picks Derek like the worst party game prize imaginable.",
    caption:
      "The demon dives into Derek in a swirl of spooky jazz-hands energy. Derek is now possessed and dramatically unwell.",
  },
  {
    key: "tragedy",
    duration: 5200,
    subtitle: "Destralea gets cartoonishly obliterated by demon nonsense. Very tragic. Very rude.",
    caption:
      "Derek, under the demon's control, strikes down Destralea. Wizard Boy lunges in too late while the universe turns all the way melodramatic.",
  },
  {
    key: "portal",
    duration: 5600,
    subtitle: "Wizard Boy gets absolutely punted into a parallel dimension.",
    caption:
      "The demon's chaos knocks Wizard Boy through a dimensional portal. One day he will return as Stick Wizard, dungeon-diving across the elemental worlds to find home.",
  },
];

const introPanel = document.getElementById("intro-panel");
const menu = document.getElementById("menu");
const gamePanel = document.getElementById("game-panel");
const optionsRoot = document.getElementById("wizard-options");
const selectedName = document.getElementById("selected-name");
const selectedLeaning = document.getElementById("selected-leaning");
const selectedElements = document.getElementById("selected-elements");
const selectedDimension = document.getElementById("selected-dimension");
const selectedDimensionText = document.getElementById("selected-dimension-text");
const previewHat = document.getElementById("preview-hat");
const previewRobe = document.getElementById("preview-robe");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const hudWizard = document.getElementById("hud-wizard");
const statusText = document.getElementById("status-text");
const introSubtitle = document.getElementById("intro-subtitle");
const introCaption = document.getElementById("intro-caption");
const skipHint = document.getElementById("skip-hint");

const introCanvas = document.getElementById("intro-canvas");
const introCtx = introCanvas.getContext("2d");
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const keys = new Set();
let selectedWizard = wizardTypes[0];
let gameState = null;
let animationFrameId = null;
let introAnimationFrameId = null;
let lastTimestamp = 0;
let introLastTimestamp = 0;
let introElapsed = 0;
let activeIntroSceneIndex = -1;
let escapeSkipArmedUntil = 0;
let introTriggeredEvents = new Set();
let audioContext = null;
let musicLoopHandle = null;
let musicLoopStarted = false;

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
    makeEnemy(520, 365, 55, enemyCatalog[0]),
    makeEnemy(760, 310, 65, enemyCatalog[1]),
    makeEnemy(1050, 320, 90, enemyCatalog[2]),
    makeEnemy(1380, 260, 55, enemyCatalog[3]),
    makeEnemy(1660, 340, 75, enemyCatalog[4]),
    makeEnemy(2140, 330, 90, enemyCatalog[5]),
    makeEnemy(2470, 405, 70, enemyCatalog[6]),
  ];
}

function makeEnemy(x, y, patrolDistance, profile) {
  return {
    x,
    y,
    w: 34,
    h: 34,
    vx: 80,
    baseX: x,
    patrolDistance,
    type: profile.type,
    color: profile.color,
    eye: profile.eye,
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
  statusText.textContent = `Wizard Boy enters the ${selectedWizard.dimensionName} with ${selectedWizard.elements}.`;
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
  selectedLeaning.textContent = selectedWizard.leaning;
  selectedElements.textContent = selectedWizard.elements;
  selectedDimension.textContent = selectedWizard.dimensionName;
  selectedDimensionText.textContent = selectedWizard.dimensionText;
  hudWizard.textContent = selectedWizard.name;
  previewHat.style.borderBottomColor = selectedWizard.robe;
  previewRobe.style.background = selectedWizard.robe;

  document.querySelectorAll(".wizard-option").forEach((button) => {
    button.classList.toggle("selected", button.getAttribute("data-name") === selectedWizard.name);
  });
}

function startIntro() {
  introElapsed = 0;
  introLastTimestamp = 0;
  activeIntroSceneIndex = -1;
  escapeSkipArmedUntil = 0;
  introTriggeredEvents = new Set();
  skipHint.classList.remove("armed");
  skipHint.textContent = "Press `Esc` twice to skip the tragedy.";
  introPanel.classList.remove("hidden");
  menu.classList.add("hidden");
  gamePanel.classList.add("hidden");
  introAnimationFrameId = requestAnimationFrame(runIntroFrame);
}

function runIntroFrame(timestamp) {
  if (!introLastTimestamp) {
    introLastTimestamp = timestamp;
  }

  const delta = Math.min(timestamp - introLastTimestamp, 48);
  introLastTimestamp = timestamp;
  introElapsed += delta;

  const sceneInfo = getIntroScene(introElapsed);
  if (!sceneInfo) {
    finishIntro();
    return;
  }

  if (sceneInfo.index !== activeIntroSceneIndex) {
    activeIntroSceneIndex = sceneInfo.index;
    introSubtitle.textContent = sceneInfo.scene.subtitle;
    introCaption.textContent = sceneInfo.scene.caption;
    triggerIntroSceneSound(sceneInfo.scene.key);
  }

  maybeTriggerIntroEvent(sceneInfo.scene.key, sceneInfo.localTime);

  renderIntroScene(sceneInfo.scene.key, sceneInfo.localTime, sceneInfo.progress, introElapsed);
  introAnimationFrameId = requestAnimationFrame(runIntroFrame);
}

function getIntroScene(elapsed) {
  let offset = 0;
  for (let index = 0; index < introScenes.length; index += 1) {
    const scene = introScenes[index];
    const end = offset + scene.duration;
    if (elapsed < end) {
      const localTime = elapsed - offset;
      return {
        index,
        scene,
        localTime,
        progress: localTime / scene.duration,
      };
    }
    offset = end;
  }
  return null;
}

function finishIntro(skipped = false) {
  cancelAnimationFrame(introAnimationFrameId);
  introAnimationFrameId = null;
  introPanel.classList.add("hidden");
  menu.classList.remove("hidden");
  skipHint.classList.remove("armed");
  skipHint.textContent = "Press `Esc` twice to skip the tragedy.";
  introTriggeredEvents = new Set();
  if (skipped) {
    introCaption.textContent = "Skip confirmed. The tragedy has been respectfully fast-forwarded.";
  }
}

function maybeTriggerIntroEvent(sceneKey, localTime) {
  if (sceneKey === "tragedy" && localTime >= 2700 && !introTriggeredEvents.has("demon-laugh")) {
    introTriggeredEvents.add("demon-laugh");
    playDemonicLaugh();
  }
}

function startGame() {
  ensureAudioContext();
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

function renderIntroScene(sceneKey, localTime, progress, elapsed) {
  introCtx.clearRect(0, 0, introCanvas.width, introCanvas.height);
  drawIntroBackdrop(sceneKey, progress);
  drawIntroGround(sceneKey);

  if (sceneKey === "village") {
    drawVillageScene(localTime, progress);
  } else if (sceneKey === "possession") {
    drawPossessionScene(localTime, progress);
  } else if (sceneKey === "tragedy") {
    drawTragedyScene(localTime, progress);
  } else if (sceneKey === "portal") {
    drawPortalScene(localTime, progress);
  }

  drawIntroFrame(sceneKey, elapsed);
}

function drawIntroBackdrop(sceneKey, progress) {
  const gradient = introCtx.createLinearGradient(0, 0, 0, introCanvas.height);
  if (sceneKey === "village") {
    gradient.addColorStop(0, "#2f4378");
    gradient.addColorStop(0.65, "#6b8ec0");
    gradient.addColorStop(1, "#d2b27b");
  } else if (sceneKey === "possession") {
    gradient.addColorStop(0, "#29173a");
    gradient.addColorStop(0.55, "#6a2d62");
    gradient.addColorStop(1, "#1b1226");
  } else if (sceneKey === "tragedy") {
    gradient.addColorStop(0, "#2c0a15");
    gradient.addColorStop(0.55, "#7b2036");
    gradient.addColorStop(1, "#19070d");
  } else {
    gradient.addColorStop(0, "#10061d");
    gradient.addColorStop(0.45, "#2f1455");
    gradient.addColorStop(1, "#070812");
  }
  introCtx.fillStyle = gradient;
  introCtx.fillRect(0, 0, introCanvas.width, introCanvas.height);

  introCtx.fillStyle = "rgba(255,255,255,0.08)";
  for (let i = 0; i < 36; i += 1) {
    const x = (i * 83 + progress * 35) % introCanvas.width;
    const y = (i * 41) % 220;
    introCtx.fillRect(x, y, 2, 2);
  }
}

function drawIntroGround(sceneKey) {
  introCtx.fillStyle = sceneKey === "village" ? "#4b7f4f" : "#46353d";
  introCtx.fillRect(0, 400, introCanvas.width, 140);
  introCtx.fillStyle = sceneKey === "village" ? "#7dc46f" : "#7a4f68";
  introCtx.fillRect(0, 390, introCanvas.width, 12);
}

function drawVillageScene(localTime) {
  const bob = Math.sin(localTime / 240) * 2;
  drawPixelHouse(80, 210, "#9f6a46");
  drawPixelHouse(710, 205, "#7d558f");
  drawPixelCharacter(260, 330 + bob, {
    robe: "#4f8cff",
    hat: "#5ca3ff",
    trim: "#e7f0ff",
    hair: "#3a1f12",
    face: "#f1c6a8",
  });
  drawPixelCharacter(420, 330 - bob, {
    robe: "#4e935d",
    hat: "#6bb07b",
    trim: "#dbffe3",
    hair: "#402315",
    face: "#eab79c",
  });
  drawPixelCharacter(560, 330 + bob, {
    robe: "#f26b93",
    hat: "#ff86aa",
    trim: "#ffe2ee",
    hair: "#5b2c18",
    face: "#f3c7aa",
  });
  drawWordBurst("BEST FRIEND ENERGY", 350, 110, "#fff5ae");
  drawWordBurst("DATE NIGHT", 560, 150, "#ffd2f1");
}

function drawPossessionScene(localTime, progress) {
  drawPixelCharacter(260, 332, {
    robe: "#4f8cff",
    hat: "#5ca3ff",
    trim: "#e7f0ff",
    hair: "#3a1f12",
    face: "#f1c6a8",
  });
  drawPixelCharacter(560, 332, {
    robe: "#f26b93",
    hat: "#ff86aa",
    trim: "#ffe2ee",
    hair: "#5b2c18",
    face: "#f3c7aa",
  });
  drawPixelCharacter(410, 332, {
    robe: "#34543b",
    hat: "#4f7759",
    trim: "#d7ffe3",
    hair: "#402315",
    face: "#eab79c",
  });
  drawDemon(410, 155 + Math.sin(localTime / 130) * 8, progress);
  drawPossessionSpiral(420, 245, progress);
  drawWordBurst("OH NO DEREK", 404, 92, "#ffc9df");
}

function drawTragedyScene(localTime, progress) {
  drawPixelCharacter(248, 334, {
    robe: "#4f8cff",
    hat: "#5ca3ff",
    trim: "#e7f0ff",
    hair: "#3a1f12",
    face: "#f1c6a8",
  });
  drawPixelCharacter(430 + progress * 100, 332, {
    robe: "#581f2e",
    hat: "#7d243b",
    trim: "#ffd0d7",
    hair: "#281310",
    face: "#d8a58f",
    eyes: "#ffcfdf",
  });
  drawPixelCharacter(620, 340 + Math.min(progress * 60, 30), {
    robe: "#f26b93",
    hat: "#ff86aa",
    trim: "#ffe2ee",
    hair: "#5b2c18",
    face: "#f3c7aa",
    fallen: true,
  });
  drawImpactStar(598, 280, 1 + progress * 0.8);
  drawGhostRose(690, 240 - progress * 50);
  drawWordBurst("BONK OF DOOM", 520, 110, "#ffe88f");
  drawWordBurst("NOOOO!", 215, 146, "#bfe1ff");
  if (localTime > 2400) {
    drawSpeechBubble(715, 150, "DESTRALEA!");
  }
}

function drawPortalScene(localTime, progress) {
  drawPortal(540, 235, 1 + progress * 0.35);
  drawDemon(290, 168 + Math.sin(localTime / 90) * 6, 0.8);
  drawPixelCharacter(210 + progress * 250, 318 - progress * 120, {
    robe: "#4f8cff",
    hat: "#5ca3ff",
    trim: "#e7f0ff",
    hair: "#3a1f12",
    face: "#f1c6a8",
    tilted: true,
  });
  drawPixelCharacter(720, 338, {
    robe: "#581f2e",
    hat: "#7d243b",
    trim: "#ffd0d7",
    hair: "#281310",
    face: "#d8a58f",
  });
  drawWordBurst("DIMENSION YEET", 528, 110, "#dfc0ff");
  drawSpeechBubble(186, 120, "I WILL BECOME SO DRAMATIC");
}

function drawIntroFrame(sceneKey, elapsed) {
  introCtx.strokeStyle = "rgba(255, 248, 220, 0.28)";
  introCtx.lineWidth = 10;
  introCtx.strokeRect(12, 12, introCanvas.width - 24, introCanvas.height - 24);

  introCtx.fillStyle = "rgba(10, 12, 21, 0.45)";
  introCtx.fillRect(20, 20, 210, 36);
  introCtx.fillStyle = "#fff2be";
  introCtx.font = "700 16px Nunito";
  introCtx.fillText(`Scene: ${sceneKey.toUpperCase()}`, 34, 44);

  introCtx.fillStyle = "rgba(10, 12, 21, 0.45)";
  introCtx.fillRect(760, 20, 178, 36);
  introCtx.fillStyle = "#ffd788";
  introCtx.fillText(`${Math.ceil((getTotalIntroDuration() - elapsed) / 1000)}s`, 885, 44);
}

function drawPixelHouse(x, y, wallColor) {
  introCtx.fillStyle = wallColor;
  introCtx.fillRect(x, y, 120, 120);
  introCtx.fillStyle = "#5b2a1a";
  introCtx.fillRect(x - 14, y - 30, 148, 34);
  introCtx.fillStyle = "#f7d788";
  introCtx.fillRect(x + 20, y + 22, 24, 24);
  introCtx.fillRect(x + 74, y + 22, 24, 24);
  introCtx.fillStyle = "#352219";
  introCtx.fillRect(x + 50, y + 64, 22, 56);
}

function drawPixelCharacter(x, y, palette) {
  const px = Math.round(x);
  const py = Math.round(y);
  const tilt = palette.tilted ? -6 : 0;
  introCtx.save();
  introCtx.translate(px, py);
  introCtx.rotate((tilt * Math.PI) / 180);
  introCtx.fillStyle = palette.face;
  introCtx.fillRect(-8, -34, 16, 14);
  introCtx.fillStyle = palette.hair;
  introCtx.fillRect(-8, -38, 16, 5);
  introCtx.fillStyle = palette.hat;
  introCtx.fillRect(-10, -46, 20, 8);
  introCtx.fillRect(-4, -62, 8, 16);
  introCtx.fillStyle = palette.robe;
  introCtx.fillRect(-13, -20, 26, 26);
  introCtx.fillRect(-10, 6, 8, 18);
  introCtx.fillRect(2, 6, 8, 18);
  introCtx.fillStyle = palette.trim;
  introCtx.fillRect(-2, -18, 4, 22);
  introCtx.fillStyle = palette.eyes || "#1c1523";
  introCtx.fillRect(-5, -30, 2, 2);
  introCtx.fillRect(3, -30, 2, 2);
  introCtx.fillStyle = "#7b5125";
  introCtx.fillRect(12, -10, 4, 26);
  if (palette.fallen) {
    introCtx.fillStyle = "rgba(255,255,255,0.15)";
    introCtx.fillRect(-20, 24, 40, 6);
  }
  introCtx.restore();
}

function drawDemon(x, y, progress) {
  const px = Math.round(x);
  const py = Math.round(y);
  introCtx.fillStyle = "#1b0616";
  introCtx.fillRect(px - 22, py - 12, 44, 38);
  introCtx.fillStyle = "#8d2448";
  introCtx.fillRect(px - 30, py - 22, 16, 10);
  introCtx.fillRect(px + 14, py - 22, 16, 10);
  introCtx.fillStyle = "#ffd5c4";
  introCtx.fillRect(px - 11, py - 2, 5, 5);
  introCtx.fillRect(px + 6, py - 2, 5, 5);
  introCtx.fillStyle = "#ff5f79";
  introCtx.fillRect(px - 8, py + 12, 16, 4);
  introCtx.strokeStyle = `rgba(255, 91, 128, ${0.35 + progress * 0.4})`;
  introCtx.lineWidth = 4;
  introCtx.beginPath();
  introCtx.arc(px, py + 8, 34 + progress * 12, 0, Math.PI * 2);
  introCtx.stroke();
}

function drawPossessionSpiral(x, y, progress) {
  introCtx.strokeStyle = "rgba(232, 114, 196, 0.8)";
  introCtx.lineWidth = 5;
  introCtx.beginPath();
  for (let i = 0; i <= 18; i += 1) {
    const angle = i * 0.7 + progress * 9;
    const radius = 8 + i * 4;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius * 0.6;
    if (i === 0) {
      introCtx.moveTo(px, py);
    } else {
      introCtx.lineTo(px, py);
    }
  }
  introCtx.stroke();
}

function drawImpactStar(x, y, scale) {
  introCtx.save();
  introCtx.translate(x, y);
  introCtx.scale(scale, scale);
  introCtx.fillStyle = "#ffd766";
  introCtx.beginPath();
  introCtx.moveTo(0, -28);
  introCtx.lineTo(10, -8);
  introCtx.lineTo(32, 0);
  introCtx.lineTo(10, 8);
  introCtx.lineTo(0, 28);
  introCtx.lineTo(-10, 8);
  introCtx.lineTo(-32, 0);
  introCtx.lineTo(-10, -8);
  introCtx.closePath();
  introCtx.fill();
  introCtx.restore();
}

function drawGhostRose(x, y) {
  introCtx.fillStyle = "#ffd7f1";
  introCtx.fillRect(x, y, 10, 10);
  introCtx.fillRect(x - 10, y + 4, 10, 6);
  introCtx.fillRect(x + 10, y + 4, 10, 6);
  introCtx.fillStyle = "#baf2d3";
  introCtx.fillRect(x + 4, y + 10, 2, 30);
}

function drawPortal(x, y, scale) {
  introCtx.save();
  introCtx.translate(x, y);
  introCtx.scale(scale, scale);
  introCtx.fillStyle = "#7f48ff";
  introCtx.beginPath();
  introCtx.ellipse(0, 0, 95, 125, 0, 0, Math.PI * 2);
  introCtx.fill();
  introCtx.fillStyle = "#d0a4ff";
  introCtx.beginPath();
  introCtx.ellipse(0, 0, 62, 90, 0, 0, Math.PI * 2);
  introCtx.fill();
  introCtx.fillStyle = "#30204d";
  introCtx.beginPath();
  introCtx.ellipse(0, 0, 38, 60, 0, 0, Math.PI * 2);
  introCtx.fill();
  introCtx.restore();
}

function drawWordBurst(text, x, y, color) {
  introCtx.fillStyle = "rgba(14, 12, 23, 0.5)";
  introCtx.fillRect(x - 18, y - 24, text.length * 8 + 20, 28);
  introCtx.fillStyle = color;
  introCtx.font = "700 18px MedievalSharp";
  introCtx.fillText(text, x, y - 4);
}

function drawSpeechBubble(x, y, text) {
  const width = text.length * 8 + 26;
  introCtx.fillStyle = "#fff5df";
  introCtx.fillRect(x, y, width, 30);
  introCtx.fillRect(x + 12, y + 30, 10, 10);
  introCtx.fillStyle = "#2b1d16";
  introCtx.font = "700 14px Nunito";
  introCtx.fillText(text, x + 10, y + 20);
}

function getTotalIntroDuration() {
  return introScenes.reduce((total, scene) => total + scene.duration, 0);
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
      statusText.textContent = `Nice hit. Wizard Boy struck down the ${enemy.type}.`;
      return;
    }

    const hitByFireball = projectiles.find(
      (projectile) => projectile.active && overlaps(getProjectileHitbox(projectile), enemy),
    );

    if (hitByFireball) {
      enemy.alive = false;
      hitByFireball.active = false;
      statusText.textContent = `The fireball hit cleanly and burned the ${enemy.type}.`;
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
    statusText.textContent = `Stick Wizard survived the ${selectedWizard.dimensionName} and moved one step closer to home.`;
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
    statusText.textContent = "Not enough MP. Fireball needs 1 MP to cross the dimension.";
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

  statusText.textContent = `Fireball cast through the ${selectedWizard.dimensionName}. MP left: ${player.mp}`;
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
  ctx.fillStyle = enemy.color;
  drawRoundedRect(enemy.x, enemy.y + bobOffset, enemy.w, enemy.h, 12);

  ctx.fillStyle = enemy.eye;
  ctx.beginPath();
  ctx.arc(enemy.x + 11, enemy.y + 12 + bobOffset, 4, 0, Math.PI * 2);
  ctx.arc(enemy.x + 23, enemy.y + 12 + bobOffset, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#25163f";
  ctx.beginPath();
  ctx.arc(enemy.x + 11, enemy.y + 12 + bobOffset, 2, 0, Math.PI * 2);
  ctx.arc(enemy.x + 23, enemy.y + 12 + bobOffset, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(17, 22, 32, 0.85)";
  ctx.font = "700 10px Nunito";
  ctx.textAlign = "center";
  ctx.fillText(enemy.type, enemy.x + enemy.w / 2, enemy.y - 8 + bobOffset);
  ctx.textAlign = "start";
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
  ctx.fillText(`${selectedWizard.elements}`, 28, 85);

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

function ensureAudioContext() {
  if (!audioContext) {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }
    audioContext = new AudioCtor();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  if (!musicLoopStarted) {
    startSpookyMusic();
  }
}

function startSpookyMusic() {
  if (!audioContext || musicLoopStarted) {
    return;
  }

  musicLoopStarted = true;
  playMusicPhrase();
  musicLoopHandle = window.setInterval(playMusicPhrase, 3600);
}

function playMusicPhrase() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime + 0.02;
  const bass = [110, 98, 87, 82];
  const melody = [220, 261.63, 246.94, 196, 174.61, 196];

  bass.forEach((freq, index) => {
    playTone(freq, now + index * 0.9, 0.65, "triangle", 0.05);
  });

  melody.forEach((freq, index) => {
    const start = now + index * 0.32;
    playTone(freq, start, 0.22, "sine", 0.02);
    playTone(freq * 2, start, 0.12, "square", 0.01);
  });
}

function playTone(frequency, startTime, duration, type, volume) {
  if (!audioContext) {
    return;
  }

  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

function playNoiseBurst(startTime, duration, volume, playbackRate = 1) {
  if (!audioContext) {
    return;
  }

  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
  }

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(playbackRate, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start(startTime);
}

function triggerIntroSceneSound(sceneKey) {
  ensureAudioContext();
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime + 0.02;
  if (sceneKey === "village") {
    playTone(523.25, now, 0.16, "square", 0.02);
    playTone(659.25, now + 0.12, 0.16, "square", 0.018);
  } else if (sceneKey === "possession") {
    playTone(160, now, 0.7, "sawtooth", 0.035);
    playNoiseBurst(now, 0.5, 0.02, 0.8);
  } else if (sceneKey === "tragedy") {
    playTone(110, now, 0.25, "square", 0.05);
    playTone(82.41, now + 0.08, 0.35, "triangle", 0.04);
    playNoiseBurst(now, 0.18, 0.05, 1.1);
  } else if (sceneKey === "portal") {
    playTone(196, now, 0.8, "sine", 0.03);
    playTone(392, now + 0.1, 0.6, "triangle", 0.02);
    playNoiseBurst(now + 0.05, 0.42, 0.03, 1.4);
  }
}

function playDemonicLaugh() {
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime + 0.03;
  const laughNotes = [
    { time: 0.0, freq: 146.83, length: 0.22, gain: 0.07 },
    { time: 0.22, freq: 138.59, length: 0.24, gain: 0.075 },
    { time: 0.5, freq: 130.81, length: 0.28, gain: 0.082 },
    { time: 0.84, freq: 123.47, length: 0.34, gain: 0.09 },
    { time: 1.25, freq: 110.0, length: 0.52, gain: 0.11 },
  ];

  laughNotes.forEach((note, index) => {
    playLaughBurst(now + note.time, note.freq, note.length, note.gain, index);
  });

  playTone(73.42, now + 1.68, 1.2, "sawtooth", 0.06);
  playTone(55.0, now + 1.7, 1.35, "triangle", 0.05);
  playNoiseBurst(now + 0.18, 0.2, 0.035, 0.6);
  playNoiseBurst(now + 0.82, 0.24, 0.03, 0.7);
  playNoiseBurst(now + 1.64, 0.42, 0.028, 0.55);
}

function playLaughBurst(startTime, frequency, duration, volume, index) {
  if (!audioContext) {
    return;
  }

  const oscA = audioContext.createOscillator();
  const oscB = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(900 - index * 80, startTime);

  oscA.type = "sawtooth";
  oscB.type = "square";
  oscA.frequency.setValueAtTime(frequency, startTime);
  oscB.frequency.setValueAtTime(frequency * 0.5, startTime);
  oscA.frequency.exponentialRampToValueAtTime(frequency * 0.84, startTime + duration);
  oscB.frequency.exponentialRampToValueAtTime(frequency * 0.46, startTime + duration);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(volume * 0.55, startTime + duration * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscA.connect(filter);
  oscB.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscA.start(startTime);
  oscB.start(startTime);
  oscA.stop(startTime + duration + 0.05);
  oscB.stop(startTime + duration + 0.05);
}

function handleEscapeSkip() {
  if (introPanel.classList.contains("hidden")) {
    return;
  }

  const now = performance.now();
  ensureAudioContext();
  if (now <= escapeSkipArmedUntil) {
    playTone(440, audioContext ? audioContext.currentTime + 0.01 : 0, 0.08, "square", 0.03);
    finishIntro(true);
    return;
  }

  escapeSkipArmedUntil = now + 2200;
  skipHint.classList.add("armed");
  skipHint.textContent = "Press `Esc` again now to skip the tragedy.";
  if (audioContext) {
    playTone(220, audioContext.currentTime + 0.01, 0.1, "square", 0.025);
  }
  window.setTimeout(() => {
    if (performance.now() > escapeSkipArmedUntil) {
      skipHint.classList.remove("armed");
      skipHint.textContent = "Press `Esc` twice to skip the tragedy.";
    }
  }, 2250);
}

document.addEventListener("keydown", (event) => {
  ensureAudioContext();
  keys.add(event.key);

  if (event.key === "Escape") {
    handleEscapeSkip();
  }

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

document.addEventListener("pointerdown", () => {
  ensureAudioContext();
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", showMenu);

buildWizardPicker();
updateWizardSelection();
startIntro();
