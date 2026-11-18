import './style.css';
import {
  fetchGlobalArcadeHubHighscores,
  flushPendingArcadeHubScores,
  GlobalArcadeHubEntry,
  submitGlobalArcadeHubScore,
} from './api/highscores';
import { SoundFX } from './game/SoundFX';
import { ALL_GAMES } from './games/registry';
import {
  ArcadeHubState,
  AVATARS,
  computeTotalArcadeScore,
  loadArcadeHubState,
  recordGameScore,
  resolveDeviceId,
  saveArcadeHubState,
} from './storage/state';
import {
  CATEGORIES,
  CategoryId,
  H,
  InputState,
  MiniGameDef,
  MiniGameInstance,
  MiniGameRuntime,
  W,
} from './types';

type ScreenId = 'hub' | 'play' | 'highscores' | 'options';
type HsTab = 'global' | 'local';

let appState: ArcadeHubState;
const sfx = new SoundFX();

let activeCat: CategoryId = 'all';
let searchTerm = '';
let hsTab: HsTab = 'global';
let hsGameId = 'overall';
let currentScreen: ScreenId = 'hub';
let hsRequestSeq = 0;

let currentGame: MiniGameDef | null = null;
let currentInstance: MiniGameInstance | null = null;
let currentRt: MiniGameRuntime | null = null;
let rafId: number | null = null;
let lastTs = 0;
let liveScore = 0;
let liveStatus = '';
let gameEnded = false;
let activePointerId: number | null = null;
let currentDpr = 1;
let hitFlashTimer: number | null = null;

const input: InputState = {
  down: false,
  justPressed: false,
  justReleased: false,
  x: W / 2,
  y: H / 2,
  dx: 0,
  dy: 0,
  startX: W / 2,
  startY: H / 2,
  swipe: null,
};

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeScore(val: number): number {
  return Number.isFinite(val) ? Math.max(0, Math.floor(val)) : 0;
}

function resetInputState(): void {
  activePointerId = null;
  input.down = false;
  input.justPressed = false;
  input.justReleased = false;
  input.dx = 0;
  input.dy = 0;
  input.swipe = null;
}

const root = document.getElementById('app') as HTMLElement;

