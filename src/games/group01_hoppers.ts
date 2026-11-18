import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCircle,
  drawGlowLine,
  drawGradientBg,
  drawLives,
  drawRoundedBox,
  drawStarfield,
  FloatingPopup,
  rand,
  spawnBurst,
  spawnPopup,
  updateAndDrawBursts,
  updateAndDrawPopups,
} from '../game/engineHelpers';

export const GROUP_01_HOPPERS: MiniGameDef[] = [
  {
    id: 'squirrel-acorn-hop',
    num: 1,
    title: 'Squirrel Acorn Hop',
    icon: '🐿️',
    category: 'hoppers',
    color: '#22c55e',
    controlsHint: 'Drag left/right to hop on branches & dodge rotten acorns',
    desc: 'Hop upward between branches, grab golden acorns, and dodge hazards.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = H - 120;
      let vy = -500;
      let score = 0;
      let camY = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const plats = Array.from({ length: 12 }, (_, i) => ({
        x: rand(35, W - 115),
        y: H - 70 - i * 54,
        w: 84,
        mv: i > 3 && i % 3 === 0 ? rand(-75, 75) : 0,
      }));
      const acorns: { x: number; y: number; bad: boolean }[] = [
        { x: 160, y: 120, bad: true },
        { x: 280, y: -40, bad: false },
      ];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) px += clamp((inp.x - px) * 10, -340, 340) * dt;
          px = clamp(px, 20, W - 20);
          vy += 980 * dt;
          py += vy * dt;

          if (vy > 0) {
            for (const p of plats) {
              if (px >= p.x - 10 && px <= p.x + p.w + 10 && py >= p.y - 14 && py <= p.y + 14) {
                vy = -560;
                py = p.y - 10;
                rt.sfx.tap();
                spawnBurst(bursts, px, p.y, '#86efac', 7);
                break;
              }
            }
          }
          for (const p of plats) {
            if (p.mv) {
              p.x += p.mv * dt;
              if (p.x < 12 || p.x + p.w > W - 12) {
                p.x = clamp(p.x, 12, W - 12 - p.w);
                p.mv *= -1;
              }
            }
          }
          if (py < H * 0.42) {
            const dy = H * 0.42 - py;
            py = H * 0.42;
            camY += dy;
            score = Math.max(score, Math.floor(camY / 6));
            rt.setScore(score);
            for (const p of plats) {
              p.y += dy;
              if (p.y > H + 20) {
                p.y -= 12 * 54;
                p.x = rand(20, W - 104);
              }
            }
            for (const a of acorns) a.y += dy;
          }
          for (const a of acorns) {
            a.y += (a.bad ? 160 : 95) * dt;
            if (Math.hypot(a.x - px, a.y - py) < 24) {
              if (a.bad) {
                spawnBurst(bursts, a.x, a.y, '#ef4444', 14);
                rt.sfx.hit();
                rt.endGame(score, `Hit by a rotten acorn at ${score} pt!`);
                return;
              } else {
                score += 40;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, a.x, a.y, '#facc15', 12);
                spawnPopup(popups, a.x, a.y - 10, '+40', '#fde047');
                a.y = -30;
                a.x = rand(30, W - 30);
              }
            }
            if (a.y > H + 30) {
              a.y = -rand(20, 120);
              a.x = rand(30, W - 30);
            }
          }
          if (py > H + 35) {
            rt.sfx.hit();
            rt.endGame(score, `Fell down at ${score} pt!`);
          }
          rt.setStatus(`Height: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#064e3b', '#0f172a', 'rgba(34, 197, 94, 0.14)');
          for (const p of plats) {
            drawRoundedBox(c, p.x, p.y, p.w, 12, 6, p.mv ? '#fbbf24' : '#84cc16', p.mv ? '#fef08a' : '#bef264');
          }
          for (const a of acorns) {
            drawBadgeText(c, a.bad ? '💣' : '🌰', a.x, a.y, '#fff', 22);
          }
          drawBadgeText(c, '🐿️', px, py, '#fff', 32);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'penguin-ice-slide',
    num: 2,
    title: 'Penguin Ice Slide',
    icon: '🐧',
    category: 'hoppers',
    color: '#38bdf8',
    controlsHint: 'Hold to dive down slopes & launch high over orcas!',
    desc: 'Slide across icy hills, catch big air, and land smoothly on slopes.',
    create(rt): MiniGameInstance {
      let dist = 0;
      let py = 260;
      let vy = 0;
      let speed = 220;
      let score = 0;
      const groundAt = (x: number) => 380 + Math.sin(x * 0.011) * 75 + Math.cos(x * 0.023) * 35;
      const bursts: Burst[] = [];
      let lastDt = 0.016;
      const popups: FloatingPopup[] = [];
      let orcaX = 520;
      return {
        update(dt, inp) {
          lastDt = dt;
          dist += speed * dt;
          if (inp.down) vy += 1350 * dt;
          vy += 580 * dt;
          py += vy * dt;
          const gy = groundAt(dist + 95);
          if (py >= gy) {
            const slope = groundAt(dist + 100) - groundAt(dist + 90);
            if (vy > 320 && slope < -2) {
              speed = Math.min(480, speed + 45);
              rt.sfx.score();
              spawnBurst(bursts, 95, gy, '#bae6fd', 12);
              spawnPopup(popups, 95, gy - 28, 'BOOST!', '#38bdf8', 16);
            } else if (vy > 480 && slope > 4) {
              speed = Math.max(150, speed - 55);
              rt.sfx.hit();
              spawnBurst(bursts, 95, gy, '#f8fafc', 8);
            }
            py = gy;
            vy = Math.min(vy, slope * 28);
          } else {
            speed = Math.min(500, speed + 15 * dt);
          }
          orcaX -= speed * dt;
          if (orcaX < -50) orcaX = W + rand(120, 300);
          const orcaY = groundAt(dist + orcaX) - 14;
          if (Math.abs(orcaX - 95) < 28 && Math.abs(py - orcaY) < 28) {
            rt.sfx.explode();
            rt.endGame(score, `Orca snapped you at ${score}m!`);
            return;
          }
          score = Math.floor(dist / 12);
          rt.setScore(score);
          rt.setStatus(`Speed: ${Math.round(speed)} km/h`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#e0f2fe', 'rgba(186, 230, 253, 0.25)');
          c.fillStyle = '#f0f9ff';
          c.beginPath();
          c.moveTo(0, H);
          for (let x = 0; x <= W; x += 8) c.lineTo(x, groundAt(dist + x));
          c.lineTo(W, H);
          c.closePath();
          c.fill();
          c.strokeStyle = '#38bdf8';
          c.lineWidth = 4;
          c.beginPath();
          for (let x = 0; x <= W; x += 8) {
            if (x === 0) c.moveTo(0, groundAt(dist));
            else c.lineTo(x, groundAt(dist + x));
          }
          c.stroke();
          const oy = groundAt(dist + orcaX) - 10;
          drawBadgeText(c, '🐋', orcaX, oy, '#fff', 36);
          drawBadgeText(c, '🐧', 95, py - 12, '#fff', 32);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'monkey-vine-swing',
    num: 3,
    title: 'Monkey Vine Swing',
    icon: '🐒',
    category: 'hoppers',
    color: '#16a34a',
    controlsHint: 'Hold to grab a vine, release to fly forward!',
    desc: 'Swing from vine to vine above the jungle river.',
    create(rt): MiniGameInstance {
      let camX = 0;
      let mx = 80;
      let my = 220;
      let vx = 170;
      let vy = -120;
      let grabbed: { x: number; y: number; len: number } | null = null;
      let score = 0;
      let lastDt = 0.016;
      const anchors = Array.from({ length: 8 }, (_, i) => ({ x: 110 + i * 165, y: 70 + (i % 3) * 28 }));
      const bursts: Burst[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            let best = anchors[0];
            let bestD = Infinity;
            for (const a of anchors) {
              const d = Math.hypot(a.x - mx, a.y - my);
              if (d < bestD && a.x >= mx - 60) {
                bestD = d;
                best = a;
              }
            }
            if (bestD < 250) {
              grabbed = { x: best.x, y: best.y, len: Math.max(85, bestD) };
              rt.sfx.tap();
            }
          }
          if (!inp.down || inp.justReleased) grabbed = null;

          if (grabbed) {
            vy += 760 * dt;
            mx += vx * dt;
            my += vy * dt;
            const dx = mx - grabbed.x;
            const dy = my - grabbed.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const nx = dx / dist;
            const ny = dy / dist;
            mx = grabbed.x + nx * grabbed.len;
            my = grabbed.y + ny * grabbed.len;
            const dot = vx * nx + vy * ny;
            if (dot > 0) {
              vx -= dot * nx;
              vy -= dot * ny;
            }
            vx += 48 * dt;
          } else {
            vy += 760 * dt;
            mx += vx * dt;
            my += vy * dt;
          }

          if (mx - camX > 150) camX = mx - 150;
          score = Math.max(score, Math.floor(mx / 18));
          rt.setScore(score);
          for (const a of anchors) {
            if (a.x < camX - 90) {
              a.x += 8 * 165;
              a.y = 65 + Math.random() * 65;
              spawnBurst(bursts, mx - camX, my, '#facc15', 6);
              rt.sfx.score();
            }
          }
          if (my > H - 20 || my < -80) {
            rt.sfx.explode();
            rt.endGame(score, `Fell into the swamp at ${score}m!`);
          }
          rt.setStatus(grabbed ? 'Swinging! Release at peak' : 'Tap & hold to grab vine');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#022c22', 'rgba(34, 197, 94, 0.14)');
          drawRoundedBox(c, 0, H - 36, W, 36, 0, '#0369a1');
          for (const a of anchors) {
            const sx = a.x - camX;
            drawCircle(c, sx, a.y, 9, '#a3e635', '#ecfccb', '#84cc16');
            if (grabbed && grabbed.x === a.x) {
              drawGlowLine(c, sx, a.y, mx - camX, my, '#84cc16', 4, '#bef264');
            }
          }
          drawBadgeText(c, '🐒', mx - camX, my, '#fff', 32);
          updateAndDrawBursts(c, bursts, lastDt);
        },
      };
    },
  },
  {
    id: 'goat-mountain-dash',
    num: 4,
    title: 'Goat Mountain Dash',
    icon: '🐐',
    category: 'hoppers',
    color: '#a3a3a3',
    controlsHint: 'Tap LEFT or RIGHT to hop between mountain ridges',
    desc: 'Climb steep twin ridges and dodge falling boulders.',
    create(rt): MiniGameInstance {
      let lane: 0 | 1 = 0;
      let climb = 0;
      let speed = 230;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const rocks = Array.from({ length: 5 }, (_, i) => ({
        lane: (i % 2) as 0 | 1,
        y: -i * 150 - 80,
        isCoin: i % 3 === 1,
      }));
      const laneX = (l: 0 | 1) => (l === 0 ? 125 : 295);
      const safeRespawnY = (skip: typeof rocks[number], targetLane: 0 | 1) => {
        let ny = -rand(60, 180);
        for (let tries = 0; tries < 6; tries++) {
          const blocked = rocks.some(
            (o) => o !== skip && !o.isCoin && o.lane !== targetLane && Math.abs(o.y - ny) < 88
          );
          if (!blocked) break;
          ny -= 95;
        }
        return ny;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            lane = inp.x < W / 2 ? 0 : 1;
            rt.sfx.tap();
          }
          speed = Math.min(480, speed + 10 * dt);
          climb += speed * dt;
          const score = Math.floor(climb / 14);
          rt.setScore(score);
          rt.setStatus(`Height: ${score}m`);
          for (const rk of rocks) {
            rk.y += speed * dt;
            if (rk.lane === lane && Math.abs(rk.y - 500) < 34) {
              if (rk.isCoin) {
                climb += 350;
                spawnBurst(bursts, laneX(lane), 500, '#facc15', 10);
                spawnPopup(popups, laneX(lane), 470, '+25m', '#fde047');
                rk.lane = Math.random() < 0.5 ? 0 : 1;
                rk.y = safeRespawnY(rk, rk.lane);
                rt.sfx.score();
              } else {
                rt.sfx.explode();
                rt.endGame(score, `Hit by a boulder at ${score}m!`);
                return;
              }
            }
            if (rk.y > H + 40) {
              rk.lane = Math.random() < 0.5 ? 0 : 1;
              rk.isCoin = Math.random() < 0.28;
              rk.y = rk.isCoin ? -rand(60, 180) : safeRespawnY(rk, rk.lane);
            }
          }
        },
        onKey(k) {
          if (k === 'ArrowLeft') lane = 0;
          if (k === 'ArrowRight') lane = 1;
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#334155', '#1e293b');
          drawRoundedBox(c, 85, 0, 80, H, 0, '#475569', '#64748b');
          drawRoundedBox(c, 255, 0, 80, H, 0, '#475569', '#64748b');
          for (const rk of rocks) {
            drawBadgeText(c, rk.isCoin ? '⭐' : '🪨', laneX(rk.lane), rk.y, '#fff', 32);
          }
          drawBadgeText(c, '🐐', laneX(lane), 500, '#fff', 36);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'crab-beach-scuttle',
    num: 5,
    title: 'Crab Beach Scuttle',
    icon: '🦀',
    category: 'hoppers',
    color: '#fb923c',
    controlsHint: 'Drag horizontally across the sand to catch pearls & dodge gulls',
    desc: 'Scuttle across the beach collecting pearls while dodging seagulls.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const items = Array.from({ length: 7 }, (_, i) => ({
        x: rand(30, W - 30),
        y: -i * 95,
        vy: rand(170, 260),
        bad: i % 2 === 0,
      }));
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) px = clamp(inp.x, 26, W - 26);
          for (const it of items) {
            it.y += (it.vy + score * 0.5) * dt;
            if (Math.hypot(it.x - px, it.y - 555) < 30) {
              if (it.bad) {
                lives--;
                rt.sfx.hit();
                spawnBurst(bursts, px, 555, '#ef4444', 10);
                it.y = -50;
                it.x = rand(30, W - 30);
                if (lives <= 0) {
                  rt.endGame(score, `Collected ${score} pearl points!`);
                  return;
                }
              } else {
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, it.x, it.y, '#fef08a', 10);
                spawnPopup(popups, it.x, it.y - 12, '+25', '#fde047');
                it.y = -40;
                it.x = rand(30, W - 30);
              }
            }
            if (it.y > H + 30) {
              it.y = -30;
              it.x = rand(30, W - 30);
            }
          }
          rt.setStatus(`Lives: ${lives} · Pearls: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0ea5e9', '#fde68a');
          drawRoundedBox(c, 0, 490, W, 150, 0, '#fcd34d');
          for (const it of items) drawBadgeText(c, it.bad ? '🕊️' : '🦪', it.x, it.y, '#fff', 30);
          drawBadgeText(c, '🦀', px, 555, '#fff', 38);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'chameleon-tongue-catch',
    num: 6,
    title: 'Chameleon Tongue',
    icon: '🦎',
    category: 'hoppers',
    color: '#84cc16',
    controlsHint: 'Tap directly on flies to snap your tongue! Avoid wasps.',
    desc: 'Fast tongue reflexes: catch as many bugs as possible in 35s.',
    create(rt): MiniGameInstance {
      let score = 0;
      let timer = 35;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let tongueTo: { x: number; y: number; life: number } | null = null;
      const bugs = Array.from({ length: 8 }, (_, i) => ({
        x: rand(40, W - 40),
        y: rand(90, 430),
        vx: rand(-110, 110),
        vy: rand(-70, 70),
        wasp: i < 2,
      }));
      return {
        update(dt, inp) {
          lastDt = dt;
          timer -= dt;
          if (timer <= 0) {
            rt.sfx.win();
            rt.endGame(score, `Final score: ${score} pt in 35s!`);
            return;
          }
          if (tongueTo) {
            tongueTo.life -= dt;
            if (tongueTo.life <= 0) tongueTo = null;
          }
          for (const b of bugs) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 30 || b.x > W - 30) {
              b.x = clamp(b.x, 30, W - 30);
              b.vx *= -1;
            }
            if (b.y < 80 || b.y > 440) {
              b.y = clamp(b.y, 80, 440);
              b.vy *= -1;
            }
          }
          if (inp.justPressed) {
            tongueTo = { x: inp.x, y: inp.y, life: 0.14 };
            let hitAny = false;
            for (const b of bugs) {
              if (Math.hypot(b.x - inp.x, b.y - inp.y) < 36) {
                hitAny = true;
                if (b.wasp) {
                  score = Math.max(0, score - 40);
                  rt.sfx.hit();
                  spawnBurst(bursts, b.x, b.y, '#ef4444', 10);
                  spawnPopup(popups, b.x, b.y, '-40', '#fca5a5');
                } else {
                  score += 30;
                  rt.sfx.score();
                  spawnBurst(bursts, b.x, b.y, '#84cc16', 10);
                  spawnPopup(popups, b.x, b.y, '+30', '#bef264');
                }
                b.x = rand(40, W - 40);
                b.y = rand(90, 420);
              }
            }
            if (!hitAny) rt.sfx.tap();
            rt.setScore(score);
          }
          rt.setStatus(`Time: ${Math.ceil(timer)}s · Don't tap 🐝!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e3a1e', '#0f172a');
          if (tongueTo) {
            drawGlowLine(c, W / 2, 560, tongueTo.x, tongueTo.y, '#f472b6', 7, '#ec4899');
            drawCircle(c, tongueTo.x, tongueTo.y, 7, '#f472b6');
          }
          for (const b of bugs) drawBadgeText(c, b.wasp ? '🐝' : '🪰', b.x, b.y, '#fff', 30);
          drawBadgeText(c, '🦎', W / 2, 565, '#fff', 44);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'hamster-wheel-turbo',
    num: 7,
    title: 'Hamster Wheel Turbo',
    icon: '🐹',
    category: 'hoppers',
    color: '#f59e0b',
    controlsHint: 'Tap whenever the marker enters the GREEN zone for turbo power!',
    desc: 'Rhythm wheel running: perfect taps build speed without wiping out.',
    create(rt): MiniGameInstance {
      let ang = 0;
      let speed = 2.4;
      let score = 0;
      let lives = 3;
      let target = 1.2;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          ang = (ang + speed * dt) % (Math.PI * 2);
          if (inp.justPressed) {
            const diff = Math.abs(Math.atan2(Math.sin(ang - target), Math.cos(ang - target)));
            if (diff < 0.48) {
              const perfect = diff < 0.2;
              const pts = perfect ? 50 : 25;
              score += pts;
              speed = Math.min(6.4, speed + 0.28);
              const px = W / 2 + Math.cos(ang) * 140;
              const py = 320 + Math.sin(ang) * 140;
              spawnBurst(bursts, px, py, perfect ? '#facc15' : '#22c55e', 12);
              spawnPopup(popups, px, py - 15, perfect ? 'TURBO +50!' : '+25', perfect ? '#fde047' : '#86efac');
              target = rand(0, Math.PI * 2);
              rt.setScore(score);
              rt.sfx.score();
            } else {
              lives--;
              speed = Math.max(2.0, speed - 0.8);
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Flung off the wheel at ${score}W!`);
                return;
              }
            }
          }
          rt.setStatus(`Power: ${score} Watts`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#451a03', '#0f172a', 'rgba(245, 158, 11, 0.16)');
          const cx = W / 2;
          const cy = 320;
          const rad = 140;
          c.strokeStyle = '#334155';
          c.lineWidth = 24;
          c.beginPath();
          c.arc(cx, cy, rad, 0, Math.PI * 2);
          c.stroke();

          c.save();
          c.shadowColor = '#22c55e';
          c.shadowBlur = 14;
          c.strokeStyle = '#22c55e';
          c.lineWidth = 24;
          c.beginPath();
          c.arc(cx, cy, rad, target - 0.45, target + 0.45);
          c.stroke();
          c.restore();

          const px = cx + Math.cos(ang) * rad;
          const py = cy + Math.sin(ang) * rad;
          drawCircle(c, px, py, 14, '#fde047', '#fff', '#facc15');
          drawBadgeText(c, '🐹', cx, cy, '#fff', 56);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'owl-night-glide',
    num: 8,
    title: 'Owl Night Glide',
    icon: '🦉',
    category: 'hoppers',
    color: '#6366f1',
    controlsHint: 'Hold to climb on night thermals, release to glide',
    desc: 'Glide silently through the moonlit forest between hollow trunks.',
    create(rt): MiniGameInstance {
      let py = 300;
      let vy = 0;
      let score = 0;
      let t = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const gates = Array.from({ length: 3 }, (_, i) => ({
        x: W + i * 210,
        gapY: rand(150, 470),
        passed: false,
      }));
      return {
        update(dt, inp) {
          lastDt = dt;
          t += dt;
          vy += (inp.down ? -780 : 620) * dt;
          vy = clamp(vy, -360, 420);
          py += vy * dt;
          for (const g of gates) {
            g.x -= (170 + score * 2) * dt;
            if (!g.passed && g.x < 95) {
              g.passed = true;
              score += 10;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, 95, py, '#a5b4fc', 8);
              spawnPopup(popups, 115, py - 20, '+10', '#c7d2fe');
            }
            if (Math.abs(g.x - 95) < 34 && (py < g.gapY - 72 || py > g.gapY + 72)) {
              rt.sfx.hit();
              rt.endGame(score, `Crashed into a tree (${score} pt)!`);
              return;
            }
            if (g.x < -50) {
              g.x += 630;
              g.gapY = rand(140, 480);
              g.passed = false;
            }
          }
          if (py < 15 || py > H - 15) {
            rt.sfx.hit();
            rt.endGame(score, `Veered off course (${score} pt)!`);
          }
          rt.setStatus(`Flight Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e1b4b', 'rgba(99, 102, 241, 0.16)');
          drawStarfield(c, t, 30, 18);
          drawCircle(c, 330, 100, 32, '#fef08a', undefined, '#fef08a');
          for (const g of gates) {
            drawRoundedBox(c, g.x - 24, 0, 48, g.gapY - 74, 8, '#3f2e21', '#78350f');
            drawRoundedBox(c, g.x - 24, g.gapY + 74, 48, H - g.gapY, 8, '#3f2e21', '#78350f');
          }
          drawBadgeText(c, '🦉', 95, py, '#fff', 34);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'kangaroo-outback-vault',
    num: 9,
    title: 'Kangaroo Outback Vault',
    icon: '🦘',
    category: 'hoppers',
    color: '#d97706',
    controlsHint: 'Hold on the ground to charge jump power & release over canyons',
    desc: 'Charge huge leaps across the outback and land on rock plateaus.',
    create(rt): MiniGameInstance {
      let charge = 0;
      let jumping = false;
      const kx = 85;
      let ky = 430;
      let vy = 0;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const pads = [
        { x: 40, w: 120 },
        { x: 240, w: 100 },
        { x: 430, w: 95 },
        { x: 610, w: 90 },
      ];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (!jumping) {
            if (inp.down) charge = clamp(charge + dt * 1.4, 0, 1);
            if (inp.justReleased) {
              if (charge > 0.08) {
                jumping = true;
                vy = -440 - charge * 360;
                rt.sfx.tap();
                spawnBurst(bursts, kx, 430, '#fde68a', 8);
              } else {
                charge = 0;
              }
            }
          } else {
            const hSpeed = 190 + charge * 260;
            for (const p of pads) p.x -= hSpeed * dt;
            vy += 1050 * dt;
            ky += vy * dt;
            if (ky >= 430 && ky <= 460 && vy > 0) {
              const onPad = pads.find((p) => kx >= p.x - 10 && kx <= p.x + p.w + 10);
              if (onPad) {
                ky = 430;
                jumping = false;
                charge = 0;
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, kx, 430, '#facc15', 10);
                spawnPopup(popups, kx, 395, '+25', '#fde047');
              }
            }
            if (ky > H + 30) {
              rt.sfx.explode();
              rt.endGame(score, `Fell into the canyon (${score} pt)!`);
              return;
            }
          }
          if (pads[0].x + pads[0].w < -20) {
            pads.shift();
            const last = pads[pads.length - 1];
            pads.push({ x: last.x + rand(155, 250), w: rand(75, 115) });
          }
          rt.setStatus(jumping ? 'Soaring!' : 'Hold & release to jump');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#ea580c', '#451a03', 'rgba(251, 146, 60, 0.22)');
          for (const p of pads) drawRoundedBox(c, p.x, 430, p.w, 210, 8, '#b45309', '#fde68a');
          drawBadgeText(c, '🦘', kx, ky - 18, '#fff', 36);
          if (charge > 0 && !jumping) {
            drawRoundedBox(c, 50, 560, 320, 18, 9, 'rgba(15, 23, 42, 0.7)', 'rgba(255,255,255,0.25)');
            drawRoundedBox(c, 50, 560, 320 * charge, 18, 9, '#facc15', '#fff', '#facc15');
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'duck-pond-surf',
    num: 10,
    title: 'Duck Pond Surf',
    icon: '🦆',
    category: 'hoppers',
    color: '#06b6d4',
    controlsHint: 'Tap top, middle, or bottom lane to grab bread & dodge logs!',
    desc: 'Surf across 3 pond lanes, snag crumbs, and dodge drifting logs.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const laneY = (l: number) => 220 + l * 115;
      const obs = Array.from({ length: 6 }, (_, i) => ({
        x: W + i * 140,
        lane: i % 3,
        good: i % 2 === 0,
      }));
      const respawnItem = (o: typeof obs[number]) => {
        let nx = W + rand(80, 220);
        const nl = Math.floor(Math.random() * 3);
        if (!o.good) {
          for (let tries = 0; tries < 5; tries++) {
            const wall = obs.some((other) => other !== o && !other.good && other.lane !== nl && Math.abs(other.x - nx) < 85);
            if (!wall) break;
            nx += 95;
          }
        }
        o.x = nx;
        o.lane = nl;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            lane = clamp(Math.floor((inp.y - 160) / 115), 0, 2);
            rt.sfx.tap();
          }
          for (const o of obs) {
            o.x -= (210 + score * 0.6) * dt;
            if (o.lane === lane && Math.abs(o.x - 90) < 30) {
              if (o.good) {
                score += 20;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, 90, laneY(lane), '#fde047', 8);
                spawnPopup(popups, 90, laneY(lane) - 18, '+20', '#fde047');
              } else {
                lives--;
                rt.sfx.hit();
                spawnBurst(bursts, 90, laneY(lane), '#ef4444', 10);
                if (lives <= 0) {
                  rt.endGame(score, `Scored ${score} points on the waves!`);
                  return;
                }
              }
              respawnItem(o);
            }
            if (o.x < -40) respawnItem(o);
          }
          rt.setStatus(`Wave Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0284c7', '#0c4a6e', 'rgba(56, 189, 248, 0.18)');
          for (let l = 0; l < 3; l++) {
            c.strokeStyle = 'rgba(255,255,255,0.22)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(0, laneY(l) + 20);
            c.lineTo(W, laneY(l) + 20);
            c.stroke();
          }
          for (const o of obs) {
            drawBadgeText(c, o.good ? '🍞' : '🪵', o.x, laneY(o.lane), '#fff', 30);
          }
          drawBadgeText(c, '🦆', 90, laneY(lane), '#fff', 36);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
];
