import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCircle,
  drawGradientBg,
  drawLives,
  drawRoundedBox,
  rand,
  spawnBurst,
  updateAndDrawBursts,
} from '../game/engineHelpers';

export const GROUP_04_TIMING: MiniGameDef[] = [
  {
    id: 'drone-swarm-defender',
    num: 31,
    title: 'Drone Swarm Defender',
    icon: '🤖',
    category: 'timing',
    color: '#06b6d4',
    controlsHint: 'Tap incoming EMP drones before they hit your reactor!',
    desc: 'Defend the central core by zapping incoming drone swarms.',
    create(rt): MiniGameInstance {
      let score = 0;
      let lives = 3;
      const drones: { x: number; y: number; vx: number; vy: number }[] = [];
      const bursts: Burst[] = [];
      let spawnT = 0.4;
      const cx = W / 2;
      const cy = H / 2;
      return {
        update(dt, inp) {
          spawnT -= dt;
          if (spawnT <= 0) {
            const a = rand(0, Math.PI * 2);
            const spd = 75 + score * 0.2;
            const sx = cx + Math.cos(a) * 280;
            const sy = cy + Math.sin(a) * 280;
            drones.push({ x: sx, y: sy, vx: -Math.cos(a) * spd, vy: -Math.sin(a) * spd });
            spawnT = Math.max(0.28, 0.9 - score * 0.002);
          }
          if (inp.justPressed) {
            let hit = false;
            for (let i = drones.length - 1; i >= 0; i--) {
              if (Math.hypot(drones[i].x - inp.x, drones[i].y - inp.y) < 42) {
                spawnBurst(bursts, drones[i].x, drones[i].y, '#22d3ee', 10);
                drones.splice(i, 1);
                score += 20;
                hit = true;
              }
            }
            if (hit) {
              rt.setScore(score);
              rt.sfx.score();
            } else rt.sfx.tap();
          }
          for (let i = drones.length - 1; i >= 0; i--) {
            drones[i].x += drones[i].vx * dt;
            drones[i].y += drones[i].vy * dt;
            if (Math.hypot(drones[i].x - cx, drones[i].y - cy) < 34) {
              drones.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Reactor overloaded! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Drones zapped: ${score / 20}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#042f2e', '#090d16');
          drawCircle(c, cx, cy, 32, '#06b6d4', '#cffafe');
          drawBadgeText(c, '⚡', cx, cy, '#fff', 32);
          for (const d of drones) drawBadgeText(c, '🛸', d.x, d.y, '#fff', 28);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, 0.016);
        },
      };
    },
  },
  {
    id: 'pixel-mortar-strike',
    num: 32,
    title: 'Pixel Mortar Strike',
    icon: '💥',
    category: 'timing',
    color: '#84cc16',
    controlsHint: 'Hold to charge mortar range & release on approaching tanks!',
    desc: 'Defend the trench by timing your mortar charge.',
    create(rt): MiniGameInstance {
      let charge = 0;
      let shells: { x: number; y: number; vx: number; vy: number }[] = [];
      let tanks: { x: number; spd: number }[] = [{ x: 310, spd: 28 }];
      let score = 0;
      let lives = 3;
      let spawnT = 2.0;
      return {
        update(dt, inp) {
          if (inp.down) charge = clamp(charge + dt * 0.9, 0, 1);
          if (inp.justReleased && charge > 0.05) {
            shells.push({ x: 55, y: 470, vx: 120 + charge * 260, vy: -420 - charge * 180 });
            charge = 0;
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            tanks.push({ x: W + 20, spd: 26 + score * 0.1 });
            spawnT = Math.max(1.1, 2.5 - score * 0.004);
          }
          for (let i = shells.length - 1; i >= 0; i--) {
            const s = shells[i];
            s.vy += 650 * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.y >= 490) {
              for (let j = tanks.length - 1; j >= 0; j--) {
                if (Math.abs(s.x - tanks[j].x) < 42) {
                  tanks.splice(j, 1);
                  score += 40;
                  rt.setScore(score);
                  rt.sfx.explode();
                }
              }
              shells.splice(i, 1);
            }
          }
          for (let i = tanks.length - 1; i >= 0; i--) {
            tanks[i].x -= tanks[i].spd * dt;
            if (tanks[i].x < 75) {
              tanks.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Trench lost! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus('Hold longer = shoot farther');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1c1917', '#090d16');
          drawRoundedBox(c, 0, 495, W, 145, 0, '#3f6212');
          drawBadgeText(c, '🛡️', 45, 478, '#fff', 36);
          for (const t of tanks) drawBadgeText(c, '🚜', t.x, 478, '#fff', 34);
          for (const s of shells) drawCircle(c, s.x, s.y, 7, '#facc15', '#fff');
          if (charge > 0) drawRoundedBox(c, 50, 560, 320 * charge, 18, 9, '#ef4444', '#fff');
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'stick-hero-bridge',
    num: 33,
    title: 'Stick Hero Bridge',
    icon: '🌉',
    category: 'timing',
    color: '#ef4444',
    controlsHint: 'Hold to grow the bridge; release when it matches the gap!',
    desc: 'Classic precision bridge challenge: too short or too long and you fall.',
    create(rt): MiniGameInstance {
      let state: 'idle' | 'grow' | 'fall' | 'walk' = 'idle';
      let stickLen = 0;
      let stickAng = -Math.PI / 2;
      let heroX = 75;
      let p1 = { x: 20, w: 70 };
      let p2 = { x: 185, w: 68 };
      let score = 0;
      return {
        update(dt, inp) {
          if (state === 'idle' && inp.justPressed) {
            state = 'grow';
            stickLen = 4;
            stickAng = -Math.PI / 2;
          } else if (state === 'grow') {
            if (inp.down) stickLen += 240 * dt;
            else {
              state = 'fall';
              rt.sfx.tap();
            }
          } else if (state === 'fall') {
            stickAng += 5.5 * dt;
            if (stickAng >= 0) {
              stickAng = 0;
              state = 'walk';
            }
          } else if (state === 'walk') {
            heroX += 210 * dt;
            const bridgeEnd = p1.x + p1.w + stickLen;
            if (heroX >= bridgeEnd) {
              if (bridgeEnd >= p2.x && bridgeEnd <= p2.x + p2.w) {
                score += Math.abs(bridgeEnd - (p2.x + p2.w / 2)) < 12 ? 40 : 20;
                rt.setScore(score);
                rt.sfx.score();
                p1 = { x: 20, w: p2.w };
                p2 = { x: rand(135, 290), w: rand(42, 74) };
                heroX = p1.x + p1.w - 14;
                stickLen = 0;
                state = 'idle';
              } else {
                rt.sfx.explode();
                rt.endGame(score, `Bridge ${bridgeEnd < p2.x ? 'too short' : 'too long'}! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Bridges crossed · ${score} pt`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b');
          drawRoundedBox(c, p1.x, 420, p1.w, 220, 4, '#090d16', '#38bdf8');
          drawRoundedBox(c, p2.x, 420, p2.w, 220, 4, '#090d16', '#facc15');
          drawCircle(c, p2.x + p2.w / 2, 424, 5, '#ef4444');
          if (stickLen > 0) {
            const ox = p1.x + p1.w;
            c.strokeStyle = '#fde047';
            c.lineWidth = 6;
            c.beginPath();
            c.moveTo(ox, 420);
            c.lineTo(ox + Math.cos(stickAng) * stickLen, 420 + Math.sin(stickAng) * stickLen);
            c.stroke();
          }
          drawBadgeText(c, '🥷', heroX, 400, '#fff', 32);
        },
      };
    },
  },
  {
    id: 'stack-tower-2d',
    num: 34,
    title: 'Stack Tower 2D',
    icon: '🧱',
    category: 'timing',
    color: '#a855f7',
    controlsHint: 'Tap to drop the sliding block cleanly onto the tower!',
    desc: 'Build a skyscraper sky-high — overhangs get sliced off!',
    create(rt): MiniGameInstance {
      const blocks: { x: number; w: number; color: string }[] = [{ x: 110, w: 200, color: '#8b5cf6' }];
      let curX = 40;
      let curW = 200;
      let vx = 175;
      let score = 0;
      const palette = ['#ec4899', '#8b5cf6', '#38bdf8', '#22c55e', '#facc15', '#fb923c'];
      return {
        update(dt, inp) {
          curX += vx * dt;
          if (curX < 10) {
            curX = 10;
            vx = Math.abs(vx);
          } else if (curX + curW > W - 10) {
            curX = W - 10 - curW;
            vx = -Math.abs(vx);
          }
          if (inp.justPressed) {
            const top = blocks[blocks.length - 1];
            const left = Math.max(curX, top.x);
            const right = Math.min(curX + curW, top.x + top.w);
            const overlap = right - left;
            if (overlap <= 4) {
              rt.sfx.explode();
              rt.endGame(score, `Tower collapsed at floor ${blocks.length}!`);
              return;
            }
            const perfect = Math.abs(overlap - top.w) < 6;
            const nextW = perfect ? top.w : overlap;
            const nextX = perfect ? top.x : left;
            blocks.push({ x: nextX, w: nextW, color: palette[blocks.length % palette.length] });
            curW = nextW;
            vx = (vx > 0 ? 1 : -1) * Math.min(390, Math.abs(vx) + 6);
            score += perfect ? 30 : 15;
            rt.setScore(score);
            rt.sfx.score();
          }
          rt.setStatus(`Floors: ${blocks.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16');
          const visibleStart = Math.max(0, blocks.length - 12);
          for (let i = visibleStart; i < blocks.length; i++) {
            const idxFromTop = blocks.length - 1 - i;
            const y = 520 - (12 - idxFromTop) * 30;
            drawRoundedBox(c, blocks[i].x, y, blocks[i].w, 26, 5, blocks[i].color, '#fff');
          }
          drawRoundedBox(c, curX, 130, curW, 26, 5, palette[blocks.length % palette.length], '#fde047');
        },
      };
    },
  },
  {
    id: 'color-switch-ring',
    num: 35,
    title: 'Color Switch Ring',
    icon: '🎨',
    category: 'timing',
    color: '#ec4899',
    controlsHint: 'Tap to bounce the ball through the matching color segment!',
    desc: 'Time your jumps carefully through spinning color rings.',
    create(rt): MiniGameInstance {
      const cols = ['#ef4444', '#38bdf8', '#facc15', '#22c55e'];
      let ballColorIdx = 0;
      let py = 460;
      let vy = -120;
      let score = 0;
      const rings = [
        { y: 270, ang: 0, passed: false },
        { y: 40, ang: 1.5, passed: false },
      ];
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            vy = -330;
            rt.sfx.tap();
          }
          vy += 760 * dt;
          py += vy * dt;
          if (py < 240) {
            const d = 240 - py;
            py = 240;
            for (const rg of rings) {
              rg.y += d;
              if (rg.y > H + 110) {
                rg.y -= 480;
                rg.passed = false;
                ballColorIdx = Math.floor(Math.random() * 4);
              }
            }
          }
          for (const rg of rings) {
            rg.ang = (rg.ang + 2.0 * dt) % (Math.PI * 2);
            const distFromRim = Math.abs(py - rg.y);
            if (distFromRim > 54 && distFromRim < 74) {
              const hitAngle = py > rg.y ? Math.PI / 2 : (Math.PI * 3) / 2;
              const rel = ((hitAngle - rg.ang) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
              const seg = Math.floor(rel / (Math.PI / 2)) % 4;
              if (seg !== ballColorIdx) {
                rt.sfx.hit();
                rt.endGame(score, `Hit the wrong color at ${score} pt!`);
                return;
              }
            }
            if (!rg.passed && py < rg.y) {
              rg.passed = true;
              score += 25;
              rt.setScore(score);
              rt.sfx.score();
            }
          }
          if (py > H + 30) {
            rt.sfx.hit();
            rt.endGame(score, `Fell down at ${score} pt!`);
          }
          rt.setStatus(`Rings cleared: ${score / 25}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e1b4b');
          for (const rg of rings) {
            for (let i = 0; i < 4; i++) {
              c.strokeStyle = cols[i];
              c.lineWidth = 14;
              c.beginPath();
              c.arc(W / 2, rg.y, 64, rg.ang + i * (Math.PI / 2), rg.ang + (i + 1) * (Math.PI / 2));
              c.stroke();
            }
          }
          drawCircle(c, W / 2, py, 14, cols[ballColorIdx], '#fff');
        },
      };
    },
  },
  {
    id: 'knife-hit-wheel',
    num: 36,
    title: 'Knife Hit Wheel',
    icon: '🔪',
    category: 'timing',
    color: '#fb923c',
    controlsHint: 'Tap to throw knives into the log without hitting other knives!',
    desc: 'Stick every knife into the spinning log without clashing.',
    create(rt): MiniGameInstance {
      let wheelAng = 0;
      let wheelSpeed = 2.0;
      const stuck: number[] = [0.2, 2.3];
      let flyingY: number | null = null;
      let score = 0;
      let stage = 1;
      let left = 6;
      return {
        update(dt, inp) {
          wheelAng = (wheelAng + wheelSpeed * dt) % (Math.PI * 2);
          if (inp.justPressed && flyingY === null) {
            flyingY = 530;
            rt.sfx.tap();
          }
          if (flyingY !== null) {
            flyingY -= 850 * dt;
            if (flyingY <= 295) {
              const hitRel = (Math.PI / 2 - wheelAng + Math.PI * 4) % (Math.PI * 2);
              const clash = stuck.some((a) => Math.abs(Math.atan2(Math.sin(a - hitRel), Math.cos(a - hitRel))) < 0.24);
              if (clash) {
                rt.sfx.explode();
                rt.endGame(score, `Knife clashed on stage ${stage}! Score: ${score}`);
                return;
              }
              stuck.push(hitRel);
              flyingY = null;
              score += 20;
              left--;
              rt.setScore(score);
              rt.sfx.score();
              if (left <= 0) {
                stage++;
                score += 60;
                left = 6 + stage;
                stuck.length = 0;
                stuck.push(0, Math.PI);
                wheelSpeed = (stage % 2 === 0 ? -1 : 1) * Math.min(4.2, 2.0 + stage * 0.3);
                rt.setScore(score);
                rt.sfx.win();
              }
            }
          }
          rt.setStatus(`Stage ${stage} · Knives left: ${left}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#090d16');
          const cx = W / 2;
          const cy = 220;
          for (const a of stuck) {
            const worldA = wheelAng + a;
            c.strokeStyle = '#e2e8f0';
            c.lineWidth = 6;
            c.beginPath();
            c.moveTo(cx + Math.cos(worldA) * 70, cy + Math.sin(worldA) * 70);
            c.lineTo(cx + Math.cos(worldA) * 112, cy + Math.sin(worldA) * 112);
            c.stroke();
          }
          drawCircle(c, cx, cy, 74, '#b45309', '#fde68a');
          drawCircle(c, cx, cy, 56, '#d97706');
          if (flyingY !== null) drawBadgeText(c, '🔪', cx, flyingY, '#fff', 36);
          else drawBadgeText(c, '🔪', cx, 530, '#fff', 36);
        },
      };
    },
  },
  {
    id: 'helix-drop',
    num: 37,
    title: 'Helix Drop',
    icon: '🌀',
    category: 'timing',
    color: '#f43f5e',
    controlsHint: 'Drag left/right to rotate the tower and drop through gaps!',
    desc: 'Bounce down spiral platforms while avoiding red hazard zones.',
    create(rt): MiniGameInstance {
      let rot = 0;
      let ballY = 230;
      let vy = 0;
      let score = 0;
      const rings = Array.from({ length: 5 }, (_, i) => ({
        y: 320 + i * 110,
        gap: i * 1.4,
        bad: i * 1.4 + 2.2,
      }));
      return {
        update(dt, inp) {
          if (inp.down) rot += inp.dx * 0.015;
          vy += 880 * dt;
          ballY += vy * dt;
          for (const rg of rings) {
            if (vy > 0 && Math.abs(ballY - rg.y) < 16) {
              const rel = ((-rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
              const inGap = Math.abs(Math.atan2(Math.sin(rel - rg.gap), Math.cos(rel - rg.gap))) < 0.72;
              const onBad = Math.abs(Math.atan2(Math.sin(rel - rg.bad), Math.cos(rel - rg.bad))) < 0.55;
              if (!inGap) {
                if (onBad) {
                  rt.sfx.explode();
                  rt.endGame(score, `Hit a red hazard at ${score} pt!`);
                  return;
                }
                ballY = rg.y - 16;
                vy = -340;
                rt.sfx.tap();
              }
            }
          }
          if (ballY > 310) {
            const dy = ballY - 310;
            ballY = 310;
            for (const rg of rings) {
              rg.y -= dy;
              if (rg.y < 80) {
                rg.y += 550;
                rg.gap = rand(0, Math.PI * 2);
                rg.bad = (rg.gap + 2.3) % (Math.PI * 2);
                score += 20;
                rt.setScore(score);
                rt.sfx.score();
              }
            }
          }
          rt.setStatus(`Levels dropped: ${score / 20}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#31102f');
          drawRoundedBox(c, W / 2 - 18, 60, 36, H - 60, 0, '#475569');
          for (const rg of rings) {
            const gapPos = Math.cos(rg.gap + rot) * 90;
            const badPos = Math.cos(rg.bad + rot) * 90;
            drawRoundedBox(c, W / 2 - 120, rg.y - 7, 240, 14, 7, '#38bdf8');
            drawRoundedBox(c, W / 2 + gapPos - 36, rg.y - 9, 72, 18, 7, '#0f172a');
            drawRoundedBox(c, W / 2 + badPos - 26, rg.y - 8, 52, 16, 6, '#ef4444');
          }
          drawCircle(c, W / 2, ballY, 13, '#fde047', '#fff');
        },
      };
    },
  },
  {
    id: 'flappy-rocket',
    num: 38,
    title: 'Flappy Rocket',
    icon: '🚀',
    category: 'timing',
    color: '#f97316',
    controlsHint: 'Tap to pulse your thrusters through the plasma gates!',
    desc: 'Fast space flight between glowing plasma barriers.',
    create(rt): MiniGameInstance {
      let py = 300;
      let vy = 0;
      let score = 0;
      const pipes = Array.from({ length: 3 }, (_, i) => ({ x: W + i * 195, gapY: rand(160, 470), done: false }));
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            vy = -340;
            rt.sfx.tap();
          }
          vy += 860 * dt;
          py += vy * dt;
          for (const p of pipes) {
            p.x -= (185 + score * 1.5) * dt;
            if (!p.done && p.x < 95) {
              p.done = true;
              score += 10;
              rt.setScore(score);
              rt.sfx.score();
            }
            if (Math.abs(p.x - 95) < 30 && (py < p.gapY - 70 || py > p.gapY + 70)) {
              rt.sfx.explode();
              rt.endGame(score, `Hit a laser gate (${score} pt)!`);
              return;
            }
            if (p.x < -50) {
              p.x += 585;
              p.gapY = rand(150, 480);
              p.done = false;
            }
          }
          if (py < 15 || py > H - 15) {
            rt.sfx.hit();
            rt.endGame(score, `Rocket crashed (${score} pt)!`);
          }
          rt.setStatus(`Gates passed: ${score / 10}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#431407');
          for (const p of pipes) {
            drawRoundedBox(c, p.x - 20, 0, 40, p.gapY - 72, 6, '#f97316', '#fde047');
            drawRoundedBox(c, p.x - 20, p.gapY + 72, 40, H - p.gapY, 6, '#f97316', '#fde047');
          }
          drawBadgeText(c, '🚀', 95, py, '#fff', 34);
        },
      };
    },
  },
  {
    id: 'zigzag-track',
    num: 39,
    title: 'ZigZag Track',
    icon: '⚡',
    category: 'timing',
    color: '#22d3ee',
    controlsHint: 'Tap to switch direction along the narrow neon track!',
    desc: 'Stay on the floating neon path — one wrong turn and you fall.',
    create(rt): MiniGameInstance {
      let bx = W / 2;
      let dir = 1;
      let score = 0;
      const segs = Array.from({ length: 9 }, (_, i) => ({ x: W / 2 - 42, y: 540 - i * 80, w: 84 }));
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            dir *= -1;
            rt.sfx.tap();
          }
          const spd = 165 + score * 1.1;
          bx += dir * spd * dt;
          for (const s of segs) {
            s.y += spd * dt;
            if (s.y > H + 50) {
              const top = segs.reduce((a, b) => (a.y < b.y ? a : b));
              s.y = top.y - 80;
              s.x = clamp(top.x + (Math.random() < 0.5 ? -56 : 56), 24, W - 110);
              score += 5;
              rt.setScore(score);
            }
          }
          const under = segs.find((s) => Math.abs(s.y + 40 - 480) <= 44);
          if (!under || bx < under.x - 8 || bx > under.x + under.w + 8) {
            rt.sfx.hit();
            rt.endGame(score, `Slipped off the track (${score} pt)!`);
            return;
          }
          rt.setStatus(`Distance: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#083344');
          for (const s of segs) drawRoundedBox(c, s.x, s.y, s.w, 84, 12, '#0ea5e9', '#bae6fd');
          drawCircle(c, bx, 480, 14, '#fde047', '#fff');
        },
      };
    },
  },
  {
    id: 'swing-copters',
    num: 40,
    title: 'Swing Copters',
    icon: '🚁',
    category: 'timing',
    color: '#eab308',
    controlsHint: "Tap to flip your helicopter's horizontal direction!",
    desc: 'Climb vertically between swinging wrecking balls.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let vx = 170;
      let score = 0;
      const bars = Array.from({ length: 3 }, (_, i) => ({
        y: -i * 210,
        gapX: rand(90, W - 90),
        phase: i,
        done: false,
      }));
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            vx *= -1;
            rt.sfx.tap();
          }
          px += vx * dt;
          for (const b of bars) {
            b.y += 170 * dt;
            b.phase += dt * 3;
            const swingX = b.gapX + Math.sin(b.phase) * 40;
            if (!b.done && b.y > 490) {
              b.done = true;
              score += 10;
              rt.setScore(score);
              rt.sfx.score();
            }
            if (Math.abs(b.y - 490) < 20 && Math.abs(px - swingX) > 62) {
              rt.sfx.explode();
              rt.endGame(score, `Hit a wrecking ball! Score: ${score}`);
              return;
            }
            if (b.y > H + 40) {
              b.y -= 630;
              b.gapX = rand(100, W - 100);
              b.done = false;
            }
          }
          if (px < 16 || px > W - 16) {
            rt.sfx.hit();
            rt.endGame(score, `Crashed into wall (${score} pt)!`);
          }
          rt.setStatus(`Height: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#38bdf8', '#0284c7');
          for (const b of bars) {
            const sx = b.gapX + Math.sin(b.phase) * 40;
            drawRoundedBox(c, 0, b.y - 10, sx - 65, 20, 4, '#ef4444');
            drawRoundedBox(c, sx + 65, b.y - 10, W - (sx + 65), 20, 4, '#ef4444');
            drawCircle(c, sx - 65, b.y + 18, 12, '#334155', '#fff');
            drawCircle(c, sx + 65, b.y + 18, 12, '#334155', '#fff');
          }
          drawBadgeText(c, '🚁', px, 490, '#fff', 34);
        },
      };
    },
  },
];
