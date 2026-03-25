const STORAGE_KEY = "marioRomanticoState";
const CUSTOM_MESSAGES_DB_KEY = "marioRomanticoMessagesDb";
const MESSAGES_DB_FILE = "messages-db.json";

const appState = {
  playerName: "",
  character: "snoopy",
  messageStart: "Para ti ❤️",
  messageFinal: "Eres especial ❤️",
  soundEnabled: false
};

const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");

const nameInput = document.getElementById("nameInput");
const continueBtn = document.getElementById("continueBtn");
const restartBtn = document.getElementById("restartBtn");
const previewMessage = document.getElementById("previewMessage");
const messageDbStatus = document.getElementById("messageDbStatus");
const customNameInput = document.getElementById("customNameInput");
const customStartInput = document.getElementById("customStartInput");
const customEndInput = document.getElementById("customEndInput");
const saveCustomMessageBtn = document.getElementById("saveCustomMessageBtn");

const hudName = document.getElementById("hudName");
const hudHearts = document.getElementById("hudHearts");
const finalMessage = document.getElementById("finalMessage");
const softMessage = document.getElementById("softMessage");
const bouquetEvent = document.getElementById("bouquetEvent");
const soundToggle = document.getElementById("soundToggle");
const changeCharacterBtn = document.getElementById("changeCharacterBtn");
const heartModal = document.getElementById("heartModal");
const yesBtn = document.getElementById("yesBtn");
const noBtn = document.getElementById("noBtn");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const world = {
  width: 3400,
  height: 540,
  gravity: 0.52,
  floorY: 480
};

let keys = {};
let cameraX = 0;
let score = 0;
let totalHearts = 0;
let gameRunning = false;
let pausedByEvent = false;
let lastTime = 0;
let gameWon = false;
let phraseInterval = null;
let goalPromptShown = false;
let coyoteTimer = 0;
let jumpBufferTimer = 0;

const movementConfig = {
  accelGround: 0.72,
  accelAir: 0.4,
  frictionGround: 0.78,
  frictionAir: 0.92,
  maxFallSpeed: 15.5,
  coyoteFrames: 7,
  jumpBufferFrames: 7,
  jumpCutMultiplier: 0.55,
  edgeSnapPixels: 8
};

const phrases = ["Oye 😏", "Vas bien", "Mmm interesante", "No estás nada mal ❤️"];
let baseMessagesDb = {};
let customMessagesDb = {};

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

const player = {
  x: 70,
  y: 390,
  w: 34,
  h: 44,
  vx: 0,
  vy: 0,
  speed: 4.2,
  jump: -13.4,
  onGround: false
};

const characterImagePaths = {
  snoopy: "Snoopy.png",
  "hello-kitty": "Hellokitty.png",
  "spider-man": "Spiderman.png"
};

const characterImages = {
  snoopy: new Image(),
  "hello-kitty": new Image(),
  "spider-man": new Image()
};

const processedCharacterSprites = {
  snoopy: null,
  "hello-kitty": null,
  "spider-man": null
};

const bouquetImage = new Image();
bouquetImage.src = "flower_bouquet.png";

const characterRenderConfig = {
  snoopy: { width: 56, height: 56, yOffset: 2 },
  "hello-kitty": { width: 56, height: 56, yOffset: 2 },
  "spider-man": { width: 56, height: 56, yOffset: 2 }
};

const platforms = [
  { x: 0, y: 480, w: 520, h: 60 },
  { x: 550, y: 430, w: 210, h: 30 },
  { x: 810, y: 390, w: 180, h: 30 },
  { x: 1050, y: 450, w: 260, h: 30 },
  { x: 1380, y: 385, w: 210, h: 30 },
  { x: 1680, y: 335, w: 210, h: 30 },
  { x: 1940, y: 420, w: 250, h: 30 },
  { x: 2260, y: 360, w: 220, h: 30 },
  { x: 2440, y: 480, w: 300, h: 60 },
  { x: 2740, y: 430, w: 230, h: 30 },
  { x: 3020, y: 380, w: 210, h: 30 },
  { x: 3280, y: 330, w: 170, h: 30 }
];

const QUESTION_BLOCK_SIZE = 38;
const HEART_GOAL = 10;

const questionBlocksTemplate = [
  { x: 150, y: 305 },
  { x: 302, y: 305 },
  { x: 470, y: 305 },
  { x: 640, y: 305 },
  { x: 828, y: 305 },
  { x: 1120, y: 280 },
  { x: 1360, y: 320 },
  { x: 1600, y: 275 },
  { x: 1880, y: 305 },
  { x: 2150, y: 260 },
  { x: 2440, y: 320 },
  { x: 2720, y: 300 },
  { x: 3000, y: 250 },
  { x: 3250, y: 290 }
];

const brickDecorations = [
  { x: 188, y: 305, count: 3 },
  { x: 790, y: 305, count: 1 },
  { x: 866, y: 305, count: 2 },
  { x: 1040, y: 250, count: 4 },
  { x: 1470, y: 350, count: 5 },
  { x: 1980, y: 250, count: 4 },
  { x: 2360, y: 345, count: 4 },
  { x: 2840, y: 285, count: 3 },
  { x: 3140, y: 225, count: 3 }
];

const bouquet = {
  x: 1710,
  y: 270,
  visible: false,
  triggered: false
};

