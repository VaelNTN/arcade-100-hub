export type CategoryId =
  | 'all'
  | 'favorites'
  | 'hoppers'
  | 'fighters'
  | 'shooters'
  | 'timing'
  | 'runners'
  | 'physics'
  | 'puzzles'
  | 'retro'
  | 'sports';

export interface CategoryInfo {
  id: Exclude<CategoryId, 'all' | 'favorites'>;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'hoppers', label: 'Animals & Hop', icon: '🐾', color: '#22c55e' },
  { id: 'fighters', label: 'Action & Combat', icon: '🥋', color: '#ef4444' },
  { id: 'shooters', label: 'Tanks & Space', icon: '🚀', color: '#38bdf8' },
  { id: 'timing', label: 'One-Tap Timing', icon: '⚡', color: '#facc15' },
  { id: 'runners', label: 'Runners & Dodge', icon: '🏃', color: '#fb923c' },
  { id: 'physics', label: 'Ball & Physics', icon: '🎱', color: '#a855f7' },
  { id: 'puzzles', label: 'Puzzle & Brain', icon: '🧩', color: '#2dd4bf' },
  { id: 'retro', label: 'Retro Classics', icon: '👾', color: '#ec4899' },
  { id: 'sports', label: 'Sports & Reflex', icon: '🏆', color: '#f59e0b' },
];

export const W = 420;
export const H = 640;

export interface InputState {
  down: boolean;
  justPressed: boolean;
  justReleased: boolean;
  x: number;
  y: number;
  dx: number;
  dy: number;
  startX: number;
  startY: number;
  swipe: 'up' | 'down' | 'left' | 'right' | null;
}

export interface MiniGameRuntime {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  sfx: {
    tap(): void;
    score(): void;
    hit(): void;
    explode(): void;
    win(): void;
  };
  setScore(score: number): void;
  setStatus(text: string): void;
  endGame(finalScore: number, summary?: string): void;
}

export interface MiniGameInstance {
  update(dt: number, input: InputState, rt: MiniGameRuntime): void;
  render(rt: MiniGameRuntime): void;
  onKey?(key: string, rt: MiniGameRuntime): void;
  destroy?(): void;
}

export interface MiniGameDef {
  id: string;
  num: number;
  title: string;
  icon: string;
  category: Exclude<CategoryId, 'all' | 'favorites'>;
  color: string;
  controlsHint: string;
  desc: string;
  create(rt: MiniGameRuntime): MiniGameInstance;
}
