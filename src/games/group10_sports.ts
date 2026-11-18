import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCarSprite,
  drawCharacterSprite,
  drawCircle,
  drawGlowLine,
  drawGradientBg,
  drawLives,
  drawRoundedBox,
  FloatingPopup,
  rand,
  spawnBurst,
  spawnPopup,
  updateAndDrawBursts,
  updateAndDrawPopups,
} from '../game/engineHelpers';

export const GROUP_10_SPORTS: MiniGameDef[] = [
  {
    id: 'penalty-flick',
    num: 91,
    title: 'Penalty Flick',
    icon: '⚽',
    category: 'sports',
    color: '#22c55e',
    controlsHint: 'Swipe upward from the ball to curl shots past the keeper!',
    desc: 'Curve penalty kicks into the net past a diving keeper.',
    create(rt): MiniGameInstance {
      let bx = W / 2;
      let by = 520;
      let vx = 0;
      let vy = 0;
      let keeperX = W / 2;
      let keeperVx = 140;
      let shooting = false;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      let time = 0;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const reset = () => {
        bx = W / 2;
        by = 520;
        vx = 0;
        vy = 0;
        shooting = false;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          keeperX += keeperVx * dt;
          if (keeperX < 95 || keeperX > W - 95) {
            keeperX = clamp(keeperX, 95, W - 95);
            keeperVx *= -1;
          }
          if (!shooting && inp.justReleased && inp.startY - inp.y > 25) {
            shooting = true;
            vx = clamp((inp.x - inp.startX) * 2.6, -260, 260);
            vy = -540;
            rt.sfx.tap();
          }
          if (shooting) {
            bx += vx * dt;
            by += vy * dt;
            if (Math.abs(by - 165) < 22 && Math.abs(bx - keeperX) < 38) {
              lives--;
              rt.sfx.hit();
              spawnBurst(bursts, bx, by, '#ef4444', 12);
              spawnPopup(popups, bx, by - 16, 'SAVED!', '#fca5a5');
              if (lives <= 0) {
                rt.endGame(score, `Keeper saved it! Score: ${score}`);
                return;
              }
              reset();
            } else if (by <= 110) {
              if (bx > 70 && bx < W - 70) {
                score += 100;
                rt.setScore(score);
                rt.sfx.win();
                spawnBurst(bursts, bx, 115, '#fde047', 16);
                spawnPopup(popups, bx, 130, 'GOAL! +100', '#fde047', 20);
                keeperVx = (keeperVx > 0 ? 1 : -1) * Math.min(320, Math.abs(keeperVx) + 20);
              } else {
                lives--;
                rt.sfx.hit();
                spawnBurst(bursts, bx, 115, '#ef4444', 10);
                spawnPopup(popups, clamp(bx, 60, W - 60), 130, 'WIDE!', '#fca5a5');
                if (lives <= 0) {
                  rt.endGame(score, `Missed wide! Score: ${score}`);
                  return;
                }
              }
              reset();
            }
          }
          rt.setStatus('Swipe up to shoot!');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#15803d', '#14532d', 'rgba(34,197,94,0.16)');
          drawRoundedBox(c, 65, 85, W - 130, 85, 6, 'rgba(255,255,255,0.12)', '#fff');
          // Goal net mesh
          c.strokeStyle = 'rgba(255,255,255,0.18)';
          c.lineWidth = 1;
          for (let gx = 85; gx < W - 65; gx += 22) {
            c.beginPath();
            c.moveTo(gx, 85);
            c.lineTo(gx, 170);
            c.stroke();
          }
          for (let gy = 105; gy < 170; gy += 22) {
            c.beginPath();
            c.moveTo(65, gy);
            c.lineTo(W - 65, gy);
            c.stroke();
          }
          drawCharacterSprite(c, keeperX, 162, {
            style: 'runner',
            suitColor: '#facc15',
            accentColor: '#ef4444',
            dir: keeperVx >= 0 ? 1 : -1,
            stride: time * 8,
            action: 'guard',
            scale: 1.15,
          });
          drawBadgeText(c, '⚽', bx, by, '#fff', 34);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'basketball-swish-streak',
    num: 92,
    title: 'Basketball Swish',
    icon: '🏀',
    category: 'sports',
    color: '#f97316',
    controlsHint: 'Swipe upward toward the hoop for clean swishes!',
    desc: 'Sink consecutive hoops as the basket shifts.',
    create(rt): MiniGameInstance {
      let bx = W / 2;
      let by = 520;
      let vx = 0;
      let vy = 0;
      let fly = false;
      let hoopX = W / 2;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const reset = () => {
        bx = W / 2;
        by = 520;
        vx = 0;
        vy = 0;
        fly = false;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (!fly && inp.justReleased && inp.startY - inp.y > 25) {
            fly = true;
            vx = clamp((inp.x - bx) * 1.1, -180, 180);
            vy = -770;
            rt.sfx.tap();
          }
          if (fly) {
            vy += 760 * dt;
            bx += vx * dt;
            by += vy * dt;
            if (bx < 22 || bx > W - 22) {
              vx *= -0.8;
              bx = clamp(bx, 22, W - 22);
            }
            if (vy > 0 && Math.abs(by - 175) < 22 && Math.abs(bx - hoopX) < 34) {
              score += 50;
              rt.setScore(score);
              rt.sfx.win();
              spawnBurst(bursts, hoopX, 175, '#fde047', 16);
              spawnPopup(popups, hoopX, 150, 'SWISH! +50', '#fde047', 20);
              hoopX = rand(85, W - 85);
              reset();
            } else if (by > H + 20) {
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Final score: ${score} pt!`);
                return;
              }
              reset();
            }
          }
          rt.setStatus('Swipe up toward the hoop!');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#7c2d12', '#1e293b', 'rgba(249,115,22,0.16)');
          drawRoundedBox(c, hoopX - 55, 115, 110, 65, 8, '#f8fafc', '#ef4444');
          drawRoundedBox(c, hoopX - 24, 134, 48, 30, 4, 'rgba(255,255,255,0)', '#ef4444');
          // Hoop net
          c.strokeStyle = 'rgba(255,255,255,0.65)';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(hoopX - 26, 180);
          c.lineTo(hoopX - 16, 214);
          c.lineTo(hoopX + 16, 214);
          c.lineTo(hoopX + 26, 180);
          c.stroke();
          drawRoundedBox(c, hoopX - 30, 170, 60, 10, 5, '#ea580c', '#fed7aa', '#ea580c');
          drawBadgeText(c, '🏀', bx, by, '#fff', 36);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'archery-bullseye',
    num: 93,
    title: 'Archery Bullseye',
    icon: '🏹',
    category: 'sports',
    color: '#22c55e',
    controlsHint: 'Hold to aim at the moving target & release on the bullseye!',
    desc: 'Hit the bullseye on moving targets for 100 pts per arrow.',
    create(rt): MiniGameInstance {
      let t = 0;
      let aimX = W / 2;
      let aimY = 270;
      let targetX = W / 2;
      let arrows = 7;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          t += dt;
          targetX = W / 2 + Math.sin(t * 1.8) * 110;
          if (inp.down) {
            aimX = clamp(inp.x, 40, W - 40);
            aimY = clamp(inp.y, 120, 440);
          }
          if (inp.justReleased && arrows > 0) {
            arrows--;
            const d = Math.hypot(aimX - targetX, aimY - 260);
            if (d < 55) {
              const pts = d < 18 ? 100 : d < 36 ? 60 : 30;
              score += pts;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, aimX, aimY, d < 18 ? '#fde047' : '#38bdf8', 14);
              spawnPopup(popups, aimX, aimY - 18, d < 18 ? 'BULLSEYE +100' : `+${pts}`, '#fde047');
            } else {
              spawnBurst(bursts, aimX, aimY, '#94a3b8', 6, 0.5);
              rt.sfx.hit();
            }
            if (arrows <= 0) {
              rt.sfx.win();
              rt.endGame(score, `7 arrows shot! Score: ${score}`);
              return;
            }
          }
          rt.setStatus(`Arrows left: ${arrows}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#064e3b', '#090d16', 'rgba(34,197,94,0.14)');
          drawCircle(c, targetX, 260, 54, '#fff', '#0f172a');
          drawCircle(c, targetX, 260, 36, '#38bdf8');
          drawCircle(c, targetX, 260, 18, '#ef4444');
          c.save();
          c.shadowColor = '#fde047';
          c.shadowBlur = 10;
          c.strokeStyle = '#fde047';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(aimX, aimY, 20, 0, Math.PI * 2);
          c.moveTo(aimX - 26, aimY);
          c.lineTo(aimX + 26, aimY);
          c.moveTo(aimX, aimY - 26);
          c.lineTo(aimX, aimY + 26);
          c.stroke();
          c.restore();
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'bowling-spin-strike',
    num: 94,
    title: 'Bowling Spin Strike',
    icon: '🎳',
    category: 'sports',
    color: '#6366f1',
    controlsHint: 'Swipe up the lane to bowl down all 10 pins!',
    desc: 'Bowl strikes across 6 fast frames.',
    create(rt): MiniGameInstance {
      let bx = W / 2;
      let by = 540;
      let vx = 0;
      let vy = 0;
      let roll = false;
      let score = 0;
      let frames = 6;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const makePins = () => {
        const list: { x: number; y: number; up: boolean }[] = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c <= r; c++) list.push({ x: W / 2 + (c - r / 2) * 32, y: 170 - r * 24, up: true });
        }
        return list;
      };
      let pins = makePins();
      return {
        update(dt, inp) {
          lastDt = dt;
          if (!roll && inp.justReleased && inp.startY - inp.y > 20) {
            roll = true;
            vx = clamp((inp.x - bx) * 2.0, -200, 200);
            vy = -520;
            rt.sfx.tap();
          }
          if (roll) {
            bx += vx * dt;
            by += vy * dt;
            for (const p of pins) {
              if (p.up && Math.hypot(bx - p.x, by - p.y) < 32) {
                p.up = false;
                score += 20;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, p.x, p.y, '#fde047', 8);
                spawnPopup(popups, p.x, p.y - 12, '+20', '#fde047', 14);
              }
            }
            if (by < 80) {
              roll = false;
              frames--;
              if (frames <= 0) {
                rt.sfx.win();
                rt.endGame(score, `6 frames done! Bowling score: ${score}`);
                return;
              }
              bx = W / 2;
              by = 540;
              pins = makePins();
            }
          }
          rt.setStatus(`Frames left: ${frames}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16', 'rgba(99,102,241,0.14)');
          drawRoundedBox(c, 80, 75, W - 160, H - 90, 12, '#d97706', '#fde68a');
          for (const p of pins) if (p.up) drawBadgeText(c, '🎳', p.x, p.y, '#fff', 26);
          drawCircle(c, bx, by, 16, '#0f172a', '#38bdf8', '#38bdf8');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'ping-pong-rally',
    num: 95,
    title: 'Ping Pong Rally',
    icon: '🏓',
    category: 'sports',
    color: '#ef4444',
    controlsHint: 'Drag your red paddle to return every fast rally shot!',
    desc: 'High-speed table tennis rally where every return speeds up.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let bx = W / 2;
      let by = 220;
      let vx = 190;
      let vy = 290;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) px = clamp(inp.x, 48, W - 48);
          bx += vx * dt;
          by += vy * dt;
          if (bx < 16 || bx > W - 16) {
            vx *= -1;
            bx = clamp(bx, 16, W - 16);
          }
          if (by < 105) {
            vy = Math.abs(vy);
            by = 105;
            spawnBurst(bursts, bx, 105, '#bae6fd', 5, 0.45);
            rt.sfx.tap();
          }
          if (vy > 0 && by >= 515 && by <= 545 && Math.abs(bx - px) < 52) {
            vy = Math.max(-640, -Math.abs(vy) * 1.04);
            vx = clamp((bx - px) * 5.8, -360, 360);
            score += 15;
            rt.setScore(score);
            rt.sfx.score();
            spawnBurst(bursts, bx, 525, '#fde047', 10);
            spawnPopup(popups, bx, 498, '+15', '#fde047', 16);
          }
          if (by > H + 20) {
            rt.sfx.hit();
            rt.endGame(score, `Missed the ball! Rally score: ${score}`);
            return;
          }
          rt.setStatus(`Rally Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#0f172a', 'rgba(239,68,68,0.14)');
          drawRoundedBox(c, 16, 95, W - 32, 460, 10, '#1d4ed8', '#fff');
          c.strokeStyle = 'rgba(255,255,255,0.45)';
          c.beginPath();
          c.moveTo(16, 325);
          c.lineTo(W - 16, 325);
          c.stroke();
          drawRoundedBox(c, px - 48, 525, 96, 16, 8, '#ef4444', '#fff', '#ef4444');
          drawCircle(c, bx, by, 10, '#facc15', '#fff', '#facc15');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'reaction-light-f1',
    num: 96,
    title: 'Reaction Light F1',
    icon: '🏎️',
    category: 'sports',
    color: '#ef4444',
    controlsHint: 'Wait for all 5 red lights to go OUT, then tap fast!',
    desc: 'F1 lights-out reaction test across 5 rounds.',
    create(rt): MiniGameInstance {
      let lights = 0;
      let timer = 0.55;
      let phase: 'count' | 'go' = 'count';
      let react = 0;
      let round = 1;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (phase === 'count') {
            timer -= dt;
            if (inp.justPressed) {
              rt.sfx.hit();
              rt.endGame(score, `Jump start on round ${round}!`);
              return;
            }
            if (timer <= 0) {
              if (lights < 5) {
                lights++;
                timer = 0.45;
                rt.sfx.tap();
              } else {
                phase = 'go';
                react = 0;
                lights = 0;
              }
            }
          } else {
            react += dt;
            if (inp.justPressed) {
              const ms = Math.round(react * 1000);
              const pts = Math.max(50, 400 - ms);
              score += pts;
              rt.setScore(score);
              rt.sfx.win();
              spawnBurst(bursts, W / 2, 505, '#22c55e', 16);
              spawnPopup(popups, W / 2, 465, `${ms}ms (+${pts})`, '#fde047', 20);
              round++;
              if (round > 5) {
                rt.endGame(score, `5 F1 starts complete! Last: ${ms}ms`);
                return;
              }
              phase = 'count';
              lights = 0;
              timer = rand(0.5, 1.4);
            }
          }
          rt.setStatus(phase === 'go' ? '🟢 TAP NOW!!' : `Start ${round}/5 · Wait...`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e293b', phase === 'go' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.14)');
          drawRoundedBox(c, 35, 180, 350, 110, 18, '#0f172a', '#475569');
          for (let i = 0; i < 5; i++) {
            const lit = phase === 'count' && i < lights;
            drawCircle(c, 75 + i * 67, 235, 22, lit ? '#ef4444' : '#334155', '#fff', lit ? '#ef4444' : undefined);
          }
          drawBadgeText(c, phase === 'go' ? 'GO! GO! GO!' : 'Get ready...', W / 2, 360, phase === 'go' ? '#22c55e' : '#94a3b8', 26);
          drawCarSprite(c, W / 2, 515, 0, '#ef4444', '#fde047', { spoiler: true, headlights: true, scale: 1.35 });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'whack-a-mole-frenzy',
    num: 97,
    title: 'Whack-a-Mole Frenzy',
    icon: '🔨',
    category: 'sports',
    color: '#b45309',
    controlsHint: 'Tap moles 🐹 fast — NEVER tap bombs 💣!',
    desc: '30-second reflex hunt across 9 burrows.',
    create(rt): MiniGameInstance {
      const holes = Array.from({ length: 9 }, () => ({ active: false, bomb: false, t: 0 }));
      let score = 0;
      let timer = 30;
      let spawnT = 0.2;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          timer -= dt;
          if (timer <= 0) {
            rt.sfx.win();
            rt.endGame(score, `Moles whacked! Final score: ${score}`);
            return;
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            const idx = Math.floor(Math.random() * 9);
            holes[idx] = { active: true, bomb: Math.random() < 0.24, t: 1.05 };
            spawnT = 0.42;
          }
          for (const h of holes) {
            if (h.active) {
              h.t -= dt;
              if (h.t <= 0) h.active = false;
            }
          }
          if (inp.justPressed) {
            const c = Math.floor((inp.x - 45) / 110);
            const r = Math.floor((inp.y - 160) / 110);
            if (c >= 0 && c < 3 && r >= 0 && r < 3) {
              const idx = r * 3 + c;
              const h = holes[idx];
              if (h.active) {
                const hx = 100 + c * 110;
                const hy = 215 + r * 110;
                h.active = false;
                if (h.bomb) {
                  score = Math.max(0, score - 50);
                  spawnBurst(bursts, hx, hy, '#ef4444', 14);
                  spawnPopup(popups, hx, hy - 14, '-50 💥', '#ef4444');
                  rt.sfx.explode();
                } else {
                  score += 30;
                  spawnBurst(bursts, hx, hy, '#fde047', 10);
                  spawnPopup(popups, hx, hy - 14, '+30', '#fde047');
                  rt.sfx.score();
                }
                rt.setScore(score);
              }
            }
          }
          rt.setStatus(`Time: ${Math.ceil(timer)}s`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#15803d', '#14532d', 'rgba(180,83,9,0.14)');
          for (let i = 0; i < 9; i++) {
            const x = 100 + (i % 3) * 110;
            const y = 215 + Math.floor(i / 3) * 110;
            drawCircle(c, x, y, 40, '#451a03', '#78350f');
            if (holes[i].active) drawBadgeText(c, holes[i].bomb ? '💣' : '🐹', x, y, '#fff', 40);
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'fruit-slice-ninja',
    num: 98,
    title: 'Fruit Slice Ninja',
    icon: '🍉',
    category: 'sports',
    color: '#22c55e',
    controlsHint: 'Swipe through flying fruit and avoid black bombs!',
    desc: 'Slice melons, apples, and bananas in fast swipes.',
    create(rt): MiniGameInstance {
      const fruits = ['🍉', '🍎', '🍌', '🍍', '🍊'];
      const items: { x: number; y: number; vx: number; vy: number; icon: string; bomb: boolean }[] = [];
      const blade: { x: number; y: number }[] = [];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let spawnT = 0.4;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) {
            blade.push({ x: inp.x, y: inp.y });
            if (blade.length > 8) blade.shift();
          } else {
            blade.length = 0;
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            const bomb = Math.random() < 0.2;
            const x = rand(50, W - 50);
            items.push({
              x,
              y: H + 20,
              vx: x < W / 2 ? rand(0, 85) : rand(-85, 0),
              vy: -rand(560, 720),
              icon: bomb ? '💣' : fruits[Math.floor(Math.random() * fruits.length)],
              bomb,
            });
            spawnT = 0.65;
          }
          for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            it.vy += 650 * dt;
            it.x += it.vx * dt;
            if (it.x < 24 || it.x > W - 24) {
              it.x = clamp(it.x, 24, W - 24);
              it.vx *= -0.8;
            }
            it.y += it.vy * dt;
            if (inp.down && Math.hypot(inp.x - it.x, inp.y - it.y) < 34) {
              items.splice(i, 1);
              if (it.bomb) {
                rt.sfx.explode();
                rt.endGame(score, `Sliced a bomb! Score: ${score}`);
                return;
              }
              score += 25;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, it.x, it.y, it.icon === '🍉' ? '#22c55e' : it.icon === '🍎' ? '#ef4444' : '#facc15', 14);
              spawnPopup(popups, it.x, it.y - 14, '+25', '#fde047');
              continue;
            }
            if (it.y > H + 40 && it.vy > 0) {
              if (!it.bomb) {
                lives--;
                rt.sfx.hit();
                if (lives <= 0) {
                  rt.endGame(score, `Missed too much fruit (${score} pt)!`);
                  return;
                }
              }
              items.splice(i, 1);
            }
          }
          rt.setStatus(`Lives: ${lives} · Swipe through fruit!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#451a03', '#1c1917', 'rgba(34,197,94,0.14)');
          for (const it of items) drawBadgeText(c, it.icon, it.x, it.y, '#fff', 38);
          for (let i = 1; i < blade.length; i++) {
            drawGlowLine(c, blade[i - 1].x, blade[i - 1].y, blade[i].x, blade[i].y, '#38bdf8', 3 + i * 0.6, '#7dd3fc');
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'tug-of-war-tap',
    num: 99,
    title: 'Tug of War Tap',
    icon: '🪢',
    category: 'sports',
    color: '#fb923c',
    controlsHint: 'Tap as FAST as you can to pull the flag to your side!',
    desc: 'Tap-powered tug of war against stronger rivals.',
    create(rt): MiniGameInstance {
      let rope = 0; // -1 win, +1 lose
      let aiPull = 0.45;
      let score = 0;
      let round = 1;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          rope += aiPull * dt;
          if (inp.justPressed) {
            rope -= 0.14;
            rt.sfx.tap();
          }
          if (rope <= -1) {
            const pts = round * 100;
            score += pts;
            round++;
            rope = 0;
            aiPull = Math.min(1.5, aiPull + 0.18);
            rt.setScore(score);
            rt.sfx.win();
            spawnBurst(bursts, W / 2, 310, '#fde047', 16);
            spawnPopup(popups, W / 2, 265, `ROUND WON! +${pts}`, '#fde047', 20);
          } else if (rope >= 1) {
            rt.sfx.hit();
            rt.endGame(score, `Pulled across the line in round ${round}!`);
            return;
          }
          rt.setStatus(`Round ${round} · Tap fast!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#15803d', '#064e3b', 'rgba(251,146,60,0.14)');
          c.strokeStyle = '#fff';
          c.setLineDash([8, 8]);
          c.beginPath();
          c.moveTo(W / 2, 180);
          c.lineTo(W / 2, 460);
          c.stroke();
          c.setLineDash([]);

          const ox = rope * 90;
          c.strokeStyle = '#fde68a';
          c.lineWidth = 10;
          c.beginPath();
          c.moveTo(65 + ox, 320);
          c.lineTo(W - 65 + ox, 320);
          c.stroke();
          drawBadgeText(c, '🚩', W / 2 + ox, 298, '#fff', 32);
          drawCharacterSprite(c, 65 + ox, 324, {
            style: 'sumo',
            suitColor: '#ef4444',
            accentColor: '#fde047',
            dir: 1,
            stride: ox * 0.12,
            action: 'guard',
            scale: 1.3,
          });
          drawCharacterSprite(c, W - 65 + ox, 324, {
            style: 'robot',
            suitColor: '#38bdf8',
            accentColor: '#facc15',
            dir: -1,
            stride: -ox * 0.12,
            action: 'guard',
            scale: 1.3,
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'fishing-reel-timing',
    num: 100,
    title: 'Fishing Reel Timing',
    icon: '🎣',
    category: 'sports',
    color: '#0ea5e9',
    controlsHint: 'Hold to raise the green bar and keep the fish inside!',
    desc: 'Keep the fish inside the green catch bar until 100%.',
    create(rt): MiniGameInstance {
      let barY = 320;
      let fishY = 300;
      let fishTarget = 240;
      let fishT = 0.8;
      let progress = 0.35;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          barY = clamp(barY + (inp.down ? -260 : 250) * dt, 140, 490);
          fishT -= dt;
          if (fishT <= 0) {
            fishTarget = rand(140, 490);
            fishT = rand(0.7, 1.5);
          }
          fishY += (fishTarget - fishY) * 2.8 * dt;
          const catching = Math.abs(fishY - barY) < 48;
          progress += (catching ? 0.38 : -0.22) * dt;
          if (progress >= 1) {
            score += 100;
            progress = 0.35;
            rt.setScore(score);
            rt.sfx.win();
            spawnBurst(bursts, W / 2, fishY, '#38bdf8', 16);
            spawnPopup(popups, W / 2, fishY - 20, 'CAUGHT! +100', '#fde047', 20);
          } else if (progress <= 0) {
            rt.sfx.hit();
            rt.endGame(score, `Fish escaped! Score: ${score}`);
            return;
          }
          rt.setStatus(`Catch: ${Math.round(progress * 100)}%`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0284c7', '#0c4a6e', 'rgba(14,165,233,0.18)');
          drawRoundedBox(c, W / 2 - 34, 120, 68, 410, 14, '#0f172a', '#bae6fd');
          drawRoundedBox(c, W / 2 - 28, barY - 45, 56, 90, 10, '#22c55e', '#86efac', 'rgba(34,197,94,0.35)');
          drawBadgeText(c, '🐟', W / 2, fishY, '#fff', 32);
          drawRoundedBox(c, 70, 560, 280, 18, 9, '#0f172a', '#475569');
          drawRoundedBox(c, 70, 560, Math.max(12, 280 * progress), 18, 9, '#facc15', '#fff', '#facc15');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
];