let hearts = [];
let questionBlocks = [];

function normalizeName(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function titleCaseName(value) {
  if (!value.trim()) return "";
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getPersonalizedMessages(name) {
  const normalized = normalizeName(name);
  const mergedDb = getMergedMessagesDb();
  const personMessages = normalized ? mergedDb[normalized] : null;

  if (personMessages) {
    return {
      start: personMessages.start,
      end: personMessages.end
    };
  }

  const displayName = titleCaseName(name);
  return {
    start: "Para ti ❤️",
    end: displayName ? `${displayName}, eres especial ❤️` : "Eres especial ❤️"
  };
}

function getMergedMessagesDb() {
  return {
    ...baseMessagesDb,
    ...customMessagesDb
  };
}

function normalizeMessagesDb(dbLike) {
  const normalizedDb = {};
  if (!dbLike || typeof dbLike !== "object") return normalizedDb;

  for (const [name, value] of Object.entries(dbLike)) {
    if (!value || typeof value !== "object") continue;
    const normalized = normalizeName(name);
    if (!normalized) continue;

    const displayName = titleCaseName(value.name || name) || titleCaseName(name);
    const start = String(value.start || "").trim();
    const end = String(value.end || "").trim();

    if (!start || !end) continue;

    normalizedDb[normalized] = {
      name: displayName,
      start,
      end
    };
  }

  return normalizedDb;
}

function saveCustomMessagesDb() {
  localStorage.setItem(CUSTOM_MESSAGES_DB_KEY, JSON.stringify(customMessagesDb));
}

function loadCustomMessagesDb() {
  const raw = localStorage.getItem(CUSTOM_MESSAGES_DB_KEY);
  customMessagesDb = {};
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    customMessagesDb = normalizeMessagesDb(parsed);
  } catch (error) {
    console.warn("No se pudo leer la mini base de mensajes personalizada", error);
  }
}

async function loadBaseMessagesDb() {
  baseMessagesDb = {};

  try {
    const response = await fetch(MESSAGES_DB_FILE, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const parsed = await response.json();
    baseMessagesDb = normalizeMessagesDb(parsed);
  } catch (error) {
    console.warn("No se pudo cargar la mini base externa de mensajes", error);
  }
}

async function loadMessagesDb() {
  await loadBaseMessagesDb();
  loadCustomMessagesDb();
}

function refreshMessageDbStatus(name = "") {
  if (!messageDbStatus) return;

  const mergedDb = getMergedMessagesDb();
  const count = Object.keys(mergedDb).length;
  const normalized = normalizeName(name);
  const exists = normalized && mergedDb[normalized];
  const base = `${count} persona(s) en la mini base.`;

  messageDbStatus.textContent = exists
    ? `${base} Ya existe mensaje para ${titleCaseName(name)}.`
    : base;
}

function syncCustomFormWithName(name) {
  if (!customNameInput || !customStartInput || !customEndInput) return;

  const trimmedName = name.trim();
  const normalized = normalizeName(trimmedName);
  const mergedDb = getMergedMessagesDb();

  customNameInput.value = trimmedName;

  if (normalized && mergedDb[normalized]) {
    customStartInput.value = mergedDb[normalized].start;
    customEndInput.value = mergedDb[normalized].end;
    return;
  }

  customStartInput.value = "";
  customEndInput.value = "";
}

function saveCustomMessage() {
  if (!customNameInput || !customStartInput || !customEndInput) return;

  const rawName = customNameInput.value.trim() || nameInput.value.trim();
  const normalized = normalizeName(rawName);
  if (!normalized) {
    alert("Escribe un nombre para guardar el mensaje personalizado.");
    return;
  }

  const start = customStartInput.value.trim();
  const end = customEndInput.value.trim();

  if (!start || !end) {
    alert("Completa mensaje inicial y mensaje final.");
    return;
  }

  customMessagesDb[normalized] = {
    name: titleCaseName(rawName),
    start,
    end
  };

  saveCustomMessagesDb();
  refreshMessageDbStatus(rawName);

  const activeName = nameInput.value.trim();
  if (normalizeName(activeName) === normalized) {
    const m = getPersonalizedMessages(activeName);
    previewMessage.textContent = m.start;
    appState.messageStart = m.start;
    appState.messageFinal = m.end;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    playerName: appState.playerName,
    character: appState.character,
    soundEnabled: appState.soundEnabled
  }));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    appState.playerName = parsed.playerName || "";
    appState.character = parsed.character || "snoopy";
    appState.soundEnabled = Boolean(parsed.soundEnabled);
  } catch (error) {
    console.warn("No se pudo leer localStorage", error);
  }
}

function setupFormFromState() {
  nameInput.value = appState.playerName;
  const radio = document.querySelector(`input[name="character"][value="${appState.character}"]`);
  if (radio) radio.checked = true;

  const m = getPersonalizedMessages(appState.playerName);
  appState.messageStart = m.start;
  appState.messageFinal = m.end;
  previewMessage.textContent = m.start;
  syncCustomFormWithName(appState.playerName);
  refreshMessageDbStatus(appState.playerName);
  updateSoundButton();
}