root.innerHTML = `
  <section id="screen-hub" class="screen">
    <div class="hub-header">
      <div class="hub-brand">
        <div id="hub-avatar" class="hub-logo">👾</div>
        <div>
          <h1 class="hub-title">Arcade 100+ Hub</h1>
          <div id="hub-summary" class="hub-sub">100 Games · Total: 0 pt</div>
        </div>
      </div>
      <div class="icon-actions">
        <button id="btn-random" class="btn-icon" title="Random">🎲</button>
        <button id="btn-hs" class="btn-icon" title="Leaderboard">🏆</button>
        <button id="btn-opt" class="btn-icon" title="Profile">⚙️</button>
      </div>
    </div>

    <div class="search-row">
      <input id="inp-search" class="search-input" type="search" placeholder="Search games..." />
    </div>

    <div id="cat-strip" class="cat-strip"></div>
    <div id="games-grid" class="games-grid"></div>
  </section>

  <section id="screen-play" class="screen play-screen hidden">
    <div class="play-top">
      <button id="btn-back-hub" class="btn-small">← Hub</button>
      <div class="play-meta">
        <div id="play-title" class="play-name">Game</div>
        <div id="play-score" class="play-score">0 pt</div>
      </div>
      <div style="display:flex;gap:6px;">
        <button id="btn-play-sound" class="btn-small">🔊</button>
        <button id="btn-play-restart" class="btn-small">↻</button>
      </div>
    </div>

    <div class="canvas-stage">
      <canvas id="arcade-canvas" class="arcade-canvas" width="${W}" height="${H}"></canvas>
      <div id="play-gameover" class="gameover-card hidden">
        <h2 id="go-title" style="margin:0;color:#fde047;">Game Over</h2>
        <div id="go-summary" style="font-size:0.9rem;color:#cbd5e1;"></div>
        <div id="go-best" style="font-size:0.9rem;font-weight:800;color:#22c55e;"></div>
        <button id="btn-go-replay" class="btn btn-primary">🔄 Play Again</button>
        <button id="btn-go-hs" class="btn btn-secondary">🏆 Leaderboard</button>
        <button id="btn-go-hub" class="btn btn-secondary">🏠 Back to Hub</button>
      </div>
    </div>

    <div class="play-footer">
      <div id="play-status" class="play-status">Ready!</div>
      <div id="play-hint"></div>
    </div>
  </section>

  <section id="screen-highscores" class="screen hidden">
    <div class="top-nav">
      <button id="btn-hs-back" class="btn-small">← Back</button>
      <h2 id="hs-heading" class="screen-heading">🏆 Leaderboard</h2>
      <button id="btn-hs-refresh" class="btn-small">↻</button>
    </div>
    <div class="hs-tabs">
      <button id="tab-global" class="hs-tab active">🌍 Global</button>
      <button id="tab-local" class="hs-tab">📱 My Records</button>
    </div>
    <div class="hs-controls">
      <select id="sel-hs-game" class="select-input"></select>
      <div id="hs-status-banner" class="hs-status-pill">Offline Mode — Local Highscores</div>
      <div id="dev-server-row" class="dev-server-row hidden">
        <input id="inp-api-url" class="name-input" type="url" placeholder="https://api.example.com" />
        <button id="btn-save-url" class="btn-small">Save</button>
      </div>
    </div>
    <div id="hs-list" class="hs-list"></div>
  </section>

  <section id="screen-options" class="screen hidden">
    <div class="top-nav">
      <button id="btn-opt-back" class="btn-small">← Back</button>
      <h2 class="screen-heading">⚙️ Profile</h2>
      <span style="width:52px;"></span>
    </div>
    <div class="options-scroll">
      <div>
        <label class="section-label">Player Name</label>
        <input id="inp-player-name" class="name-input" type="text" maxlength="20" placeholder="ArcadePlayer" />
      </div>
      <div>
        <label class="section-label">Choose Avatar</label>
        <div id="avatar-grid" class="avatar-grid"></div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface);padding:12px 14px;border-radius:14px;border:1px solid var(--border);">
        <span style="font-weight:800;">🔊 Sound Effects</span>
        <button id="btn-opt-sound" class="btn-small">On</button>
      </div>
    </div>
  </section>
`;

