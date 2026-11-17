import { Device } from '@capacitor/device';

const SAVE_KEY = 'arcade_100_hub_save_v1';
const DEVICE_KEY = 'arcade_100_hub_device_v1';

export const AVATARS = ['👾', '🤖', '🦊', '🐸', '🦁', '🐉', '🚀', '🏆'];

export interface ArcadeHubState {
  deviceId: string;
  apiBaseUrl: string;
  playerName: string;
  avatarId: number;
  soundEnabled: boolean;
  favorites: string[];
  bestScores: Record<string, number>;
  playCounts: Record<string, number>;
}

function generateFallbackDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ah-${crypto.randomUUID()}`;
  }
  return `ah-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function resolveDeviceId(): Promise<string> {
  const cached = localStorage.getItem(DEVICE_KEY);
  try {
    const info = await Device.getId();
    if (info?.identifier && info.identifier.trim().length >= 4) {
      const id = `phone-${info.identifier.trim()}`;
      localStorage.setItem(DEVICE_KEY, id);
      return id;
    }
  } catch {
    // Web fallback
  }
  if (cached && cached.trim().length >= 4) return cached;
  const fresh = generateFallbackDeviceId();
  localStorage.setItem(DEVICE_KEY, fresh);
  return fresh;
}

export function loadArcadeHubState(deviceId: string): ArcadeHubState {
  const defaultApi = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL || '')
    .trim()
    .replace(/\/+$/, '');

  const base: ArcadeHubState = {
    deviceId,
    apiBaseUrl: defaultApi,
    playerName: 'ArcadeSpeler',
    avatarId: 0,
    soundEnabled: true,
    favorites: [],
    bestScores: {},
    playCounts: {},
  };

  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Partial<ArcadeHubState>;
    return {
      deviceId,
      apiBaseUrl:
        typeof p.apiBaseUrl === 'string' && p.apiBaseUrl.trim()
          ? p.apiBaseUrl.trim().replace(/\/+$/, '')
          : defaultApi,
      playerName:
        typeof p.playerName === 'string' && p.playerName.trim()
          ? p.playerName.trim()
          : 'ArcadeSpeler',
      avatarId: typeof p.avatarId === 'number' ? p.avatarId : 0,
      soundEnabled: p.soundEnabled !== false,
      favorites: Array.isArray(p.favorites) ? p.favorites : [],
      bestScores: p.bestScores && typeof p.bestScores === 'object' ? p.bestScores : {},
      playCounts: p.playCounts && typeof p.playCounts === 'object' ? p.playCounts : {},
    };
  } catch {
    return base;
  }
}

export function saveArcadeHubState(state: ArcadeHubState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage issues
  }
}

export function computeTotalArcadeScore(state: ArcadeHubState): { totalScore: number; gamesPlayed: number } {
  let totalScore = 0;
  let gamesPlayed = 0;
  for (const val of Object.values(state.bestScores)) {
    if (val > 0) {
      totalScore += Math.floor(val);
      gamesPlayed += 1;
    }
  }
  return { totalScore, gamesPlayed };
}

export function recordGameScore(state: ArcadeHubState, gameId: string, score: number): boolean {
  const clean = Math.max(0, Math.floor(score));
  state.playCounts[gameId] = (state.playCounts[gameId] || 0) + 1;
  const prev = state.bestScores[gameId] || 0;
  const isNewBest = clean > prev;
  if (isNewBest) {
    state.bestScores[gameId] = clean;
  }
  saveArcadeHubState(state);
  return isNewBest;
}