function setScreen(screenName) {
  startScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  endScreen.classList.remove("active");

  if (screenName === "start") startScreen.classList.add("active");
  if (screenName === "game") gameScreen.classList.add("active");
  if (screenName === "end") endScreen.classList.add("active");
}

function buildHearts() {
  hearts = [];
  questionBlocks = questionBlocksTemplate.map((block) => ({ ...block, used: false, bump: 0 }));
  totalHearts = HEART_GOAL;
  score = 0;
}

function getBlockRect(block) {
  return { x: block.x, y: block.y - block.bump, w: QUESTION_BLOCK_SIZE, h: QUESTION_BLOCK_SIZE };
}

function getBrickRects() {
  const rects = [];
  for (const group of brickDecorations) {
    for (let i = 0; i < group.count; i += 1) {
      rects.push({ x: group.x + i * 38, y: group.y, w: 38, h: 38 });
    }
  }
  return rects;
}

function getSolidRectsForHearts() {
  return [
    ...platforms.map((p) => ({ x: p.x, y: p.y, w: p.w, h: p.h })),
    ...questionBlocks.map((b) => getBlockRect(b)),
    ...getBrickRects()
  ];
}

function spawnHeartFromBlock(block) {
  hearts.push({
    x: block.x + QUESTION_BLOCK_SIZE * 0.5,
    y: block.y - 8,
    r: 11,
    taken: false,
    vy: -4.4,
    active: true
  });
}

function handleQuestionBlockHits(nextY) {
  if (player.vy >= 0) return nextY;

  let adjustedY = nextY;
  for (const block of questionBlocks) {
    if (block.used) continue;
    const rect = getBlockRect(block);
    const blockBottom = rect.y + rect.h;
    const overlapsX = player.x + player.w > rect.x + 2 && player.x < rect.x + rect.w - 2;
    const reachesBottom = player.y >= blockBottom && adjustedY <= blockBottom;
    if (!overlapsX || !reachesBottom) continue;

    adjustedY = blockBottom;
    player.vy = 0;
    block.used = true;
    block.bump = 8;
    spawnHeartFromBlock(block);
    playTone(650, 0.1, "square");
  }

  return adjustedY;
}

function updateSpawnedHearts(delta) {
  const solids = getSolidRectsForHearts();

  for (const h of hearts) {
    if (h.taken || !h.active) continue;

    h.vy += world.gravity * 0.52 * delta;
    let nextY = h.y + h.vy * delta;

    for (const rect of solids) {
      const overlapsX = h.x + h.r > rect.x && h.x - h.r < rect.x + rect.w;
      if (!overlapsX) continue;

      // Falling onto top of solid.
      if (h.vy >= 0 && h.y + h.r <= rect.y && nextY + h.r >= rect.y) {
        nextY = rect.y - h.r;
        h.vy = 0;
      }

      // Rising into bottom of solid.
      if (h.vy < 0 && h.y - h.r >= rect.y + rect.h && nextY - h.r <= rect.y + rect.h) {
        nextY = rect.y + rect.h + h.r;
        h.vy = 0;
      }
    }

    h.y = nextY;

    if (h.y + h.r >= world.floorY - 1) {
      h.y = world.floorY - h.r - 1;
      h.vy = 0;
    }
  }

  for (const block of questionBlocks) {
    if (block.bump > 0) block.bump = Math.max(0, block.bump - 0.8 * delta);
  }
}

function resetRun() {
  player.x = 70;
  player.y = 390;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;

  cameraX = 0;
  pausedByEvent = false;
  gameWon = false;
  goalPromptShown = false;
  coyoteTimer = 0;
  jumpBufferTimer = 0;
  bouquet.visible = false;
  bouquet.triggered = false;

  buildHearts();
  hudHearts.textContent = `CORAZONES:${score}`;
  hudName.textContent = appState.messageStart.replace("❤️", "").toUpperCase().trim();

  softMessage.classList.add("hidden");
  bouquetEvent.classList.add("hidden");
  hideHeartModal();

  if (phraseInterval) {
    clearInterval(phraseInterval);
    phraseInterval = null;
  }
}

function startGame() {
  resetRun();
  setScreen("game");
  gameRunning = true;
  lastTime = 0;
  startPhrases();
  requestAnimationFrame(loop);
}

function endGame() {
  gameRunning = false;
  if (phraseInterval) {
    clearInterval(phraseInterval);
    phraseInterval = null;
  }

  finalMessage.textContent = appState.messageFinal;
  setScreen("end");
}

function startPhrases() {
  const queue = [...phrases];
  let index = 0;
  phraseInterval = setInterval(() => {
    if (!gameRunning || pausedByEvent || gameWon) return;

    const text = queue[index % queue.length];
    index += 1;
    showSoftMessage(text);
  }, 5000);
}

function showSoftMessage(text) {
  softMessage.textContent = text;
  softMessage.classList.remove("hidden");

  setTimeout(() => {
    softMessage.classList.add("hidden");
  }, 2000);
}

function triggerBouquetEvent() {
  pausedByEvent = true;
  bouquet.visible = true;
  bouquet.triggered = true;
  bouquetEvent.classList.remove("hidden");
  playTone(660, 0.2, "triangle");

  setTimeout(() => {
    bouquetEvent.classList.add("hidden");
    pausedByEvent = false;
  }, 1800);
}