function syncCanvasDpr(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): number {
  const rawDpr = window.devicePixelRatio || 1;
  const dpr = Number.isFinite(rawDpr) && rawDpr > 0 ? Math.min(rawDpr, 3) : 1;
  const targetW = Math.max(1, Math.round(W * dpr));
  const targetH = Math.max(1, Math.round(H * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  currentDpr = dpr;
  return dpr;
}

function showScreen(id: ScreenId): void {
  currentScreen = id;
  (['hub', 'play', 'highscores', 'options'] as ScreenId[]).forEach((s) => {
    document.getElementById(`screen-${s}`)?.classList.toggle('hidden', s !== id);
  });
  if (id !== 'play') stopGameLoop();
  if (id === 'hub') renderHub();
  if (id === 'highscores') renderHighscores();
  if (id === 'options') renderOptions();
}

function stopGameLoop(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (hitFlashTimer !== null) {
    window.clearTimeout(hitFlashTimer);
    hitFlashTimer = null;
  }
  document.getElementById('arcade-canvas')?.classList.remove('flash-hit');
  resetInputState();
  if (currentInstance?.destroy) {
    try {
      currentInstance.destroy();
    } catch {
      // Ignore cleanup errors from individual games
    }
  }
  currentInstance = null;
  currentRt = null;
}

function renderCategories(): void {
  const strip = document.getElementById('cat-strip');
  if (!strip) return;
  const chips: { id: CategoryId; label: string }[] = [
    { id: 'all', label: `🎮 All (${ALL_GAMES.length})` },
    { id: 'favorites', label: `⭐ Favorites (${appState.favorites.length})` },
    ...CATEGORIES.map((c) => ({ id: c.id as CategoryId, label: `${c.icon} ${c.label}` })),
  ];
  strip.innerHTML = chips
    .map((c) => `<button class="cat-chip ${activeCat === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</button>`)
    .join('');
  strip.querySelectorAll<HTMLButtonElement>('[data-cat]').forEach((btn) => {
    btn.onclick = () => {
      activeCat = btn.dataset.cat as CategoryId;
      renderHub();
    };
  });
}

function renderHub(): void {
  const av = document.getElementById('hub-avatar');
  if (av) av.textContent = AVATARS[appState.avatarId % AVATARS.length];
  const { totalScore, gamesPlayed } = computeTotalArcadeScore(appState);
  const sum = document.getElementById('hub-summary');
  if (sum) sum.textContent = `${ALL_GAMES.length} Games · ${gamesPlayed} played · ${totalScore} pt`;

  renderCategories();
  const grid = document.getElementById('games-grid');
  if (!grid) return;

  const q = searchTerm.trim().toLowerCase();
  const filtered = ALL_GAMES.filter((g) => {
    if (activeCat === 'favorites' && !appState.favorites.includes(g.id)) return false;
    if (activeCat !== 'all' && activeCat !== 'favorites' && g.category !== activeCat) return false;
    if (q) {
      return (
        g.title.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q) ||
        String(g.num).includes(q)
      );
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:30px;color:#94a3b8;">No games match your search.</div>`;
    return;
  }

  grid.innerHTML = filtered
    .map((g) => {
      const best = appState.bestScores[g.id] || 0;
      const fav = appState.favorites.includes(g.id);
      return `
      <div class="game-card" data-launch="${g.id}" style="border-top:3px solid ${g.color};">
        <div class="card-top">
          <span class="card-num">#${g.num}</span>
          <button class="fav-btn" data-fav="${g.id}" title="Favorite">${fav ? '★' : '☆'}</button>
        </div>
        <div class="card-icon">${g.icon}</div>
        <div class="card-title">${escapeHtml(g.title)}</div>
        <div class="card-desc">${escapeHtml(g.desc)}</div>
        <div class="card-best">${best > 0 ? `🏆 Best: ${best} pt` : '▶ Tap to play'}</div>
      </div>`;
    })
    .join('');

  grid.querySelectorAll<HTMLButtonElement>('[data-fav]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const gid = btn.dataset.fav || '';
      if (appState.favorites.includes(gid)) {
        appState.favorites = appState.favorites.filter((id) => id !== gid);
      } else {
        appState.favorites.push(gid);
      }
      saveArcadeHubState(appState);
      renderHub();
    };
  });

  grid.querySelectorAll<HTMLElement>('[data-launch]').forEach((card) => {
    card.onclick = () => {
      const g = ALL_GAMES.find((x) => x.id === card.dataset.launch);
      if (g) launchGame(g);
    };
  });
}

function syncSoundButton(): void {
  const btn = document.getElementById('btn-play-sound');
  if (btn) btn.textContent = appState.soundEnabled ? '🔊' : '🔇';
}

function pulseScoreHud(): void {
  const el = document.getElementById('play-score');
  if (!el) return;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

function triggerCabinetHitFlash(): void {
  const canvas = document.getElementById('arcade-canvas');
  if (!canvas) return;
  canvas.classList.add('flash-hit');
  if (hitFlashTimer !== null) window.clearTimeout(hitFlashTimer);
  hitFlashTimer = window.setTimeout(() => {
    canvas.classList.remove('flash-hit');
    hitFlashTimer = null;
  }, 160);
}

function launchGame(game: MiniGameDef): void {
  stopGameLoop();
  currentGame = game;
  liveScore = 0;
  liveStatus = 'Play!';
  gameEnded = false;

  document.documentElement.style.setProperty('--game-accent', game.color || '#38bdf8');

  showScreen('play');
  syncSoundButton();
  document.getElementById('play-gameover')?.classList.add('hidden');
  const titleEl = document.getElementById('play-title');
  const scoreEl = document.getElementById('play-score');
  const hintEl = document.getElementById('play-hint');
  const statusEl = document.getElementById('play-status');
  if (titleEl) titleEl.textContent = `${game.icon} ${game.title}`;
  if (scoreEl) scoreEl.textContent = '0 pt';
  if (hintEl) hintEl.textContent = game.controlsHint;
  if (statusEl) statusEl.textContent = 'Good luck!';

  const canvas = document.getElementById('arcade-canvas') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  syncCanvasDpr(canvas, ctx);

  const rt: MiniGameRuntime = {
    ctx,
    width: W,
    height: H,
    sfx: {
      tap: () => sfx.tap(),
      score: () => sfx.score(),
      hit: () => {
        sfx.hit();
        triggerCabinetHitFlash();
      },
      explode: () => {
        sfx.explode();
        triggerCabinetHitFlash();
      },
      win: () => sfx.win(),
    },
    setScore(s: number) {
      const clean = sanitizeScore(s);
      const changed = clean > liveScore;
      liveScore = clean;
      const el = document.getElementById('play-score');
      if (el) el.textContent = `${liveScore} pt`;
      if (changed) pulseScoreHud();
    },
    setStatus(text: string) {
      if (text !== liveStatus) {
        liveStatus = text;
        const el = document.getElementById('play-status');
        if (el) el.textContent = text;
      }
    },
    endGame(finalScore: number, summary?: string) {
      if (gameEnded) return;
      gameEnded = true;
      resetInputState();
      const cleanScore = sanitizeScore(finalScore);
      liveScore = cleanScore;
      const scoreElNow = document.getElementById('play-score');
      if (scoreElNow) scoreElNow.textContent = `${cleanScore} pt`;

      const isNew = recordGameScore(appState, game.id, cleanScore);
      const { totalScore, gamesPlayed } = computeTotalArcadeScore(appState);

      if (appState.apiBaseUrl && cleanScore > 0) {
        void submitGlobalArcadeHubScore(appState.apiBaseUrl, {
          deviceId: appState.deviceId,
          playerName: appState.playerName,
          gameId: game.id,
          score: cleanScore,
          totalScore,
          gamesPlayed,
          avatarId: appState.avatarId,
        });
      }

      const goTitle = document.getElementById('go-title');
      const goSum = document.getElementById('go-summary');
      const goBest = document.getElementById('go-best');
      if (goTitle) goTitle.textContent = isNew ? '🎉 New High Score!' : '🏁 Game Over';
      if (goSum) goSum.textContent = summary || `Score: ${cleanScore} pt`;
      if (goBest) goBest.textContent = `Best in ${game.title}: ${appState.bestScores[game.id] || cleanScore} pt`;
      document.getElementById('play-gameover')?.classList.remove('hidden');
    },
  };

  currentRt = rt;
  currentInstance = game.create(rt);
  lastTs = performance.now();

  const frame = (ts: number) => {
    if (currentScreen !== 'play' || !currentInstance) {
      rafId = null;
      return;
    }
    const rawDt = (ts - lastTs) / 1000;
    const dt = Number.isFinite(rawDt) ? Math.min(0.05, Math.max(0.001, rawDt)) : 0.016;
    lastTs = ts;

    if (!gameEnded) {
      currentInstance.update(dt, input, rt);
      input.justPressed = false;
      input.justReleased = false;
      input.swipe = null;
      input.dx = 0;
      input.dy = 0;

      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
      currentInstance.render(rt);
    }

    if (gameEnded) {
      rafId = null;
      return;
    }
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
}

function attachCanvasInput(): void {
  const canvas = document.getElementById('arcade-canvas') as HTMLCanvasElement;
  const mapCoords = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const rw = rect.width > 0 ? rect.width : W;
    const rh = rect.height > 0 ? rect.height : H;
    return {
      x: Math.max(0, Math.min(W, ((e.clientX - rect.left) / rw) * W)),
      y: Math.max(0, Math.min(H, ((e.clientY - rect.top) / rh) * H)),
    };
  };

  canvas.addEventListener('pointerdown', (e) => {
    if (currentScreen !== 'play' || gameEnded) return;
    if (activePointerId !== null && activePointerId !== e.pointerId) return;
    activePointerId = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture unsupported
    }
    const p = mapCoords(e);
    input.down = true;
    input.justPressed = true;
    input.x = p.x;
    input.y = p.y;
    input.startX = p.x;
    input.startY = p.y;
    input.dx = 0;
    input.dy = 0;
    input.swipe = null;
  });

  window.addEventListener('pointermove', (e) => {
    if (!input.down || e.pointerId !== activePointerId) return;
    const p = mapCoords(e);
    input.dx = p.x - input.x;
    input.dy = p.y - input.y;
    input.x = p.x;
    input.y = p.y;
  });

  const handlePointerRelease = (e: PointerEvent, isCancel: boolean) => {
    if (!input.down || e.pointerId !== activePointerId) return;
    activePointerId = null;
    input.down = false;
    if (!isCancel) {
      const p = mapCoords(e);
      input.x = p.x;
      input.y = p.y;
      input.justReleased = true;
      const sdx = input.x - input.startX;
      const sdy = input.y - input.startY;
      if (Math.hypot(sdx, sdy) > 28) {
        if (Math.abs(sdx) > Math.abs(sdy)) {
          input.swipe = sdx > 0 ? 'right' : 'left';
        } else {
          input.swipe = sdy > 0 ? 'down' : 'up';
        }
      }
    }
  };

  window.addEventListener('pointerup', (e) => handlePointerRelease(e, false));
  window.addEventListener('pointercancel', (e) => handlePointerRelease(e, true));

  window.addEventListener('blur', () => {
    resetInputState();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resetInputState();
    } else {
      lastTs = performance.now();
    }
  });

  window.addEventListener('resize', () => {
    const ctx = canvas.getContext('2d');
    if (ctx) syncCanvasDpr(canvas, ctx);
  });

  window.addEventListener('keydown', (e) => {
    if (currentScreen !== 'play' || gameEnded || !currentInstance?.onKey || !currentRt) return;
    if (e.key.startsWith('Arrow') || e.key === ' ') {
      e.preventDefault();
    }
    currentInstance.onKey(e.key, currentRt);
  });
}

