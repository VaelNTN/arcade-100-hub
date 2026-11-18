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
  drawStarfield,
  drawTrainSprite,
  FloatingPopup,
  rand,
  spawnBurst,
  spawnPopup,
  updateAndDrawBursts,
  updateAndDrawPopups,
} from '../game/engineHelpers';

export const GROUP_06_DODGERS: MiniGameDef[] = [
  {
    id: 'laser-hallway-dash',
    num: 51,
    title: 'Laser Hallway Dash',
    icon: '🚨',
    category: 'runners',
    color: '#ef4444',
    controlsHint: 'Hold to sneak forward — release behind cover before lasers fire!',
    desc: 'Sneak past blinking security lasers to steal the museum diamond.',
    create(rt): MiniGameInstance {
      let py = 540;
      let t = 0;
      let score = 0;
      let sneaking = false;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const lasers = Array.from({ length: 4 }, (_, i) => ({ y: 120 + i * 105, period: 2.2 - i * 0.15, offset: i * 0.7 }));
      return {
        update(dt, inp) {
          lastDt = dt;
          t += dt;
          sneaking = inp.down;
          if (inp.down) py -= 160 * dt;
          for (const l of lasers) {
            const on = Math.sin(((t + l.offset) / l.period) * Math.PI * 2) > 0;
            if (on && Math.abs(py - l.y) < 16) {
              rt.sfx.explode();
              rt.endGame(score, `Alarm triggered! Score: ${score}`);
              return;
            }
          }
          if (py < 70) {
            score += 100;
            spawnBurst(bursts, W / 2, 65, '#38bdf8', 16);
            spawnPopup(popups, W / 2, 95, '+100 💎', '#fde047', 20);
            py = 540;
            rt.setScore(score);
            rt.sfx.win();
          }
          rt.setStatus(`Vaults looted: ${score / 100}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e293b', 'rgba(239,68,68,0.12)');
          drawBadgeText(c, '💎', W / 2, 65, '#fff', 36);
          for (const l of lasers) {
            const on = Math.sin(((t + l.offset) / l.period) * Math.PI * 2) > 0;
            if (on) {
              drawGlowLine(c, 20, l.y, W - 20, l.y, '#ef4444', 6, '#ef4444');
            } else {
              c.strokeStyle = 'rgba(239,68,68,0.22)';
              c.lineWidth = 2;
              c.beginPath();
              c.moveTo(20, l.y);
              c.lineTo(W - 20, l.y);
              c.stroke();
            }
          }
          drawCharacterSprite(c, W / 2, py, {
            style: 'ninja',
            suitColor: '#1e293b',
            accentColor: '#ef4444',
            stride: sneaking ? py * 0.25 : 0,
            action: sneaking ? 'idle' : 'guard',
            scale: 1.05,
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'traffic-cop-chaos',
    num: 52,
    title: 'Traffic Cop Chaos',
    icon: '🚦',
    category: 'runners',
    color: '#22c55e',
    controlsHint: 'Tap to flip traffic lights and prevent intersection crashes!',
    desc: 'Manage two busy roads at once without causing a crash.',
    create(rt): MiniGameInstance {
      let nsGreen = true;
      let score = 0;
      let lastDt = 0.016;
      const cars: { axis: 'ns' | 'ew'; pos: number; spd: number }[] = [];
      const popups: FloatingPopup[] = [];
      let spawnT = 0.5;
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            nsGreen = !nsGreen;
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            cars.push({ axis: Math.random() < 0.5 ? 'ns' : 'ew', pos: -30, spd: 145 + score * 0.3 });
            spawnT = Math.max(0.45, 1.0 - score * 0.002);
          }
          for (let i = cars.length - 1; i >= 0; i--) {
            const cCar = cars[i];
            const isGreen = cCar.axis === 'ns' ? nsGreen : !nsGreen;
            const center = cCar.axis === 'ns' ? H / 2 : W / 2;
            if (!isGreen && cCar.pos < center - 50 && cCar.pos > center - 85) {
              continue; // wait cleanly at light
            }
            cCar.pos += cCar.spd * dt;
            if (cCar.pos > (cCar.axis === 'ns' ? H + 40 : W + 40)) {
              cars.splice(i, 1);
              score += 10;
              rt.setScore(score);
              rt.sfx.score();
              spawnPopup(popups, cCar.axis === 'ns' ? W / 2 : W - 40, cCar.axis === 'ns' ? H - 45 : H / 2, '+10', '#4ade80', 14);
            }
          }
          const inBoxNS = cars.some((cCar) => cCar.axis === 'ns' && Math.abs(cCar.pos - H / 2) < 30);
          const inBoxEW = cars.some((cCar) => cCar.axis === 'ew' && Math.abs(cCar.pos - W / 2) < 30);
          if (inBoxNS && inBoxEW) {
            rt.sfx.explode();
            rt.endGame(score, `Intersection crash at ${score} pt!`);
            return;
          }
          rt.setStatus(nsGreen ? '↕️ North-South GREEN' : '↔️ East-West GREEN');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#064e3b');
          drawRoundedBox(c, W / 2 - 42, 0, 84, H, 0, '#334155');
          drawRoundedBox(c, 0, H / 2 - 42, W, 84, 0, '#334155');
          drawCircle(c, W / 2, H / 2 - 70, 12, nsGreen ? '#22c55e' : '#ef4444', '#fff', nsGreen ? '#22c55e' : '#ef4444');
          drawCircle(c, W / 2 - 70, H / 2, 12, !nsGreen ? '#22c55e' : '#ef4444', '#fff', !nsGreen ? '#22c55e' : '#ef4444');
          for (const cCar of cars) {
            const x = cCar.axis === 'ns' ? W / 2 : cCar.pos;
            const y = cCar.axis === 'ns' ? cCar.pos : H / 2;
            drawCarSprite(
              c,
              x,
              y,
              cCar.axis === 'ns' ? Math.PI : Math.PI / 2,
              cCar.axis === 'ns' ? '#ef4444' : '#facc15',
              cCar.axis === 'ns' ? '#f8fafc' : '#0f172a',
              { taxi: cCar.axis === 'ew', headlights: true, scale: 0.9 }
            );
          }
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'meteor-shower-run',
    num: 53,
    title: 'Meteor Shower Run',
    icon: '🌠',
    category: 'runners',
    color: '#f97316',
    controlsHint: 'Drag left and right to dodge blazing meteors!',
    desc: 'Survive an intensifying meteor storm on the alien surface.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let score = 0;
      let time = 0;
      let spawnT = 0.3;
      const meteors: { x: number; y: number; r: number; spd: number }[] = [];
      return {
        update(dt, inp) {
          time += dt;
          if (inp.down) px = clamp(inp.x, 24, W - 24);
          score += Math.round(dt * 15);
          rt.setScore(score);
          spawnT -= dt;
          if (spawnT <= 0) {
            meteors.push({ x: rand(24, W - 24), y: -30, r: rand(16, 28), spd: rand(180, 320) + score * 0.25 });
            spawnT = Math.max(0.18, 0.55 - score * 0.0005);
          }
          for (let i = meteors.length - 1; i >= 0; i--) {
            const m = meteors[i];
            m.y += m.spd * dt;
            if (Math.hypot(m.x - px, m.y - 545) < m.r + 14) {
              rt.sfx.explode();
              rt.endGame(score, `Crushed by a meteor (${score} pt)!`);
              return;
            }
            if (m.y > H + 40) meteors.splice(i, 1);
          }
          rt.setStatus(`Survived: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1c1917', '#450a0a', 'rgba(249,115,22,0.16)');
          drawStarfield(c, time, 28, 30);
          for (const m of meteors) {
            drawCircle(c, m.x, m.y, m.r, '#ea580c', '#fde047', '#f97316');
          }
          drawCharacterSprite(c, px, 545, {
            style: 'astronaut',
            suitColor: '#f8fafc',
            accentColor: '#f97316',
            stride: time * 12,
            scale: 1.15,
          });
        },
      };
    },
  },
  {
    id: 'escalator-panic',
    num: 54,
    title: 'Escalator Panic',
    icon: '🧳',
    category: 'runners',
    color: '#6366f1',
    controlsHint: 'Tap any of the 3 escalator lanes to dodge tumbling luggage!',
    desc: 'Sprint up a speeding airport escalator past falling bags.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      let time = 0;
      const laneX = (l: number) => 85 + l * 125;
      const bags = Array.from({ length: 5 }, (_, i) => ({ lane: i % 3, y: -i * 130, spd: 230 }));
      return {
        update(dt, inp) {
          time += dt;
          if (inp.justPressed) {
            lane = clamp(Math.floor(inp.x / (W / 3)), 0, 2);
            rt.sfx.tap();
          }
          score += Math.round(dt * 18);
          rt.setScore(score);
          for (const b of bags) {
            b.y += (b.spd + score * 0.25) * dt;
            if (b.lane === lane && Math.abs(b.y - 520) < 32) {
              rt.sfx.hit();
              rt.endGame(score, `Tripped over luggage (${score} pt)!`);
              return;
            }
            if (b.y > H + 30) {
              const newY = -40;
              const blockedLanes = new Set(bags.filter((o) => o !== b && o.y < 70).map((o) => o.lane));
              const openLanes = [0, 1, 2].filter((l) => !blockedLanes.has(l));
              b.y = newY;
              b.lane = openLanes.length > 0 ? openLanes[Math.floor(Math.random() * openLanes.length)] : Math.floor(Math.random() * 3);
            }
          }
          rt.setStatus(`Escalator sprint: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#0f172a', 'rgba(99,102,241,0.14)');
          for (let l = 0; l < 3; l++) drawRoundedBox(c, laneX(l) - 38, 0, 76, H, 0, '#334155', '#64748b');
          for (const b of bags) drawBadgeText(c, '🧳', laneX(b.lane), b.y, '#fff', 32);
          drawCharacterSprite(c, laneX(lane), 520, {
            style: 'runner',
            suitColor: '#6366f1',
            accentColor: '#fde047',
            stride: time * 14,
            scale: 1.15,
          });
        },
      };
    },
  },
  {
    id: 'bumper-car-survival',
    num: 55,
    title: 'Bumper Car Survival',
    icon: '🚗',
    category: 'physics',
    color: '#38bdf8',
    controlsHint: 'Drag back to sling your bumper car and knock rivals off the ice!',
    desc: 'Slingshot ice-arena battle: knock rivals off as the rink shrinks.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = 380;
      let pvx = 0;
      let pvy = 0;
      let radius = 180;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const bots = [
        { x: W / 2 - 70, y: 260, vx: 30, vy: 20 },
        { x: W / 2 + 70, y: 260, vx: -30, vy: 25 },
      ];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justReleased) {
            pvx += clamp((inp.startX - inp.x) * 2.4, -360, 360);
            pvy += clamp((inp.startY - inp.y) * 2.4, -360, 360);
            rt.sfx.tap();
          }
          px += pvx * dt;
          py += pvy * dt;
          pvx *= Math.pow(0.2, dt);
          pvy *= Math.pow(0.2, dt);
          radius = Math.max(95, radius - 3 * dt);

          for (const b of bots) {
            const dx = px - b.x;
            const dy = py - b.y;
            const d = Math.max(1, Math.hypot(dx, dy));
            b.vx += (dx / d) * 140 * dt;
            b.vy += (dy / d) * 140 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.vx *= Math.pow(0.3, dt);
            b.vy *= Math.pow(0.3, dt);
            if (d < 36) {
              const nx = dx / d;
              const ny = dy / d;
              b.vx -= nx * 240;
              b.vy -= ny * 240;
              pvx += nx * 130;
              pvy += ny * 130;
              spawnBurst(bursts, (px + b.x) / 2, (py + b.y) / 2, '#fde047', 10);
              rt.sfx.hit();
            }
            if (Math.hypot(b.x - W / 2, b.y - 330) > radius) {
              spawnBurst(bursts, b.x, b.y, '#38bdf8', 16);
              spawnPopup(popups, b.x, b.y - 12, 'KNOCKOUT! +100', '#fde047', 18);
              score += 100;
              radius = Math.min(180, radius + 15);
              rt.setScore(score);
              rt.sfx.win();
              b.x = W / 2 + rand(-50, 50);
              b.y = 330 + rand(-50, 50);
              b.vx = 0;
              b.vy = 0;
            }
          }
          if (Math.hypot(px - W / 2, py - 330) > radius + 10) {
            rt.sfx.explode();
            rt.endGame(score, `Slid off the ice! Score: ${score}`);
            return;
          }
          rt.setStatus(`Drag & launch · Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#090d16', 'rgba(56,189,248,0.16)');
          drawCircle(c, W / 2, 330, radius, '#bae6fd', '#fff', 'rgba(56,189,248,0.3)');
          for (const b of bots) {
            drawCarSprite(c, b.x, b.y, Math.atan2(b.vy, b.vx) + Math.PI / 2, '#ef4444', '#fde047', { bumper: true, scale: 1.05 });
          }
          const pAng = Math.hypot(pvx, pvy) > 5 ? Math.atan2(pvy, pvx) + Math.PI / 2 : 0;
          drawCarSprite(c, px, py, pAng, '#38bdf8', '#f8fafc', { bumper: true, scale: 1.1 });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'train-track-switcher',
    num: 56,
    title: 'Train Track Switcher',
    icon: '🚆',
    category: 'runners',
    color: '#eab308',
    controlsHint: 'Tap to switch tracks LEFT (Red) or RIGHT (Blue) for incoming trains!',
    desc: 'Route colored trains safely to their matching station.',
    create(rt): MiniGameInstance {
      let switchRight = false;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const trains: { y: number; targetRight: boolean }[] = [{ y: 60, targetRight: false }];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let spawnT = 1.6;
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            switchRight = !switchRight;
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            trains.push({ y: 40, targetRight: Math.random() < 0.5 });
            spawnT = Math.max(0.95, 2.0 - score * 0.002);
          }
          for (let i = trains.length - 1; i >= 0; i--) {
            trains[i].y += (140 + score * 0.25) * dt;
            if (trains[i].y >= 380) {
              const t = trains.splice(i, 1)[0];
              const sx = switchRight ? 260 : 160;
              if (t.targetRight === switchRight) {
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, sx, 430, switchRight ? '#38bdf8' : '#ef4444', 10);
                spawnPopup(popups, sx, 410, '+25', '#fde047', 16);
              } else {
                spawnBurst(bursts, sx, 430, '#ef4444', 12);
                lives--;
                rt.sfx.hit();
                if (lives <= 0) {
                  rt.endGame(score, `Wrong track! Score: ${score}`);
                  return;
                }
              }
            }
          }
          rt.setStatus(`Switch: ${switchRight ? 'RIGHT 🔵' : 'LEFT 🔴'}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#064e3b', 'rgba(234,179,8,0.12)');
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 8;
          c.beginPath();
          c.moveTo(W / 2, 0);
          c.lineTo(W / 2, 300);
          c.lineTo(110, 460);
          c.moveTo(W / 2, 300);
          c.lineTo(310, 460);
          c.stroke();

          drawGlowLine(c, W / 2, 300, switchRight ? 310 : 110, 460, '#facc15', 10, '#facc15');

          drawBadgeText(c, '🔴 Station', 110, 495, '#ef4444', 18);
          drawBadgeText(c, '🔵 Station', 310, 495, '#38bdf8', 18);
          for (const t of trains) {
            const x = t.y < 300 ? W / 2 : W / 2 + ((t.y - 300) / 160) * (switchRight ? 100 : -100);
            drawTrainSprite(c, x, t.y, t.targetRight ? '#0284c7' : '#dc2626', t.targetRight ? '#bae6fd' : '#fde047');
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'avalanche-ski',
    num: 57,
    title: 'Avalanche Ski',
    icon: '⛷️',
    category: 'runners',
    color: '#bae6fd',
    controlsHint: 'Drag the skier around pine trees and outrun the avalanche!',
    desc: 'Slalom down powdery slopes while an avalanche chases behind.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let score = 0;
      let time = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const trees = Array.from({ length: 7 }, (_, i) => ({ x: rand(35, W - 35), y: 200 + i * 90 }));
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          if (inp.down) px = clamp(inp.x, 22, W - 22);
          const spd = 230 + score * 0.5;
          if (Math.random() < 0.35) spawnBurst(bursts, px, 208, '#fff', 2, 0.3);
          score += Math.round(dt * 18);
          rt.setScore(score);
          for (const tr of trees) {
            tr.y -= spd * dt;
            if (Math.hypot(tr.x - px, tr.y - 220) < 26) {
              rt.sfx.explode();
              rt.endGame(score, `Hit a pine tree (${score} pt)!`);
              return;
            }
            if (tr.y < -30) {
              tr.y = H + rand(20, 120);
              tr.x = rand(30, W - 30);
            }
          }
          rt.setStatus(`Descent: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#f8fafc', '#bae6fd');
          drawRoundedBox(c, 0, 0, W, 90, 0, '#e2e8f0');
          drawBadgeText(c, '❄️ AVALANCHE ❄️', W / 2, 55, '#0369a1', 18);
          updateAndDrawBursts(c, bursts, lastDt);
          drawCharacterSprite(c, px, 220, {
            style: 'skier',
            suitColor: '#ef4444',
            accentColor: '#38bdf8',
            stride: time * 10,
            scale: 1.1,
          });
          for (const tr of trees) drawBadgeText(c, '🌲', tr.x, tr.y, '#fff', 34);
        },
      };
    },
  },
  {
    id: 'ballz-breaker',
    num: 58,
    title: 'Ballz Breaker',
    icon: '⚪',
    category: 'physics',
    color: '#f43f5e',
    controlsHint: 'Drag to aim a chain of balls at the numbered blocks!',
    desc: 'Brick-breaking chain shots: collect extra balls to clear rows.',
    create(rt): MiniGameInstance {
      let shootX = W / 2;
      let ballCount = 5;
      let score = 0;
      let aimAng = -Math.PI / 2;
      let lastDt = 0.016;
      const activeBalls: { x: number; y: number; vx: number; vy: number }[] = [];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let queue = 0;
      let queueT = 0;
      const blocks: { x: number; y: number; hp: number }[] = [];
      const addRow = (): boolean => {
        for (const b of blocks) b.y += 52;
        if (blocks.some((b) => b.y > 515)) {
          rt.sfx.explode();
          rt.endGame(score, `Blocks reached the bottom! Score: ${score}`);
          return true;
        }
        const lvl = Math.max(2, Math.floor(score / 40) + 2);
        for (let c = 0; c < 6; c++) {
          if (Math.random() < 0.65) blocks.push({ x: 35 + c * 62, y: 95, hp: rand(lvl, lvl + 4) | 0 });
        }
        return false;
      };
      addRow();
      return {
        update(dt, inp) {
          lastDt = dt;
          if (activeBalls.length === 0 && queue === 0) {
            if (inp.down) aimAng = clamp(Math.atan2(inp.y - 575, inp.x - shootX), -Math.PI + 0.2, -0.2);
            if (inp.justReleased) {
              queue = ballCount;
              queueT = 0;
            }
          }
          if (queue > 0) {
            queueT -= dt;
            if (queueT <= 0) {
              activeBalls.push({ x: shootX, y: 575, vx: Math.cos(aimAng) * 440, vy: Math.sin(aimAng) * 440 });
              queue--;
              queueT = 0.07;
              rt.sfx.tap();
            }
          }
          for (let i = activeBalls.length - 1; i >= 0; i--) {
            const b = activeBalls[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 12 || b.x > W - 12) {
              b.vx *= -1;
              b.x = clamp(b.x, 12, W - 12);
            }
            if (b.y < 60) {
              b.vy = Math.abs(b.vy);
              b.y = 60;
            }
            for (let j = blocks.length - 1; j >= 0; j--) {
              const bl = blocks[j];
              const left = bl.x - 6;
              const right = bl.x + 56;
              const top = bl.y - 6;
              const bottom = bl.y + 42;
              if (b.x > left && b.x < right && b.y > top && b.y < bottom) {
                const overlapL = b.x - left;
                const overlapR = right - b.x;
                const overlapT = b.y - top;
                const overlapB = bottom - b.y;
                const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
                if (minOverlap === overlapL) {
                  b.x = left;
                  b.vx = -Math.abs(b.vx);
                } else if (minOverlap === overlapR) {
                  b.x = right;
                  b.vx = Math.abs(b.vx);
                } else if (minOverlap === overlapT) {
                  b.y = top;
                  b.vy = -Math.abs(b.vy);
                } else {
                  b.y = bottom;
                  b.vy = Math.abs(b.vy);
                }
                if (Math.abs(b.vy) < 45) b.vy = (b.vy >= 0 ? 1 : -1) * 45;
                bl.hp--;
                score += 5;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, b.x, b.y, '#f472b6', 5, 0.5);
                if (bl.hp <= 0) {
                  spawnBurst(bursts, bl.x + 25, bl.y + 18, '#fde047', 12);
                  spawnPopup(popups, bl.x + 25, bl.y, '+BALL', '#38bdf8', 14);
                  blocks.splice(j, 1);
                  ballCount = Math.min(24, ballCount + 1);
                }
                break;
              }
            }
            if (b.y > 585) {
              shootX = clamp(b.x, 30, W - 30);
              activeBalls.splice(i, 1);
              if (activeBalls.length === 0 && queue === 0) {
                if (addRow()) return;
              }
            }
          }
          rt.setStatus(`Balls: ${ballCount} · Aim upward!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e293b', 'rgba(244,63,94,0.14)');
          for (const bl of blocks) {
            const col = bl.hp >= 12 ? '#ef4444' : bl.hp >= 6 ? '#ec4899' : '#a855f7';
            drawRoundedBox(c, bl.x, bl.y, 50, 36, 7, col, '#fff');
            drawBadgeText(c, `${bl.hp}`, bl.x + 25, bl.y + 18, '#fff', 15);
          }
          if (activeBalls.length === 0) {
            c.strokeStyle = 'rgba(255,255,255,0.5)';
            c.setLineDash([5, 5]);
            c.beginPath();
            c.moveTo(shootX, 575);
            c.lineTo(shootX + Math.cos(aimAng) * 140, 575 + Math.sin(aimAng) * 140);
            c.stroke();
            c.setLineDash([]);
          }
          for (const b of activeBalls) drawCircle(c, b.x, b.y, 7, '#fde047', undefined, '#facc15');
          drawCircle(c, shootX, 575, 9, '#38bdf8', '#fff', '#38bdf8');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'pinball-mini-arcade',
    num: 59,
    title: 'Pinball Mini Arcade',
    icon: '🛸',
    category: 'physics',
    color: '#a855f7',
    controlsHint: 'Tap LEFT for left flipper, RIGHT for right flipper!',
    desc: 'Arcade pinball packed with glowing bumpers and fast rebounds.',
    create(rt): MiniGameInstance {
      let bx = 180;
      let by = 140;
      let vx = 140;
      let vy = 100;
      let leftUp = 0;
      let rightUp = 0;
      let score = 0;
      let balls = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const bumpers = [
        { x: 130, y: 210, r: 26, flash: 0 },
        { x: 290, y: 210, r: 26, flash: 0 },
        { x: 210, y: 310, r: 24, flash: 0 },
      ];
      return {
        update(dt, inp) {
          lastDt = dt;
          leftUp = inp.down && inp.x < W / 2 ? 1 : Math.max(0, leftUp - dt * 5);
          rightUp = inp.down && inp.x >= W / 2 ? 1 : Math.max(0, rightUp - dt * 5);
          vy += 420 * dt;
          bx += vx * dt;
          by += vy * dt;
          if (bx < 22 || bx > W - 22) {
            vx *= -0.9;
            bx = clamp(bx, 22, W - 22);
          }
          if (by < 70) {
            vy = Math.abs(vy);
            by = 70;
          }
          for (const bm of bumpers) {
            if (bm.flash > 0) bm.flash -= dt;
            const dx = bx - bm.x;
            const dy = by - bm.y;
            const d = Math.hypot(dx, dy);
            if (d < bm.r + 12) {
              const nx = dx / Math.max(1, d);
              const ny = dy / Math.max(1, d);
              bx = bm.x + nx * (bm.r + 13);
              by = bm.y + ny * (bm.r + 13);
              vx = nx * 360;
              vy = ny * 360;
              bm.flash = 0.2;
              score += 50;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, bm.x + nx * bm.r, bm.y + ny * bm.r, '#fde047', 10);
              spawnPopup(popups, bm.x, bm.y - bm.r - 10, '+50', '#fde047', 16);
            }
          }
          // Flippers zone around y=545
          if (by > 530 && by < 565) {
            if (bx > 80 && bx < 200 && leftUp > 0.2) {
              vy = -520;
              vx = (bx - 120) * 3;
              rt.sfx.tap();
            } else if (bx >= 220 && bx < 340 && rightUp > 0.2) {
              vy = -520;
              vx = (bx - 300) * 3;
              rt.sfx.tap();
            }
          }
          if (by > H + 20) {
            balls--;
            rt.sfx.hit();
            if (balls <= 0) {
              rt.endGame(score, `Pinball final score: ${score}`);
              return;
            }
            bx = rand(140, 280);
            by = 120;
            vx = rand(-150, 150);
            vy = 60;
          }
          rt.setStatus(`Balls left: ${balls}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#31102f', '#090d16', 'rgba(168,85,247,0.16)');
          for (const bm of bumpers) {
            const lit = bm.flash > 0;
            drawCircle(c, bm.x, bm.y, bm.r + (lit ? 3 : 0), lit ? '#fde047' : '#ec4899', '#fff', lit ? '#fde047' : '#ec4899');
          }
          drawGlowLine(c, 85, 540, 185, leftUp > 0.2 ? 505 : 560, '#38bdf8', 12, '#38bdf8');
          drawGlowLine(c, 335, 540, 235, rightUp > 0.2 ? 505 : 560, '#38bdf8', 12, '#38bdf8');
          drawCircle(c, bx, by, 11, '#f8fafc', '#fde047', '#fde047');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
          drawLives(c, balls);
        },
      };
    },
  },
  {
    id: 'mini-golf-18-holes',
    num: 60,
    title: 'Mini Golf Master',
    icon: '⛳',
    category: 'physics',
    color: '#22c55e',
    controlsHint: 'Drag from the golf ball and release to putt toward the flag!',
    desc: 'Bank off wooden barriers and sink the putt.',
    create(rt): MiniGameInstance {
      let bx = W / 2;
      let by = 520;
      let vx = 0;
      let vy = 0;
      let hole = { x: W / 2, y: 120 };
      let wall = { x: 110, y: 310, w: 200, h: 18 };
      let holeNum = 1;
      let score = 0;
      let drag = false;
      let aim = { x: bx, y: by };
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const nextHole = () => {
        holeNum++;
        bx = rand(90, W - 90);
        by = 530;
        vx = 0;
        vy = 0;
        hole = { x: rand(80, W - 80), y: rand(95, 180) };
        wall = { x: rand(40, 170), y: rand(240, 380), w: rand(140, 220), h: 18 };
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          const moving = Math.hypot(vx, vy) > 10;
          if (!moving) {
            if (inp.down) {
              drag = true;
              aim = { x: inp.x, y: inp.y };
            }
            if (inp.justReleased && drag) {
              drag = false;
              vx = clamp((bx - aim.x) * 3.5, -520, 520);
              vy = clamp((by - aim.y) * 3.5, -520, 520);
              rt.sfx.tap();
            }
          } else {
            bx += vx * dt;
            by += vy * dt;
            vx *= Math.pow(0.18, dt);
            vy *= Math.pow(0.18, dt);
            if (bx < 30 || bx > W - 30) {
              vx *= -0.85;
              bx = clamp(bx, 30, W - 30);
            }
            if (by < 70 || by > H - 30) {
              vy *= -0.85;
              by = clamp(by, 70, H - 30);
            }
            const left = wall.x - 9;
            const right = wall.x + wall.w + 9;
            const top = wall.y - 9;
            const bottom = wall.y + wall.h + 9;
            if (bx > left && bx < right && by > top && by < bottom) {
              const overlapL = bx - left;
              const overlapR = right - bx;
              const overlapT = by - top;
              const overlapB = bottom - by;
              const minOverlap = Math.min(overlapL, overlapR, overlapT, overlapB);
              if (minOverlap === overlapL) {
                bx = left;
                vx = -Math.abs(vx) * 0.9;
              } else if (minOverlap === overlapR) {
                bx = right;
                vx = Math.abs(vx) * 0.9;
              } else if (minOverlap === overlapT) {
                by = top;
                vy = -Math.abs(vy) * 0.9;
              } else {
                by = bottom;
                vy = Math.abs(vy) * 0.9;
              }
              rt.sfx.tap();
            }
            if (Math.hypot(bx - hole.x, by - hole.y) < 18 && Math.hypot(vx, vy) < 280) {
              spawnBurst(bursts, hole.x, hole.y, '#fde047', 16);
              spawnPopup(popups, hole.x, hole.y - 18, '+100 ⛳', '#fde047', 20);
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
              nextHole();
            }
          }
          rt.setStatus(`Hole ${holeNum} · Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#15803d', '#14532d', 'rgba(34,197,94,0.16)');
          drawRoundedBox(c, 20, 60, W - 40, H - 80, 16, '#22c55e', '#bef264');
          drawCircle(c, hole.x, hole.y, 16, '#090d16', '#fde047');
          drawBadgeText(c, '🚩', hole.x + 8, hole.y - 16, '#fff', 22);
          drawRoundedBox(c, wall.x, wall.y, wall.w, wall.h, 6, '#92400e', '#fde68a');
          if (drag) {
            c.strokeStyle = '#fde047';
            c.lineWidth = 3;
            c.setLineDash([6, 4]);
            c.beginPath();
            c.moveTo(bx, by);
            c.lineTo(bx + (bx - aim.x), by + (by - aim.y));
            c.stroke();
            c.setLineDash([]);
          }
          drawCircle(c, bx, by, 10, '#fff', '#cbd5e1');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
];
