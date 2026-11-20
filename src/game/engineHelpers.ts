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

export function drawGradientBg(
  ctx: CanvasRenderingContext2D,
  top: string,
  bottom: string,
  accentGlow?: string
): void {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Subtle top-center arcade spotlight for depth
  const spot = ctx.createRadialGradient(W * 0.5, H * 0.22, 12, W * 0.5, H * 0.3, H * 0.72);
  spot.addColorStop(0, accentGlow || 'rgba(255, 255, 255, 0.08)');
  spot.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);
}

export function drawGridLines(
  ctx: CanvasRenderingContext2D,
  step = 40,
  color = 'rgba(255,255,255,0.06)'
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= W; x += step) {
    const px = Math.floor(x) + 0.5;
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
  }
  for (let y = 0; y <= H; y += step) {
    const py = Math.floor(y) + 0.5;
    ctx.moveTo(0, py);
    ctx.lineTo(W, py);
  }
  ctx.stroke();
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  time: number,
  count = 28,
  speed = 24,
  color = 'rgba(255,255,255,0.55)'
): void {
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const x = ((i * 97.3 + 29) % W);
    const y = (((i * 151.7) + time * speed * (0.4 + (i % 3) * 0.35)) % (H + 10)) - 5;
    const r = i % 4 === 0 ? 1.8 : 1.1;
    ctx.globalAlpha = 0.25 + ((Math.sin(time * 2 + i) + 1) * 0.3);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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
  ctx.font = `800 ${size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
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
  stroke?: string,
  glowColor?: string
): void {
  if (r <= 0) return;
  ctx.save();
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Crisp subtle top-left specular sheen for glossy arcade feel
  if (r >= 6 && !fill.startsWith('rgba')) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRoundedBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
  glowColor?: string
): void {
  if (w <= 0 || h <= 0) return;
  const safeR = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.save();
  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;
  }
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, safeR);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Subtle top bevel highlight for crisp vector surfaces
  if (h >= 10 && w >= 12 && !fill.startsWith('rgba(0,0,0,0)') && !fill.startsWith('rgba(255,255,255,0.0')) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(x + 1, y + 1, Math.max(0, w - 2), Math.min(4, h * 0.25), Math.min(safeR, 3));
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, safeR);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 4,
  glowColor?: string
): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.shadowColor = glowColor || color;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = Math.max(1, width * 0.35);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawVectorHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  filled: boolean
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.42);
  ctx.bezierCurveTo(-size * 0.9, -size * 0.12, -size * 0.62, -size * 0.82, 0, -size * 0.28);
  ctx.bezierCurveTo(size * 0.62, -size * 0.82, size * 0.9, -size * 0.12, 0, size * 0.42);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.1;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(-size * 0.24, -size * 0.22, size * 0.14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(30, 41, 59, 0.75)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}

export function drawLives(ctx: CanvasRenderingContext2D, lives: number, max = 3): void {
  const safeMax = Math.max(1, Math.min(8, max));
  const spacing = 20;
  const pillW = safeMax * spacing + 16;
  const pillX = W - pillW - 10;
  drawRoundedBox(ctx, pillX, 10, pillW, 30, 15, 'rgba(9, 13, 22, 0.72)', 'rgba(255,255,255,0.2)');
  for (let i = 0; i < safeMax; i++) {
    const hx = pillX + 18 + i * spacing;
    drawVectorHeart(ctx, hx, 26, 8.5, i < lives);
  }
}

export interface Burst {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife?: number;
  size?: number;
}

export function spawnBurst(
  arr: Burst[],
  x: number,
  y: number,
  color: string,
  count = 10,
  speedScale = 1
): void {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.45;
    const s = (55 + Math.random() * 145) * speedScale;
    const maxLife = 0.36 + Math.random() * 0.18;
    arr.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      color,
      life: maxLife,
      maxLife,
      size: 2.5 + Math.random() * 2.5,
    });
  }
}

export function updateAndDrawBursts(ctx: CanvasRenderingContext2D, arr: Burst[], dt: number): void {
  if (arr.length === 0) return;
  ctx.save();
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.25, dt);
    p.vy *= Math.pow(0.25, dt);
    p.life -= dt;
    if (p.life <= 0) {
      arr.splice(i, 1);
      continue;
    }
    const ratio = clamp(p.life / (p.maxLife || 0.45), 0, 1);
    const radius = (p.size || 3.5) * (0.4 + 0.6 * ratio);
    ctx.globalAlpha = ratio;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export interface FloatingPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export function spawnPopup(
  arr: FloatingPopup[],
  x: number,
  y: number,
  text: string,
  color = '#fde047',
  size = 18
): void {
  arr.push({ x, y, text, color, life: 0.72, maxLife: 0.72, size });
}

export function updateAndDrawPopups(ctx: CanvasRenderingContext2D, arr: FloatingPopup[], dt: number): void {
  if (arr.length === 0) return;
  ctx.save();
  for (let i = arr.length - 1; i >= 0; i--) {
    const p = arr[i];
    p.y -= 42 * dt;
    p.life -= dt;
    if (p.life <= 0) {
      arr.splice(i, 1);
      continue;
    }
    const alpha = clamp(p.life / (p.maxLife * 0.6), 0, 1);
    ctx.globalAlpha = alpha;
    drawBadgeText(ctx, p.text, p.x, p.y, p.color, p.size);
  }
  ctx.restore();
}

export interface CarSpriteOptions {
  scale?: number;
  headlights?: boolean;
  taxi?: boolean;
  spoiler?: boolean;
  bumper?: boolean;
}

export function drawCarSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  bodyColor: string,
  accentColor = '#f8fafc',
  opts: CarSpriteOptions = {}
): void {
  const s = opts.scale ?? 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);

  if (opts.bumper) {
    // Top-down bumper car with rubber ring, chrome rim, seat & driver helmet
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 21, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.roundRect(-8, -3, 18, 6, 3);
    ctx.fill();

    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-2, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
  ctx.beginPath();
  ctx.roundRect(-15, -23, 32, 50, 9);
  ctx.fill();

  // Headlight beams (facing -Y in local space)
  if (opts.headlights !== false) {
    const beam = ctx.createLinearGradient(0, -24, 0, -56);
    beam.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
    beam.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(-11, -24);
    ctx.lineTo(-20, -56);
    ctx.lineTo(-3, -56);
    ctx.lineTo(-5, -24);
    ctx.moveTo(5, -24);
    ctx.lineTo(3, -56);
    ctx.lineTo(20, -56);
    ctx.lineTo(11, -24);
    ctx.fill();
  }

  // 4 tires with metallic rim glint
  const wheelCoords: [number, number][] = [
    [-16, -16],
    [12, -16],
    [-16, 8],
    [12, 8],
  ];
  for (const [wx, wy] of wheelCoords) {
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(wx, wy, 4.5, 10, 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(wx + (wx < 0 ? 0.5 : 2.5), wy + 3, 1.5, 4);
  }

  // Main chassis
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-13, -24, 26, 48, 8);
  ctx.fill();
  ctx.stroke();

  // Racing stripe
  ctx.fillStyle = accentColor;
  ctx.fillRect(-3.5, -23, 7, 46);

  // Hood specular highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.roundRect(-10, -22, 20, 10, 4);
  ctx.fill();

  // Cabin glass (windshield + rear glass)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-10, -10, 20, 22, 4);
  ctx.fill();

  // Windshield glare
  ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(7, -8);
  ctx.lineTo(3, -1);
  ctx.lineTo(-8, -1);
  ctx.closePath();
  ctx.fill();

  // Roof panel
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-8, -1, 16, 10, 3);
  ctx.fill();

  if (opts.taxi) {
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-5, 1, 10, 5, 2);
    ctx.fill();
    ctx.stroke();
  }

  if (opts.spoiler) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(-14, 19, 28, 5, 2);
    ctx.fill();
  }

  // Headlights & Taillights
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(-10, -24, 5, 2.5);
  ctx.fillRect(5, -24, 5, 2.5);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-10, 22, 5, 2.5);
  ctx.fillRect(5, 22, 5, 2.5);

  ctx.restore();
}

export interface CharacterSpriteOptions {
  scale?: number;
  suitColor?: string;
  accentColor?: string;
  skinColor?: string;
  style?: 'runner' | 'ninja' | 'astronaut' | 'knight' | 'sumo' | 'skier' | 'worker' | 'boxer' | 'monster' | 'robot';
  dir?: 1 | -1;
  stride?: number;
  action?: 'idle' | 'jump' | 'kick' | 'punch' | 'guard';
  glow?: string;
}

export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: CharacterSpriteOptions = {}
): void {
  const s = opts.scale ?? 1;
  const dir = opts.dir ?? 1;
  const style = opts.style ?? 'runner';
  const suit = opts.suitColor ?? (style === 'ninja' ? '#1e293b' : style === 'knight' ? '#94a3b8' : style === 'astronaut' ? '#f8fafc' : style === 'monster' ? '#dc2626' : style === 'robot' ? '#38bdf8' : '#3b82f6');
  const accent = opts.accentColor ?? (style === 'ninja' ? '#ef4444' : style === 'astronaut' ? '#f97316' : style === 'knight' ? '#facc15' : '#fde047');
  const skin = opts.skinColor ?? (style === 'monster' ? '#f87171' : style === 'robot' ? '#cbd5e1' : '#fdba74');
  const stride = Math.sin(opts.stride ?? 0);
  const action = opts.action ?? 'idle';

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * dir, s);
  if (opts.glow) {
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 12;
  }

  // Contact shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 12, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Back leg
  const legSwing = action === 'jump' ? 0.55 : stride * 0.45;
  ctx.lineCap = 'round';
  ctx.strokeStyle = style === 'sumo' ? skin : '#0f172a';
  ctx.lineWidth = style === 'sumo' ? 7 : 5;
  ctx.beginPath();
  if (action === 'kick') {
    ctx.moveTo(-3, 5);
    ctx.lineTo(-8, 17);
  } else {
    ctx.moveTo(-3, 5);
    ctx.lineTo(-4 - legSwing * 9, 17);
  }
  ctx.stroke();

  // Front leg
  ctx.strokeStyle = style === 'sumo' ? skin : suit;
  ctx.beginPath();
  if (action === 'kick') {
    ctx.moveTo(3, 4);
    ctx.lineTo(18, 12);
  } else {
    ctx.moveTo(3, 5);
    ctx.lineTo(4 + legSwing * 9, 17);
  }
  ctx.stroke();

  // Boots
  ctx.fillStyle = accent;
  if (action === 'kick') {
    ctx.beginPath();
    ctx.arc(19, 12, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-7 - legSwing * 9, 15, 7, 4);
    ctx.fillRect(1 + legSwing * 9, 15, 7, 4);
  }

  // Flowing scarf / headband / cape
  if (style === 'ninja' || style === 'skier' || style === 'knight') {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.quadraticCurveTo(-15, -10 + stride * 3, -20, -4 + stride * 2);
    ctx.stroke();
  }

  // Torso
  const torsoW = style === 'sumo' ? 24 : 16;
  ctx.fillStyle = suit;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-torsoW / 2, -10, torsoW, 17, 6);
  ctx.fill();
  ctx.stroke();

  // Belt / sash
  ctx.fillStyle = accent;
  ctx.fillRect(-torsoW / 2 + 1, 1, torsoW - 2, 3.5);

  // Head / Helmet
  ctx.fillStyle = style === 'astronaut' ? '#f8fafc' : style === 'knight' ? '#cbd5e1' : style === 'robot' ? '#64748b' : skin;
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -17, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (style === 'ninja') {
    // Hood + mask leaving eye slit
    ctx.fillStyle = suit;
    ctx.beginPath();
    ctx.arc(0, -17, 10.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin;
    ctx.fillRect(-2, -20, 10, 5);
    ctx.fillStyle = accent;
    ctx.fillRect(-10, -24, 20, 3.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -19, 2.5, 2.5);
    ctx.fillRect(6, -19, 2.5, 2.5);
  } else if (style === 'astronaut') {
    ctx.fillStyle = '#0ea5e9';
    ctx.beginPath();
    ctx.roundRect(-2, -22, 11, 9, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(1, -21, 5, 2);
  } else if (style === 'knight') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -20, 9, 4);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(-4, -27);
    ctx.lineTo(3, -33);
    ctx.lineTo(5, -26);
    ctx.fill();
  } else if (style === 'worker') {
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, -19, 11, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-12, -20, 24, 3);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(2, -17, 2.5, 2.5);
  } else if (style === 'robot') {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -20, 14, 6);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(1, -18, 6, 2.5);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -27);
    ctx.lineTo(0, -32);
    ctx.stroke();
  } else if (style === 'monster') {
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-6, -24);
    ctx.lineTo(-9, -32);
    ctx.lineTo(-2, -26);
    ctx.moveTo(4, -24);
    ctx.lineTo(8, -32);
    ctx.lineTo(1, -26);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, -20, 3, 3);
    ctx.fillRect(5, -20, 3, 3);
  } else {
    // Runner / Skier / Boxer / Sumo
    if (style === 'skier') {
      ctx.fillStyle = '#0ea5e9';
      ctx.fillRect(-1, -20, 10, 4.5);
      // Skis
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-14, 19);
      ctx.lineTo(16, 17);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, -21, 9.5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(2, -18, 2.5, 2.5);
      ctx.fillRect(6, -18, 2.5, 2.5);
    }
  }

  // Front arm & hand/glove
  ctx.strokeStyle = suit;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  if (action === 'punch') {
    ctx.moveTo(3, -6);
    ctx.lineTo(18, -8);
  } else if (action === 'guard') {
    ctx.moveTo(3, -6);
    ctx.lineTo(10, -14);
  } else {
    ctx.moveTo(3, -6);
    ctx.lineTo(9 - legSwing * 6, 3);
  }
  ctx.stroke();

  if (style === 'boxer') {
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    const gx = action === 'punch' ? 19 : action === 'guard' ? 11 : 10;
    const gy = action === 'punch' ? -8 : action === 'guard' ? -15 : 2;
    ctx.beginPath();
    ctx.arc(gx, gy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

export interface ShipSpriteOptions {
  scale?: number;
  kind?: 'fighter' | 'rocket' | 'bomber' | 'ufo' | 'tank' | 'chopper';
  thrust?: number;
  time?: number;
}

export function drawShipSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  bodyColor: string,
  accentColor = '#38bdf8',
  opts: ShipSpriteOptions = {}
): void {
  const s = opts.scale ?? 1;
  const kind = opts.kind ?? 'fighter';
  const thrust = opts.thrust ?? 0.8;
  const time = opts.time ?? 0;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(s, s);

  if (kind === 'ufo') {
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 3, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 10, Math.PI, 0);
    ctx.fill();

    for (let i = -2; i <= 2; i++) {
      ctx.fillStyle = (Math.floor(time * 8 + i) % 2 === 0) ? '#fde047' : accentColor;
      ctx.beginPath();
      ctx.arc(i * 6.5, 4, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  if (kind === 'tank') {
    // Treads
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-18, -14, 7, 28, 3);
    ctx.roundRect(11, -14, 7, 28, 3);
    ctx.fill();
    ctx.stroke();

    // Hull
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(-12, -13, 24, 26, 5);
    ctx.fill();
    ctx.stroke();

    // Barrel + Turret
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(-3, -24, 6, 15);
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (kind === 'chopper') {
    // Skids
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-12, 13);
    ctx.lineTo(14, 13);
    ctx.moveTo(-6, 8);
    ctx.lineTo(-6, 13);
    ctx.moveTo(6, 8);
    ctx.lineTo(6, 13);
    ctx.stroke();
    // Tail boom
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-20, -2, 16, 4);
    // Fuselage
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(2, 0, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Glass canopy
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.ellipse(7, -2, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Spinning top rotor
    const rotorW = 14 + Math.abs(Math.sin(time * 28)) * 14;
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2 - rotorW, -12);
    ctx.lineTo(2 + rotorW, -12);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Thruster exhaust (fighter / bomber / rocket)
  if (thrust > 0) {
    const flicker = 7 + Math.sin(time * 36) * 3;
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(0, 16 + flicker * thrust + 8);
    ctx.lineTo(5, 16);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.moveTo(-3, 16);
    ctx.lineTo(0, 16 + flicker * thrust * 0.6 + 4);
    ctx.lineTo(3, 16);
    ctx.fill();
  }

  if (kind === 'rocket') {
    // Fins
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(-7, 5);
    ctx.lineTo(-16, 17);
    ctx.lineTo(-6, 15);
    ctx.moveTo(7, 5);
    ctx.lineTo(16, 17);
    ctx.lineTo(6, 15);
    ctx.fill();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -21);
    ctx.quadraticCurveTo(10, -6, 8, 16);
    ctx.lineTo(-8, 16);
    ctx.quadraticCurveTo(-10, -6, 0, -21);
    ctx.fill();
    ctx.stroke();

    // Porthole
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(0, -3, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Swept Wings
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(22, 10);
    ctx.lineTo(19, 15);
    ctx.lineTo(6, 10);
    ctx.lineTo(-6, 10);
    ctx.lineTo(-19, 15);
    ctx.lineTo(-22, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Fuselage
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(6, 2);
    ctx.lineTo(4, 16);
    ctx.lineTo(-4, 16);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();

    // Glass canopy
    ctx.fillStyle = '#bae6fd';
    ctx.beginPath();
    ctx.ellipse(0, -5, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wingtip lights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-21, 9, 2.5, 2.5);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(18.5, 9, 2.5, 2.5);
  }

  ctx.restore();
}

export function drawTrainSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  bodyColor = '#ef4444',
  stripeColor = '#fde047'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(-21, -24, 44, 52, 10);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-20, -26, 40, 52, 10);
  ctx.fill();
  ctx.stroke();

  // Front windshield
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-14, -18, 28, 16, 5);
  ctx.fill();
  ctx.fillStyle = 'rgba(186,230,253,0.45)';
  ctx.fillRect(-11, -15, 22, 4);

  // Accent stripe + glowing twin headlights
  ctx.fillStyle = stripeColor;
  ctx.fillRect(-18, 4, 36, 6);
  ctx.fillStyle = '#fef08a';
  ctx.shadowColor = '#fef08a';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(-11, 18, 4, 0, Math.PI * 2);
  ctx.arc(11, 18, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