function populateHighscoreSelect(): void {
  const sel = document.getElementById('sel-hs-game') as HTMLSelectElement | null;
  if (!sel) return;
  const opts = [
    `<option value="overall">🏆 Overall Arcade Ranking (All 100 games)</option>`,
    ...ALL_GAMES.map((g) => `<option value="${g.id}">#${g.num} ${g.icon} ${escapeHtml(g.title)}</option>`),
  ];
  sel.innerHTML = opts.join('');
  sel.value = hsGameId;
}

async function renderHighscores(): Promise<void> {
  const reqId = ++hsRequestSeq;
  populateHighscoreSelect();
  const urlInp = document.getElementById('inp-api-url') as HTMLInputElement | null;
  if (urlInp) urlInp.value = appState.apiBaseUrl;
  const statusBanner = document.getElementById('hs-status-banner');
  if (statusBanner) {
    statusBanner.textContent = appState.apiBaseUrl
      ? '🌐 Online Leaderboard'
      : '📱 Offline Mode — Local Highscores';
  }
  document.getElementById('tab-global')?.classList.toggle('active', hsTab === 'global');
  document.getElementById('tab-local')?.classList.toggle('active', hsTab === 'local');

  const list = document.getElementById('hs-list');
  if (!list) return;

  if (hsTab === 'local') {
    const entries = ALL_GAMES.filter((g) => (appState.bestScores[g.id] || 0) > 0).sort(
      (a, b) => (appState.bestScores[b.id] || 0) - (appState.bestScores[a.id] || 0)
    );
    if (!entries.length) {
      list.innerHTML = `<div class="hs-row"><span class="hs-meta">No personal records yet. Play any of the 100 games!</span></div>`;
      return;
    }
    list.innerHTML = entries
      .map(
        (g, i) => `
      <div class="hs-row me">
        <div class="hs-left">
          <span class="hs-rank">#${i + 1}</span>
          <div>
            <div class="hs-name">${g.icon} ${escapeHtml(g.title)}</div>
            <div class="hs-meta">Played ${appState.playCounts[g.id] || 1}×</div>
          </div>
        </div>
        <span class="hs-score">${appState.bestScores[g.id]} pt</span>
      </div>`
      )
      .join('');
    return;
  }

  if (!appState.apiBaseUrl) {
    list.innerHTML = `<div class="hs-row"><span class="hs-meta">Offline Mode — Local Highscores. Switch to My Records to view your best scores.</span></div>`;
    return;
  }

  list.innerHTML = `<div class="hs-row"><span class="hs-meta">Loading online scores...</span></div>`;
  try {
    const res = await fetchGlobalArcadeHubHighscores(appState.apiBaseUrl, hsGameId, appState.deviceId);
    if (reqId !== hsRequestSeq || currentScreen !== 'highscores' || hsTab !== 'global') return;
    if (!res.entries.length) {
      list.innerHTML = `<div class="hs-row"><span class="hs-meta">No online scores for this game yet — be #1!</span></div>`;
      return;
    }
    list.innerHTML = res.entries
      .map((e: GlobalArcadeHubEntry) => {
        const isMe = e.deviceId === appState.deviceId;
        const av = typeof e.avatarId === 'number' ? AVATARS[Math.abs(Math.floor(e.avatarId)) % AVATARS.length] : '🎮';
        return `
        <div class="hs-row ${isMe ? 'me' : ''}">
          <div class="hs-left">
            <span class="hs-rank">#${e.rank}</span>
            <div>
              <div class="hs-name">${av} ${escapeHtml(e.playerName || 'ArcadePlayer')} ${isMe ? '(You)' : ''}</div>
              <div class="hs-meta">${e.gamesPlayed !== undefined ? `${e.gamesPlayed} games` : escapeHtml(hsGameId)}</div>
            </div>
          </div>
          <span class="hs-score">${sanitizeScore(e.score)} pt</span>
        </div>`;
      })
      .join('');
  } catch {
    if (reqId !== hsRequestSeq || currentScreen !== 'highscores' || hsTab !== 'global') return;
    if (statusBanner) statusBanner.textContent = '📱 Offline Mode — Local Highscores';
    list.innerHTML = `<div class="hs-row"><span class="hs-meta">Offline Mode — Local Highscores. Unable to reach online leaderboard.</span></div>`;
  }
}

