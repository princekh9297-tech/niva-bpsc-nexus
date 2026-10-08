const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

let cache = {};
let initialized = false;
let saveTimer = null;
let saveInProgress = false;
let dirty = false;

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "{}", "utf8");
}

function init() {
  if (initialized) return;
  ensureFile();

  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    cache = raw.trim() ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("NIVA storage load warning:", err.message);
    cache = {};
  }

  initialized = true;
}

function scheduleSave() {
  dirty = true;
  if (saveTimer) return;

  // Batch rapid group activity into one disk write.
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flush().catch(err => console.error("NIVA storage save warning:", err.message));
  }, 1500);
}

async function flush() {
  if (!dirty || saveInProgress) return;
  saveInProgress = true;

  try {
    ensureFile();
    const snapshot = JSON.stringify(cache, null, 2);
    const temp = `${DATA_FILE}.tmp`;
    await fs.promises.writeFile(temp, snapshot, "utf8");
    await fs.promises.rename(temp, DATA_FILE);
    dirty = false;
  } finally {
    saveInProgress = false;
  }
}

function getUser(userId, defaults = {}) {
  init();
  const key = String(userId);

  if (!cache[key]) {
    cache[key] = {
      userId: key,
      name: defaults.name || "yaar",
      nickname: "",
      preferredTone: "auto",
      roastTolerance: "normal",
      flirtTolerance: "normal",
      interactions: 0,
      recentTopics: [],
      recentReplies: [],
      usedResponseIds: [],
      lastTone: "normal",
      lastIntent: "chat"
    };
    scheduleSave();
  }

  return cache[key];
}

function updateUser(userId, patch = {}) {
  init();
  const key = String(userId);

  cache[key] = {
    ...(cache[key] || { userId: key }),
    ...patch
  };

  scheduleSave();
  return cache[key];
}

async function flushNow() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  await flush();
}

init();

module.exports = {
  getUser,
  updateUser,
  flushNow
};
