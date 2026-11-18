export interface GlobalArcadeHubEntry {
  rank: number;
  deviceId: string;
  playerName: string;
  score: number;
  gamesPlayed?: number;
  avatarId?: number;
  updatedAt: string;
}

export interface GlobalArcadeHubResponse {
  ok: boolean;
  gameId: string;
  entries: GlobalArcadeHubEntry[];
  player: GlobalArcadeHubEntry | null;
}

export interface ArcadeScorePayload {
  deviceId: string;
  playerName: string;
  gameId: string;
  score: number;
  totalScore: number;
  gamesPlayed: number;
  avatarId: number;
}

const PENDING_SCORES_KEY = 'arcade_100_hub_pending_scores_v1';

function cleanUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

function loadPendingScores(): ArcadeScorePayload[] {
  try {
    const raw = localStorage.getItem(PENDING_SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePendingScores(queue: ArcadeScorePayload[]): void {
  try {
    if (queue.length === 0) localStorage.removeItem(PENDING_SCORES_KEY);
    else localStorage.setItem(PENDING_SCORES_KEY, JSON.stringify(queue.slice(-25)));
  } catch {
    // Ignore storage issues
  }
}

function enqueuePendingScore(payload: ArcadeScorePayload): void {
  const queue = loadPendingScores();
  const existingIdx = queue.findIndex((q) => q.gameId === payload.gameId);
  if (existingIdx >= 0) {
    if (payload.score >= queue[existingIdx].score) {
      queue[existingIdx] = payload;
    }
  } else {
    queue.push(payload);
  }
  savePendingScores(queue);
}

async function postScore(base: string, payload: ArcadeScorePayload): Promise<boolean> {
  const cleanScore = Number.isFinite(payload.score) ? Math.max(0, Math.floor(payload.score)) : 0;
  if (!base || cleanScore <= 0) return true;
  try {
    const res = await fetchWithTimeout(`${base}/api/arcade-hub/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: payload.deviceId,
        playerName: payload.playerName.trim() || 'ArcadePlayer',
        gameId: payload.gameId,
        score: cleanScore,
        totalScore: Number.isFinite(payload.totalScore) ? Math.max(0, Math.floor(payload.totalScore)) : 0,
        gamesPlayed: Number.isFinite(payload.gamesPlayed) ? Math.max(0, Math.floor(payload.gamesPlayed)) : 0,
        avatarId: Number.isFinite(payload.avatarId) ? Math.max(0, Math.floor(payload.avatarId)) : 0,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flushPendingArcadeHubScores(baseUrl: string): Promise<void> {
  const base = cleanUrl(baseUrl);
  if (!base) return;
  const queue = loadPendingScores();
  if (!queue.length) return;
  const remaining: ArcadeScorePayload[] = [];
  for (let i = 0; i < queue.length; i++) {
    const ok = await postScore(base, queue[i]);
    if (!ok) {
      remaining.push(...queue.slice(i));
      break;
    }
  }
  savePendingScores(remaining);
}

export async function fetchGlobalArcadeHubHighscores(
  baseUrl: string,
  gameId: string,
  deviceId: string,
  limit = 50
): Promise<GlobalArcadeHubResponse> {
  const base = cleanUrl(baseUrl);
  if (!base) throw new Error('NO_BACKEND_URL');
  await flushPendingArcadeHubScores(base);
  const res = await fetchWithTimeout(
    `${base}/api/arcade-hub/highscores?gameId=${encodeURIComponent(gameId)}&limit=${limit}&deviceId=${encodeURIComponent(deviceId)}`,
    { method: 'GET' }
  );
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return (await res.json()) as GlobalArcadeHubResponse;
}

export async function submitGlobalArcadeHubScore(
  baseUrl: string,
  payload: ArcadeScorePayload
): Promise<void> {
  const base = cleanUrl(baseUrl);
  const cleanScore = Number.isFinite(payload.score) ? Math.max(0, Math.floor(payload.score)) : 0;
  if (!base || cleanScore <= 0) return;

  const ok = await postScore(base, { ...payload, score: cleanScore });
  if (!ok) {
    enqueuePendingScore({ ...payload, score: cleanScore });
  } else {
    void flushPendingArcadeHubScores(base);
  }
}