function renderOptions(): void {
  const inp = document.getElementById('inp-player-name') as HTMLInputElement | null;
  if (inp) inp.value = appState.playerName;
  const grid = document.getElementById('avatar-grid');
  if (grid) {
    grid.innerHTML = AVATARS.map(
      (a, i) => `<button class="avatar-btn ${appState.avatarId === i ? 'selected' : ''}" data-av="${i}">${a}</button>`
    ).join('');
    grid.querySelectorAll<HTMLButtonElement>('[data-av]').forEach((btn) => {
      btn.onclick = () => {
        appState.avatarId = Number(btn.dataset.av) || 0;
        saveArcadeHubState(appState);
        renderOptions();
      };
    });
  }
  const snd = document.getElementById('btn-opt-sound');
  if (snd) snd.textContent = appState.soundEnabled ? 'On' : 'Off';
}

async function init(): Promise<void> {
  const deviceId = await resolveDeviceId();
  appState = loadArcadeHubState(deviceId);
  sfx.enabled = appState.soundEnabled;

  if (appState.apiBaseUrl) {
    void flushPendingArcadeHubScores(appState.apiBaseUrl);
  }

  attachCanvasInput();
  renderHub();

  document.getElementById('inp-search')?.addEventListener('input', (e) => {
    searchTerm = (e.target as HTMLInputElement).value;
    renderHub();
  });

  document.getElementById('btn-random')?.addEventListener('click', () => {
    const pick = ALL_GAMES[Math.floor(Math.random() * ALL_GAMES.length)];
    launchGame(pick);
  });

  document.getElementById('btn-hs')?.addEventListener('click', () => {
    hsGameId = 'overall';
    showScreen('highscores');
  });
  document.getElementById('btn-opt')?.addEventListener('click', () => showScreen('options'));
  document.getElementById('btn-back-hub')?.addEventListener('click', () => showScreen('hub'));
  document.getElementById('btn-hs-back')?.addEventListener('click', () => showScreen('hub'));
  document.getElementById('btn-opt-back')?.addEventListener('click', () => showScreen('hub'));
  document.getElementById('btn-hs-refresh')?.addEventListener('click', () => renderHighscores());

  let hsTapCount = 0;
  let hsTapTimer: number | null = null;
  document.getElementById('hs-heading')?.addEventListener('click', () => {
    hsTapCount++;
    if (hsTapTimer !== null) window.clearTimeout(hsTapTimer);
    hsTapTimer = window.setTimeout(() => {
      hsTapCount = 0;
    }, 1800);
    if (hsTapCount >= 5) {
      hsTapCount = 0;
      document.getElementById('dev-server-row')?.classList.toggle('hidden');
    }
  });

  document.getElementById('btn-play-restart')?.addEventListener('click', () => {
    if (currentGame) launchGame(currentGame);
  });
  document.getElementById('btn-go-replay')?.addEventListener('click', () => {
    if (currentGame) launchGame(currentGame);
  });
  document.getElementById('btn-go-hub')?.addEventListener('click', () => showScreen('hub'));
  document.getElementById('btn-go-hs')?.addEventListener('click', () => {
    if (currentGame) hsGameId = currentGame.id;
    showScreen('highscores');
  });

  document.getElementById('btn-play-sound')?.addEventListener('click', () => {
    appState.soundEnabled = !appState.soundEnabled;
    sfx.enabled = appState.soundEnabled;
    saveArcadeHubState(appState);
    syncSoundButton();
  });

  document.getElementById('tab-global')?.addEventListener('click', () => {
    hsTab = 'global';
    renderHighscores();
  });
  document.getElementById('tab-local')?.addEventListener('click', () => {
    hsTab = 'local';
    renderHighscores();
  });
  document.getElementById('sel-hs-game')?.addEventListener('change', (e) => {
    hsGameId = (e.target as HTMLSelectElement).value;
    renderHighscores();
  });
  document.getElementById('btn-save-url')?.addEventListener('click', () => {
    const inp = document.getElementById('inp-api-url') as HTMLInputElement | null;
    appState.apiBaseUrl = (inp?.value || '').trim().replace(/\/+$/, '');
    saveArcadeHubState(appState);
    renderHighscores();
  });

  document.getElementById('inp-player-name')?.addEventListener('input', (e) => {
    appState.playerName = (e.target as HTMLInputElement).value;
    saveArcadeHubState(appState);
  });
  document.getElementById('inp-player-name')?.addEventListener('blur', (e) => {
    const el = e.target as HTMLInputElement;
    const clean = el.value.trim() || 'ArcadePlayer';
    appState.playerName = clean;
    el.value = clean;
    saveArcadeHubState(appState);
  });
  document.getElementById('btn-opt-sound')?.addEventListener('click', () => {
    appState.soundEnabled = !appState.soundEnabled;
    sfx.enabled = appState.soundEnabled;
    saveArcadeHubState(appState);
    renderOptions();
    syncSoundButton();
  });
}

init();
