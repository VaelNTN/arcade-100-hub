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

function cleanUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

export async function fetchGlobalArcadeHubHighscores(
  baseUrl: string,
  gameId: string,
  deviceId: string,
  limit = 50
): Promise<GlobalArcadeHubResponse> {
  const base = cleanUrl(baseUrl);
  if (!base) throw new Error('NO_BACKEND_URL');
  const res = await fetch(
    `${base}/api/arcade-hub/highscores?gameId=${encodeURIComponent(gameId)}&limit=${limit}&deviceId=${encodeURIComponent(deviceId)}`,
    { method: 'GET' }
  );
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return (await res.json()) as GlobalArcadeHubResponse;
}

export async function submitGlobalArcadeHubScore(
  baseUrl: string,
  payload: {
    deviceId: string;
    playerName: string;
    gameId: string;
    score: number;
    totalScore: number;
    gamesPlayed: number;
    avatarId: number;
  }
): Promise<void> {
  const base = cleanUrl(baseUrl);
  if (!base || payload.score <= 0) return;

  try {
    await fetch(`${base}/api/arcade-hub/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: payload.deviceId,
        playerName: payload.playerName.trim() || 'ArcadePlayer',
        gameId: payload.gameId,
        score: payload.score,
        totalScore: payload.totalScore,
        gamesPlayed: payload.gamesPlayed,
        avatarId: payload.avatarId,
      }),
    });
  } catch {
    // Silent offline fallback
  }
}
