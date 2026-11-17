import { H, W } from '../types';

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

export function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function drawGradientBg(ctx: CanvasRenderingContext2D, top: string, bottom: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export function drawGridLines(ctx: CanvasRenderingContext2D, step = 40, color = 'rgba(255,255,255,0.05)'): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = 0; y <= H; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
}

export function drawBadgeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#f8fafc',
  size = 18,
  align: CanvasTextAlign = 'center'
): void {
  ctx.font = `800 ${size}px -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(text, x + 1.5, y + 1.5);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill: string,
  stroke?: string
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string
): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

export function drawLives(ctx: CanvasRenderingContext2D, lives: number, max = 3): void {
  let out = '';
  for (let i = 0; i < max; i++) {
    out += i < lives ? '❤️' : '🖤';
  }
  drawBadgeText(ctx, out, W - 16, 26, '#fff', 16, 'right');
}

export interface Burst {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

export function spawnBurst(arr: Burst[], x: number, y: number, color: string, count = 10): void {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const s = 50 + Math.random() * 140;
    arr.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: 0.45 });
  }
}

export function updateAndDrawBursts(ctx: CanvasRenderingContext2D, arr: Burst[], dt: number): void {
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) {
      arr.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = clamp(p.life / 0.45, 0, 1);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
