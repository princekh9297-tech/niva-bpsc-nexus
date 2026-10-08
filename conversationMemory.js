class ConversationMemory {
  constructor(limit = 12) {
    this.limit = limit;
    this.users = new Map();
  }

  get(userId, fallback = {}) {
    if (!this.users.has(String(userId))) {
      this.users.set(String(userId), {
        userId: String(userId),
        name: fallback.name || "yaar",
        nickname: "",
        tone: "normal",
        mood: "normal",
        interactions: 0,
        recent: [],
        usedResponseIds: []
      });
    }
    return this.users.get(String(userId));
  }

  update(userId, patch = {}) {
    const p = this.get(userId);
    Object.assign(p, patch);
    return p;
  }

  addTurn(userId, userText, nivaText) {
    const p = this.get(userId);
    p.interactions += 1;
    p.recent.push({
      at: Date.now(),
      user: String(userText).slice(0, 500),
      niva: String(nivaText).slice(0, 500)
    });
    if (p.recent.length > this.limit) p.recent.shift();
    return p;
  }

  markUsed(userId, ids, max = 60) {
    const p = this.get(userId);
    p.usedResponseIds.push(...ids);
    if (p.usedResponseIds.length > max) {
      p.usedResponseIds = p.usedResponseIds.slice(-max);
    }
  }
}

module.exports = { ConversationMemory };