function loop(timestamp) {
  if (!gameRunning) return;

  const delta = Math.min((timestamp - lastTime) / 16.67 || 1, 2);
  lastTime = timestamp;

  if (!pausedByEvent) {
    update(delta);
  }

  render(timestamp / 1000);
  requestAnimationFrame(loop);
}

function update(delta) {
  const movingLeft = Boolean(keys.ArrowLeft || keys.KeyA);
  const movingRight = Boolean(keys.ArrowRight || keys.KeyD);
  const horizontalInput = (movingRight ? 1 : 0) - (movingLeft ? 1 : 0);

  const accel = player.onGround ? movementConfig.accelGround : movementConfig.accelAir;
  const friction = player.onGround ? movementConfig.frictionGround : movementConfig.frictionAir;

  if (horizontalInput !== 0) {
    player.vx += horizontalInput * accel * delta;
    player.vx = Math.max(-player.speed, Math.min(player.vx, player.speed));
  } else {
    player.vx *= Math.pow(friction, delta);
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  player.vy += world.gravity * delta;
  player.vy = Math.min(player.vy, movementConfig.maxFallSpeed);

  if (player.onGround) coyoteTimer = movementConfig.coyoteFrames;
  else coyoteTimer = Math.max(0, coyoteTimer - delta);

  jumpBufferTimer = Math.max(0, jumpBufferTimer - delta);
  if (jumpBufferTimer > 0 && coyoteTimer > 0) {
    player.vy = player.jump;
    player.onGround = false;
    coyoteTimer = 0;
    jumpBufferTimer = 0;
    playTone(420, 0.09, "square");
  }

  const jumpHeld = Boolean(keys.Space || keys.ArrowUp || keys.KeyW);
  if (!jumpHeld && player.vy < 0) {
    player.vy *= movementConfig.jumpCutMultiplier;
  }

  let nextX = player.x + player.vx * delta;
  let nextY = player.y + player.vy * delta;
  const brickRects = getBrickRects();
  const usedBlockRects = questionBlocks.filter((b) => b.used).map((b) => getBlockRect(b));

  player.onGround = false;

  // Horizontal collision
  for (const p of [...platforms, ...usedBlockRects, ...brickRects]) {
    if (nextY + player.h > p.y && nextY < p.y + p.h) {
      const feetY = nextY + player.h;
      const nearTopEdge = feetY >= p.y - 2 && feetY <= p.y + movementConfig.edgeSnapPixels;
      if (nearTopEdge) {
        // Do not snag on side edges; let vertical collision place player on top smoothly.
        continue;
      }

      if (player.x + player.w <= p.x && nextX + player.w >= p.x) {
        nextX = p.x - player.w;
        player.vx = 0;
      }
      if (player.x >= p.x + p.w && nextX <= p.x + p.w) {
        nextX = p.x + p.w;
        player.vx = 0;
      }
    }
  }

  player.x = nextX;

  // Vertical collision
  for (const p of [...platforms, ...usedBlockRects, ...brickRects]) {
    if (player.x + player.w > p.x && player.x < p.x + p.w) {
      if (player.y + player.h <= p.y && nextY + player.h >= p.y) {
        nextY = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
      if (player.y >= p.y + p.h && nextY <= p.y + p.h) {
        nextY = p.y + p.h;
        player.vy = 0;
      }
    }
  }

  nextY = handleQuestionBlockHits(nextY);

  player.y = nextY;

  if (player.y + player.h >= world.floorY) {
    player.y = world.floorY - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  player.x = Math.max(0, Math.min(player.x, world.width - player.w));

  cameraX = Math.max(0, Math.min(player.x - canvas.width * 0.35, world.width - canvas.width));

  updateSpawnedHearts(delta);
  collectHearts();
  checkSpecialEvent();
  checkWin();
}

function collectHearts() {
  for (const h of hearts) {
    if (h.taken || !h.active) continue;

    const cx = h.x;
    const cy = h.y;
    const nearestX = Math.max(player.x, Math.min(cx, player.x + player.w));
    const nearestY = Math.max(player.y, Math.min(cy, player.y + player.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;

    if (dx * dx + dy * dy < h.r * h.r) {
      h.taken = true;
      score += 1;
      hudHearts.textContent = `CORAZONES:${score}`;
      playTone(520, 0.1, "sine");
    }
  }
}

function checkSpecialEvent() {
  const bouquetZone = player.x + player.w > bouquet.x && player.x < bouquet.x + 90 && player.y + player.h > bouquet.y;
  if (!bouquet.triggered && bouquetZone) {
    triggerBouquetEvent();
  }
}

function checkWin() {
  if (gameWon || goalPromptShown) return;
  if (score < HEART_GOAL) return;

  goalPromptShown = true;
  pausedByEvent = true;
  playTone(740, 0.22, "triangle");
  showHeartModal();
}

function showHeartModal() {
  heartModal.classList.remove("hidden");
}

function hideHeartModal() {
  heartModal.classList.add("hidden");
}

function handleHeartModalResponse(wantsToContinue) {
  appState.messageFinal = wantsToContinue
    ? "Sii, me encanta seguir hablando contigo ❤️"
    : "Esta bien, aqui estare para hablar contigo ❤️";

  gameWon = true;
  hideHeartModal();
  setTimeout(endGame, 350);
}

function drawCloud(x, y, scale = 1, twinkle = 1) {
  const px = Math.round(x);
  const py = Math.round(y);
  const s = Math.max(2, Math.round(3.4 * scale));

  ctx.save();
  ctx.translate(px, py);
  ctx.globalAlpha = 0.9 + twinkle * 0.1;

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(14 * s, 16 * s, 10 * s, Math.PI, 0);
  ctx.arc(27 * s, 11 * s, 12 * s, Math.PI, 0);
  ctx.arc(40 * s, 16 * s, 10 * s, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e9f2ff";
  ctx.fillRect(8 * s, 16 * s, 38 * s, 7 * s);

  ctx.strokeStyle = "#87a3c7";
  ctx.lineWidth = Math.max(1, Math.round(1.2 * scale));
  ctx.beginPath();
  ctx.arc(14 * s, 16 * s, 10 * s, Math.PI, 0);
  ctx.arc(27 * s, 11 * s, 12 * s, Math.PI, 0);
  ctx.arc(40 * s, 16 * s, 10 * s, Math.PI, 0);
  ctx.lineTo(46 * s, 23 * s);
  ctx.lineTo(8 * s, 23 * s);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawBush(x, floorLineY, scale = 1, sway = 0) {
  const s = Math.max(2, Math.round(4 * scale));
  const width = 14 * s;
  const height = 7 * s;
  const y = Math.round(floorLineY - height);
  const swayPx = Math.round(sway * s * 0.8);

  ctx.fillStyle = "#54b745";
  ctx.fillRect(x, y + 4 * s, width, 3 * s);
  ctx.fillRect(x + s + swayPx, y + 2 * s, width - 2 * s, 3 * s);
  ctx.fillRect(x + 3 * s + swayPx * 2, y, width - 6 * s, 3 * s);

  ctx.fillStyle = "#76d55f";
  ctx.fillRect(x + s + swayPx, y + 5 * s, 3 * s, s);
  ctx.fillRect(x + 7 * s + swayPx, y + 5 * s, 4 * s, s);

  ctx.strokeStyle = "#3f9a35";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 4 * s + 0.5, width - 1, 3 * s - 1);
}

function drawPlatform(p, t = 0) {
  const x = p.x - cameraX;
  const brickW = 20;
  const brickH = 14;
  const rows = Math.max(1, Math.floor(p.h / brickH));
  const shineX = ((t * 95 + p.x * 0.08) % (p.w + 36)) - 18;

  for (let row = 0; row < rows; row += 1) {
    for (let cx = 0; cx < p.w; cx += brickW) {
      const bx = x + cx;
      const by = p.y + row * brickH;
      ctx.fillStyle = row % 2 ? "#c86531" : "#b7572c";
      ctx.fillRect(bx, by, brickW - 1, brickH - 1);
      ctx.strokeStyle = "#6b2f16";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 0.5, by + 0.5, brickW - 2, brickH - 2);
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, p.y, p.w, p.h);
  ctx.clip();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = "#fff2c5";
  ctx.fillRect(x + shineX, p.y, 9, p.h);
  ctx.restore();
}

function drawQuestionBlock(block, t = 0) {
  const rect = getBlockRect(block);
  const bx = rect.x - cameraX;
  const by = rect.y;

  if (block.used) {
    const usedGradient = ctx.createLinearGradient(bx, by, bx, by + rect.h);
    usedGradient.addColorStop(0, "#cf915f");
    usedGradient.addColorStop(1, "#9f623a");
    ctx.fillStyle = usedGradient;
    ctx.fillRect(bx, by, rect.w, rect.h);
    ctx.strokeStyle = "#754021";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 1, by + 1, rect.w - 2, rect.h - 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(bx + 4, by + 6, rect.w - 8, 4);
    return;
  }

  const pulse = (Math.sin(t * 5 + block.x * 0.02) + 1) * 0.5;
  const mainGradient = ctx.createLinearGradient(bx, by, bx, by + rect.h);
  mainGradient.addColorStop(0, `rgb(${246 + Math.round(pulse * 8)}, ${198 + Math.round(pulse * 16)}, 80)`);
  mainGradient.addColorStop(1, "#e39a21");
  ctx.fillStyle = mainGradient;
  ctx.fillRect(bx, by, rect.w, rect.h);

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(bx + 3, by + 3, rect.w - 6, rect.h * 0.28);

  ctx.strokeStyle = "#8e5a12";
  ctx.lineWidth = 3;
  ctx.strokeRect(bx + 1.5, by + 1.5, rect.w - 3, rect.h - 3);

  ctx.strokeStyle = "rgba(255, 238, 180, 0.65)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 5.5, by + 5.5, rect.w - 11, rect.h - 11);

  const shineX = ((t * 90 + block.x * 0.3) % (rect.w + 18)) - 9;
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, by, rect.w, rect.h);
  ctx.clip();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(bx + shineX, by - 4, 8, rect.h + 8);
  ctx.restore();

  ctx.fillStyle = "#8e5a12";
  ctx.font = "bold 19px 'Press Start 2P'";
  ctx.fillText("?", bx + 10, by + 25 + Math.sin(t * 8 + block.x * 0.06) * 1.4);
}

function drawBrickBlock(x, y, count = 3, t = 0) {
  const bx = x - cameraX;
  const shineX = ((t * 110 + x * 0.12) % (count * 38 + 26)) - 13;

  for (let i = 0; i < count; i += 1) {
    const px = bx + i * 38;
    ctx.fillStyle = "#a5552e";
    ctx.fillRect(px, y, 38, 38);
    ctx.strokeStyle = "#5a2812";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 1, y + 1, 36, 36);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(px + 4, y + 7, 30, 4);
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, y, count * 38, 38);
  ctx.clip();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffe8ba";
  ctx.fillRect(bx + shineX, y, 8, 38);
  ctx.restore();
}

function drawHeart(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(0, -3, -12, -5, -12, 5);
  ctx.bezierCurveTo(-12, 13, 0, 16, 0, 24);
  ctx.bezierCurveTo(0, 16, 12, 13, 12, 5);
  ctx.bezierCurveTo(12, -5, 0, -3, 0, 5);
  ctx.fill();
  ctx.restore();
}

function drawBouquet(t) {
  const x = bouquet.x - cameraX;
  const y = bouquet.y + Math.sin(t * 2) * 4;
  const scale = 0.115 + Math.sin(t * 3.4) * 0.006;
  const sway = Math.sin(t * 1.8) * 0.06;
  const glow = 32 + Math.sin(t * 4.2) * 4;

  ctx.save();
  ctx.fillStyle = "rgba(255, 170, 195, 0.24)";
  ctx.beginPath();
  ctx.ellipse(x + 36, y + 44, glow, glow * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (bouquetImage.complete && bouquetImage.naturalWidth > 0) {
    ctx.translate(x + 36, y + 44);
    ctx.rotate(sway);
    ctx.scale(scale, scale);
    ctx.drawImage(
      bouquetImage,
      -bouquetImage.naturalWidth / 2,
      -bouquetImage.naturalHeight * 0.88
    );
  }

  ctx.restore();
}

function drawPixelSprite(px, py, sprite, palette, scale = 2) {
  for (let row = 0; row < sprite.length; row += 1) {
    for (let col = 0; col < sprite[row].length; col += 1) {
      const token = sprite[row][col];
      if (token === ".") continue;
      ctx.fillStyle = palette[token];
      ctx.fillRect(px + col * scale, py + row * scale, scale, scale);
    }
  }
}

function drawPlayer() {
  const x = Math.round(player.x - cameraX);
  const selectedSprite = processedCharacterSprites[appState.character];
  if (selectedSprite && selectedSprite.canvas) {
    const cfg = characterRenderConfig[appState.character] || characterRenderConfig.snoopy;
    const drawWidth = cfg.width;
    const drawHeight = cfg.height;
    const drawX = x - Math.round((drawWidth - player.w) * 0.5);
    const drawY = Math.round(player.y + player.h - drawHeight + cfg.yOffset);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(selectedSprite.canvas, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
    return;
  }

  const y = Math.round(player.y + 8);

  const sprites = {
    snoopy: {
      palette: { W: "#fff", B: "#111", R: "#d3324d" },
      data: [
        "....WWW.....",
        "...WWWWW....",
        "..WWBWWWW...",
        "..WWWWWWW...",
        "...WWWW.....",
        "....WW......",
        "...WWWW.....",
        "..WWWWWW....",
        "..WWWWWW....",
        "..WWRRWW....",
        "...WRRW.....",
        "...W..W....."
      ]
    },
    "hello-kitty": {
      palette: { W: "#fff", B: "#111", P: "#ff4f78", D: "#304aa6" },
      data: [
        "....WWWWW....",
        "...WWWWWWW...",
        "..WWWWWWWWW..",
        "..WWBWWBWWW..",
        "..WWWWWWWWW..",
        "...WWWWWWW...",
        "....WWWWW....",
        ".....PPP.....",
        "....DDDDD....",
        "...DDDDDDD...",
        "...DDDDDDD...",
        "....D...D...."
      ]
    },
    "spider-man": {
      palette: { R: "#cf2738", B: "#2042a8", S: "#f2d9d9", K: "#111" },
      data: [
        "....RRRRR....",
        "...RRRRRRR...",
        "..RRKRRRKRR..",
        "..RRRRRRRRR..",
        "...RRRRRRR...",
        "....RSSSR....",
        "....BBBBB....",
        "...BBBBBBB...",
        "...BBRRRBB...",
        "...BBRRRBB...",
        "....B...B....",
        "....B...B...."
      ]
    }
  };

  const selected = sprites[appState.character] || sprites.snoopy;
  drawPixelSprite(x, y, selected.data, selected.palette, 2.4);
}

function drawGroundBricks() {
  const baseY = world.floorY;
  const tileW = 40;
  const tileH = 30;
  const rows = 2;
  const startX = Math.floor(cameraX / tileW) * tileW - tileW;
  const endX = cameraX + canvas.width + tileW * 2;

  for (let row = 0; row < rows; row += 1) {
    const rowY = baseY + row * tileH;
    // Alternate offsets between rows to mimic classic Mario ground pattern.
    const offset = row % 2 === 0 ? 0 : tileW * 0.5;

    for (let wx = startX - offset; wx < endX; wx += tileW) {
      const sx = Math.round(wx - cameraX);
      ctx.fillStyle = "#b85e33";
      ctx.fillRect(sx, rowY, tileW, tileH);

      ctx.strokeStyle = "#6f2f14";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, rowY + 1, tileW - 2, tileH - 2);

      ctx.fillStyle = "#d27a47";
      ctx.fillRect(sx + 4, rowY + 5, tileW - 8, 5);

      ctx.fillStyle = "#8f4525";
      ctx.fillRect(sx + 4, rowY + tileH - 9, tileW - 8, 5);
    }
  }

  const wave = (Math.sin(performance.now() * 0.0025) + 1) * 0.5;
  ctx.fillStyle = `rgba(255, 221, 167, ${0.07 + wave * 0.07})`;
  ctx.fillRect(0, baseY + 4, canvas.width, 6);
}

function render(t) {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#78b5ff");
  sky.addColorStop(1, "#d8ecff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cloudBands = [
    { base: 80, y: 64, scale: 1, drift: 18, parallax: 0.14, bob: 2.5 },
    { base: 330, y: 88, scale: 0.85, drift: 14, parallax: 0.1, bob: 1.7 },
    { base: 620, y: 72, scale: 1.1, drift: 22, parallax: 0.19, bob: 2.1 }
  ];

  const cloudSpan = canvas.width + 380;
  for (const cloud of cloudBands) {
    const driftPx = (t * cloud.drift) % cloudSpan;
    const baseX = cloud.base - driftPx - cameraX * cloud.parallax;
    const y = cloud.y + Math.sin(t * 1.6 + cloud.base * 0.02) * cloud.bob;
    const twinkle = (Math.sin(t * 2.8 + cloud.base * 0.05) + 1) * 0.5;

    // Draw twice with wrap so clouds move endlessly.
    drawCloud(baseX, y, cloud.scale, twinkle);
    drawCloud(baseX + cloudSpan, y, cloud.scale, twinkle);
  }

  const grassLineY = world.floorY - 8;
  drawBush(130 - cameraX * 0.42, grassLineY, 0.9, Math.sin(t * 2.1) * 0.35);
  drawBush(600 - cameraX * 0.42, grassLineY, 1.1, Math.sin(t * 1.7 + 1.4) * 0.32);
  drawBush(980 - cameraX * 0.42, grassLineY, 0.8, Math.sin(t * 2.4 + 2.1) * 0.3);

  for (const p of platforms) {
    drawPlatform(p, t);
  }

  for (const group of brickDecorations) {
    drawBrickBlock(group.x, group.y, group.count, t);
  }

  for (const block of questionBlocks) {
    drawQuestionBlock(block, t);
  }

  for (const h of hearts) {
    if (h.taken) continue;
    const pulse = 10 + Math.sin(t * 5 + h.x * 0.01) * 2;
    drawHeart(h.x - cameraX, h.y, pulse, "#de2a42");
  }

  drawBouquet(t);
  drawGroundBricks();

  ctx.fillStyle = "#6bb65a";
  ctx.fillRect(0, grassLineY, canvas.width, 8);

  drawPlayer();
}

function preloadCharacterImages() {
  for (const key of Object.keys(characterImages)) {
    characterImages[key].addEventListener("load", () => {
      const transparent = buildTransparentSprite(characterImages[key]);
      processedCharacterSprites[key] = {
        canvas: trimTransparentBounds(transparent, 2)
      };
    });
    characterImages[key].src = characterImagePaths[key];
  }
}

function trimTransparentBounds(sourceCanvas, padding = 0) {
  const srcCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const data = srcCtx.getImageData(0, 0, w, h).data;

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;

  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      const a = data[(yy * w + xx) * 4 + 3];
      if (a <= 12) continue;
      if (xx < minX) minX = xx;
      if (yy < minY) minY = yy;
      if (xx > maxX) maxX = xx;
      if (yy > maxY) maxY = yy;
    }
  }

  if (maxX < 0 || maxY < 0) return sourceCanvas;

  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(w - 1, maxX + padding);
  maxY = Math.min(h - 1, maxY + padding);

  const out = document.createElement("canvas");
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  const outCtx = out.getContext("2d");
  outCtx.drawImage(sourceCanvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out;
}

function buildTransparentSprite(image) {
  const offscreen = document.createElement("canvas");
  offscreen.width = image.naturalWidth;
  offscreen.height = image.naturalHeight;
  const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
  offCtx.drawImage(image, 0, 0);

  const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imageData.data;
  const w = offscreen.width;
  const h = offscreen.height;
  const visited = new Uint8Array(w * h);
  const queue = [];

  const startPoints = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1]
  ];

  for (const [sx, sy] of startPoints) {
    const idx = (sy * w + sx) * 4;
    const seed = [data[idx], data[idx + 1], data[idx + 2]];
    queue.push([sx, sy, seed[0], seed[1], seed[2]]);
  }

  const colorDistance = (r1, g1, b1, r2, g2, b2) =>
    Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

  while (queue.length > 0) {
    const [xx, yy, sr, sg, sb] = queue.shift();
    if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;

    const p = yy * w + xx;
    if (visited[p]) continue;
    visited[p] = 1;

    const i = p * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 8) continue;

    const isNearSeed = colorDistance(r, g, b, sr, sg, sb) <= 90;
    const isLightNeutral = r > 170 && g > 170 && b > 170 && Math.max(r, g, b) - Math.min(r, g, b) < 35;

    if (!(isNearSeed && isLightNeutral)) continue;

    data[i + 3] = 0;

    queue.push([xx + 1, yy, sr, sg, sb]);
    queue.push([xx - 1, yy, sr, sg, sb]);
    queue.push([xx, yy + 1, sr, sg, sb]);
    queue.push([xx, yy - 1, sr, sg, sb]);
  }

  offCtx.putImageData(imageData, 0, 0);
  return offscreen;
}

function spawnFloatingHearts(container, density = 18) {
  container.innerHTML = "";

  for (let i = 0; i < density; i += 1) {
    const span = document.createElement("span");
    span.className = "floating-heart";
    span.textContent = "❤";
    span.style.left = `${Math.random() * 100}%`;
    span.style.fontSize = `${14 + Math.random() * 28}px`;
    span.style.animationDuration = `${7 + Math.random() * 8}s`;
    span.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(span);
  }
}

function updateSoundButton() {
  if (!soundToggle) return;
  soundToggle.textContent = appState.soundEnabled ? "Sonido: ON" : "Sonido: OFF";
}

function playTone(freq, duration, type = "sine") {
  if (!appState.soundEnabled) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!playTone.ctx) playTone.ctx = new AudioCtx();
  const audioCtx = playTone.ctx;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration + 0.01);
}

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
  }

  keys[event.code] = true;

  if ((event.code === "ArrowUp" || event.code === "Space" || event.code === "KeyW") && gameRunning && !pausedByEvent) {
    jumpBufferTimer = movementConfig.jumpBufferFrames;
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

function bindTouchControl(button, code) {
  if (!button) return;

  if (!bindTouchControl.activePointers) {
    bindTouchControl.activePointers = new Map();
  }

  if (!bindTouchControl.activePointers.has(code)) {
    bindTouchControl.activePointers.set(code, new Set());
  }

  const pointerSet = bindTouchControl.activePointers.get(code);

  const down = (event) => {
    event.preventDefault();
    pointerSet.add(event.pointerId);
    button.setPointerCapture(event.pointerId);
    keys[code] = pointerSet.size > 0;

    if (code === "Space" && gameRunning && !pausedByEvent) {
      jumpBufferTimer = movementConfig.jumpBufferFrames;
    }
  };

  const up = (event) => {
    event.preventDefault();
    pointerSet.delete(event.pointerId);
    if (button.hasPointerCapture(event.pointerId)) {
      button.releasePointerCapture(event.pointerId);
    }
    keys[code] = pointerSet.size > 0;
  };

  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("lostpointercapture", up);
}

function updateInputMode() {
  const isDesktopLike =
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    navigator.maxTouchPoints === 0;

  document.body.classList.toggle("touch-device", !isDesktopLike);
}

function updateViewportHeightVar() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

nameInput.addEventListener("input", () => {
  const m = getPersonalizedMessages(nameInput.value);
  previewMessage.textContent = m.start;
  syncCustomFormWithName(nameInput.value);
  refreshMessageDbStatus(nameInput.value);
});

if (saveCustomMessageBtn) {
  saveCustomMessageBtn.addEventListener("click", () => {
    saveCustomMessage();
  });
}

if (soundToggle) {
  soundToggle.addEventListener("click", () => {
    appState.soundEnabled = !appState.soundEnabled;
    updateSoundButton();
    saveState();
  });
}

if (changeCharacterBtn) {
  changeCharacterBtn.addEventListener("click", () => {
    const order = ["snoopy", "hello-kitty", "spider-man"];
    const currentIndex = order.indexOf(appState.character);
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % order.length;
    appState.character = order[nextIndex];
    changeCharacterBtn.blur();
    saveState();
    playTone(560, 0.12, "triangle");
  });
}

continueBtn.addEventListener("click", () => {
  appState.playerName = nameInput.value.trim();

  const selected = document.querySelector('input[name="character"]:checked');
  appState.character = selected ? selected.value : "snoopy";

  const messages = getPersonalizedMessages(appState.playerName);
  appState.messageStart = messages.start;
  appState.messageFinal = messages.end;

  saveState();
  startGame();
});

restartBtn.addEventListener("click", () => {
  const messages = getPersonalizedMessages(appState.playerName);
  appState.messageStart = messages.start;
  appState.messageFinal = messages.end;
  startGame();
});

yesBtn.addEventListener("click", () => {
  handleHeartModalResponse(true);
});

noBtn.addEventListener("click", () => {
  handleHeartModalResponse(false);
});

async function init() {
  updateInputMode();
  updateViewportHeightVar();

  window.addEventListener("resize", () => {
    updateInputMode();
    updateViewportHeightVar();
  });

  window.addEventListener("orientationchange", () => {
    updateInputMode();
    updateViewportHeightVar();
  });

  preloadCharacterImages();
  await loadMessagesDb();
  loadState();
  setupFormFromState();

  bindTouchControl(leftBtn, "ArrowLeft");
  bindTouchControl(rightBtn, "ArrowRight");
  bindTouchControl(jumpBtn, "Space");

  const startHearts = document.getElementById("startHearts");
  const endHearts = document.getElementById("endHearts");
  spawnFloatingHearts(startHearts, 24);
  spawnFloatingHearts(endHearts, 30);

  setScreen("start");
}

init();
