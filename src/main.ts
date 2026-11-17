import './style.css';
import {
  fetchGlobalArcadeHubHighscores,
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

let currentGame: MiniGameDef | null = null;
let currentInstance: MiniGameInstance | null = null;
let rafId: number | null = null;
let lastTs = 0;
let liveScore = 0;
let liveStatus = '';
let gameEnded = false;

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

function showScreen(id: ScreenId): void {
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
  if (currentInstance?.destroy) {
    currentInstance.destroy();
  }
  currentInstance = null;
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
        <div class="card-title">${g.title}</div>
        <div class="card-desc">${g.desc}</div>
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

function launchGame(game: MiniGameDef): void {
  stopGameLoop();
  currentGame = game;
  liveScore = 0;
  liveStatus = 'Play!';
  gameEnded = false;
  input.down = false;
  input.justPressed = false;
  input.justReleased = false;
  input.swipe = null;

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

  const canvas = document.getElementById('arcade-canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rt: MiniGameRuntime = {
    ctx,
    width: W,
    height: H,
    sfx: {
      tap: () => sfx.tap(),
      score: () => sfx.score(),
      hit: () => sfx.hit(),
      explode: () => sfx.explode(),
      win: () => sfx.win(),
    },
    setScore(s: number) {
      liveScore = Math.max(0, Math.floor(s));
      const el = document.getElementById('play-score');
      if (el) el.textContent = `${liveScore} pt`;
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
      const cleanScore = Math.max(0, Math.floor(finalScore));
      liveScore = cleanScore;
      const isNew = recordGameScore(appState, game.id, cleanScore);
      const { totalScore, gamesPlayed } = computeTotalArcadeScore(appState);

      if (appState.apiBaseUrl && cleanScore > 0) {
        submitGlobalArcadeHubScore(appState.apiBaseUrl, {
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

  currentInstance = game.create(rt);
  lastTs = performance.now();

  const frame = (ts: number) => {
    const dt = Math.min(0.035, Math.max(0.001, (ts - lastTs) / 1000));
    lastTs = ts;
    if (currentInstance && !gameEnded) {
      currentInstance.update(dt, input, rt);
      input.justPressed = false;
      input.justReleased = false;
      input.swipe = null;
      input.dx = 0;
      input.dy = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      currentInstance.render(rt);
    }
    rafId = requestAnimationFrame(frame);
  };
  rafId = requestAnimationFrame(frame);
}

function attachCanvasInput(): void {
  const canvas = document.getElementById('arcade-canvas') as HTMLCanvasElement;
  const mapCoords = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * W,
      y: ((e.clientY - rect.top) / Math.max(1, rect.height)) * H,
    };
  };

  canvas.addEventListener('pointerdown', (e) => {
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
    if (!input.down) return;
    const p = mapCoords(e);
    input.dx = p.x - input.x;
    input.dy = p.y - input.y;
    input.x = p.x;
    input.y = p.y;
  });

  window.addEventListener('pointerup', () => {
    if (!input.down) return;
    input.down = false;
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
  });

  window.addEventListener('keydown', (e) => {
    if (currentInstance?.onKey && currentGame) {
      currentInstance.onKey(e.key, {
        ctx: canvas.getContext('2d') as CanvasRenderingContext2D,
        width: W,
        height: H,
        sfx: {
          tap: () => sfx.tap(),
          score: () => sfx.score(),
          hit: () => sfx.hit(),
          explode: () => sfx.explode(),
          win: () => sfx.win(),
        },
        setScore: (s) => {
          liveScore = s;
        },
        setStatus: () => {},
        endGame: () => {},
      });
    }
  });
}

function populateHighscoreSelect(): void {
  const sel = document.getElementById('sel-hs-game') as HTMLSelectElement | null;
  if (!sel) return;
  const opts = [
    `<option value="overall">🏆 Overall Arcade Ranking (All 100 games)</option>`,
    ...ALL_GAMES.map((g) => `<option value="${g.id}">#${g.num} ${g.icon} ${g.title}</option>`),
  ];
  sel.innerHTML = opts.join('');
  sel.value = hsGameId;
}

async function renderHighscores(): Promise<void> {
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
            <div class="hs-name">${g.icon} ${g.title}</div>
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
    if (!res.entries.length) {
      list.innerHTML = `<div class="hs-row"><span class="hs-meta">No online scores for this game yet — be #1!</span></div>`;
      return;
    }
    list.innerHTML = res.entries
      .map((e: GlobalArcadeHubEntry) => {
        const isMe = e.deviceId === appState.deviceId;
        const av = typeof e.avatarId === 'number' ? AVATARS[e.avatarId % AVATARS.length] : '🎮';
        return `
        <div class="hs-row ${isMe ? 'me' : ''}">
          <div class="hs-left">
            <span class="hs-rank">#${e.rank}</span>
            <div>
              <div class="hs-name">${av} ${e.playerName} ${isMe ? '(You)' : ''}</div>
              <div class="hs-meta">${e.gamesPlayed !== undefined ? `${e.gamesPlayed} games` : hsGameId}</div>
            </div>
          </div>
          <span class="hs-score">${e.score} pt</span>
        </div>`;
      })
      .join('');
  } catch {
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
        appState.avatarId = Number(btn.dataset.av);
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
