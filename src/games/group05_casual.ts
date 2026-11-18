import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCarSprite,
  drawCharacterSprite,
  drawCircle,
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

export const GROUP_05_CASUAL: MiniGameDef[] = [
  {
    id: 'dune-hopper',
    num: 41,
    title: 'Dune Hopper',
    icon: '🏜️',
    category: 'timing',
    color: '#f59e0b',
    controlsHint: 'Hold to dive into valleys & release to soar over dunes!',
    desc: 'Soar across desert dunes and land smoothly on downslopes.',
    create(rt): MiniGameInstance {
      let dist = 0;
      let py = 360;
      let vy = 0;
      let spd = 220;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const dune = (x: number) => 440 + Math.sin(x * 0.012) * 80;
      return {
        update(dt, inp) {
          lastDt = dt;
          dist += spd * dt;
          if (inp.down) vy += 1400 * dt;
          vy += 600 * dt;
          py += vy * dt;
          const gy = dune(dist + 100);
          if (py >= gy) {
            const slope = dune(dist + 105) - dune(dist + 95);
            if (vy > 360 && slope < -2) {
              spd = Math.min(540, spd + 60);
              score += 35;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, 100, gy, '#fde047', 12);
              spawnPopup(popups, 100, gy - 26, 'SMOOTH! +35', '#fde047', 16);
            } else if (vy > 510 && slope > 4) {
              rt.sfx.explode();
              rt.endGame(score, `Crashed into a dune at ${score} pt!`);
              return;
            }
            py = gy;
            vy = Math.min(vy, slope * 28);
          } else {
            if (py < 240) {
              score += Math.round(dt * 30);
              rt.setScore(score);
            }
          }
          rt.setStatus(`Fly above the line for bonus!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#fb923c', '#7c2d12', 'rgba(250,204,21,0.15)');
          c.strokeStyle = 'rgba(255,255,255,0.45)';
          c.setLineDash([8, 8]);
          c.beginPath();
          c.moveTo(0, 240);
          c.lineTo(W, 240);
          c.stroke();
          c.setLineDash([]);
          c.fillStyle = '#fde68a';
          c.beginPath();
          c.moveTo(0, H);
          for (let x = 0; x <= W; x += 8) c.lineTo(x, dune(dist + x));
          c.lineTo(W, H);
          c.closePath();
          c.fill();
          drawCircle(c, 100, py - 12, 13, '#ef4444', '#fff', '#f97316');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'timing-lock-pick',
    num: 42,
    title: 'Timing Lock Pick',
    icon: '🔐',
    category: 'timing',
    color: '#22c55e',
    controlsHint: 'Tap right when the spinning dial hits the GOLDEN pin!',
    desc: 'Crack faster vault locks without a single miss.',
    create(rt): MiniGameInstance {
      let ang = 0;
      let dir = 1;
      let target = 1.4;
      let level = 1;
      let left = 3;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          ang += dir * (2.2 + level * 0.28) * dt;
          if (inp.justPressed) {
            const diff = Math.abs(Math.atan2(Math.sin(ang - target), Math.cos(ang - target)));
            if (diff < 0.34) {
              const px = W / 2 + Math.cos(target) * 120;
              const py = 330 + Math.sin(target) * 120;
              spawnBurst(bursts, px, py, '#fde047', 12);
              score += 30;
              left--;
              dir *= -1;
              target = rand(0, Math.PI * 2);
              rt.setScore(score);
              rt.sfx.score();
              if (left <= 0) {
                level++;
                left = 2 + level;
                score += 50;
                rt.setScore(score);
                rt.sfx.win();
                spawnPopup(popups, W / 2, 175, `VAULT ${level - 1} OPEN! +50`, '#4ade80', 18);
              } else {
                spawnPopup(popups, px, py - 16, '+30', '#fde047', 16);
              }
            } else {
              rt.sfx.hit();
              rt.endGame(score, `Lock jammed at level ${level} (${score} pt)!`);
              return;
            }
          }
          rt.setStatus(`Vault ${level} · ${left} left`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#064e3b', 'rgba(34,197,94,0.14)');
          const cx = W / 2;
          const cy = 330;
          c.strokeStyle = '#334155';
          c.lineWidth = 26;
          c.beginPath();
          c.arc(cx, cy, 120, 0, Math.PI * 2);
          c.stroke();
          drawCircle(c, cx + Math.cos(target) * 120, cy + Math.sin(target) * 120, 16, '#facc15', '#fff', '#facc15');
          c.strokeStyle = '#ef4444';
          c.lineWidth = 8;
          c.beginPath();
          c.moveTo(cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90);
          c.lineTo(cx + Math.cos(ang) * 145, cy + Math.sin(ang) * 145);
          c.stroke();
          drawBadgeText(c, `${left}`, cx, cy, '#fff', 52);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'pendulum-cut',
    num: 43,
    title: 'Pendulum Cut',
    icon: '✂️',
    category: 'timing',
    color: '#ec4899',
    controlsHint: 'Tap to cut the rope so the candy drops into the moving bucket!',
    desc: 'Timing & gravity: snip the pendulum at the perfect moment.',
    create(rt): MiniGameInstance {
      let t = 0;
      let bx = W / 2;
      let by = 220;
      let vx = 0;
      let vy = 0;
      let cut = false;
      let bucketX = W / 2;
      let bucketVx = 95;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const reset = () => {
        cut = false;
        vx = 0;
        vy = 0;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          t += dt * 2.5;
          bucketX += bucketVx * dt;
          if (bucketX < 65 || bucketX > W - 65) {
            bucketX = clamp(bucketX, 65, W - 65);
            bucketVx *= -1;
          }
          if (!cut) {
            const ang = Math.sin(t) * 0.9;
            bx = W / 2 + Math.sin(ang) * 150;
            by = 85 + Math.cos(ang) * 150;
            if (inp.justPressed) {
              cut = true;
              vx = Math.cos(t) * 240;
              vy = 40;
              spawnBurst(bursts, (W / 2 + bx) * 0.5, (85 + by) * 0.5, '#fde68a', 6, 0.5);
              rt.sfx.tap();
            }
          } else {
            vy += 880 * dt;
            bx += vx * dt;
            by += vy * dt;
            if (by >= 520 && by <= 560 && Math.abs(bx - bucketX) < 50) {
              score += 50;
              bucketVx = (bucketVx > 0 ? 1 : -1) * Math.min(260, Math.abs(bucketVx) + 12);
              rt.setScore(score);
              rt.sfx.win();
              spawnBurst(bursts, bucketX, 535, '#22c55e', 14);
              spawnPopup(popups, bucketX, 505, '+50 🍬', '#fde047');
              reset();
            } else if (by > H + 20) {
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Out of lives! Score: ${score}`);
                return;
              }
              reset();
            }
          }
          rt.setStatus(`Cut in time! Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#3b0764', '#0f172a', 'rgba(236,72,153,0.14)');
          if (!cut) {
            c.strokeStyle = '#fde68a';
            c.lineWidth = 4;
            c.beginPath();
            c.moveTo(W / 2, 85);
            c.lineTo(bx, by);
            c.stroke();
          }
          drawCircle(c, W / 2, 85, 8, '#fff');
          drawBadgeText(c, '🍬', bx, by, '#fff', 32);
          drawRoundedBox(c, bucketX - 45, 535, 90, 26, 8, '#22c55e', '#fff', 'rgba(34,197,94,0.35)');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'orbit-leap',
    num: 44,
    title: 'Orbit Leap',
    icon: '🪐',
    category: 'timing',
    color: '#6366f1',
    controlsHint: 'Tap to launch from orbit onto the next planet!',
    desc: 'Gravity-hop between orbiting planets across deep space.',
    create(rt): MiniGameInstance {
      const planets = [
        { x: W / 2, y: 470, r: 46 },
        { x: rand(90, W - 90), y: 270, r: 40 },
        { x: rand(90, W - 90), y: 80, r: 38 },
      ];
      let onPlanet: number | null = 0;
      let orbAng = -Math.PI / 2;
      let px = W / 2;
      let py = 400;
      let vx = 0;
      let vy = 0;
      let score = 0;
      let time = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          if (onPlanet !== null) {
            orbAng += 3.0 * dt;
            const p = planets[onPlanet];
            px = p.x + Math.cos(orbAng) * (p.r + 18);
            py = p.y + Math.sin(orbAng) * (p.r + 18);
            if (inp.justPressed) {
              onPlanet = null;
              vx = Math.cos(orbAng) * 420;
              vy = Math.sin(orbAng) * 420;
              spawnBurst(bursts, px, py, '#38bdf8', 8, 0.6);
              rt.sfx.tap();
            }
          } else {
            px += vx * dt;
            py += vy * dt;
            for (let i = 1; i < planets.length; i++) {
              const p = planets[i];
              if (Math.hypot(px - p.x, py - p.y) < p.r + 22) {
                onPlanet = 0;
                score += 30;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, p.x, p.y, '#a855f7', 14);
                spawnPopup(popups, p.x, p.y - p.r - 12, '+30 🪐', '#fde047');
                const shift = 470 - p.y;
                for (const pl of planets) pl.y += shift;
                planets.splice(0, i);
                while (planets.length < 3) {
                  planets.push({ x: rand(75, W - 75), y: planets[planets.length - 1].y - 190, r: rand(32, 44) });
                }
                orbAng = Math.atan2(py - planets[0].y, px - planets[0].x);
                break;
              }
            }
            if (px < -30 || px > W + 30 || py < -40 || py > H + 40) {
              rt.sfx.hit();
              rt.endGame(score, `Lost in deep space (${score} pt)!`);
              return;
            }
          }
          rt.setStatus(`Planets visited: ${score / 30}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#1e1b4b', 'rgba(99,102,241,0.18)');
          drawStarfield(c, time, 32, 12);
          planets.forEach((p, idx) => {
            c.strokeStyle = 'rgba(255,255,255,0.18)';
            c.lineWidth = 1.5;
            c.setLineDash([4, 6]);
            c.beginPath();
            c.arc(p.x, p.y, p.r + 18, 0, Math.PI * 2);
            c.stroke();
            c.setLineDash([]);
            const col = idx === 0 ? '#38bdf8' : '#a855f7';
            drawCircle(c, p.x, p.y, p.r, col, '#fff', col);
          });
          drawCharacterSprite(c, px, py, {
            style: 'astronaut',
            suitColor: '#f8fafc',
            accentColor: '#f97316',
            action: onPlanet === null ? 'jump' : 'idle',
            stride: time * 6,
            scale: 0.9,
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'beat-tap-lane',
    num: 45,
    title: 'Beat Tap Lane',
    icon: '🎵',
    category: 'timing',
    color: '#d946ef',
    controlsHint: 'Tap the 4 neon lanes when tiles hit the white bar!',
    desc: '4-lane rhythm action: hit notes on the beat without missing.',
    create(rt): MiniGameInstance {
      const notes: { lane: number; y: number }[] = [];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let spawnT = 0.4;
      let score = 0;
      let lives = 5;
      let lastDt = 0.016;
      const laneW = W / 4;
      const cols = ['#ef4444', '#38bdf8', '#22c55e', '#facc15'];
      return {
        update(dt, inp) {
          lastDt = dt;
          spawnT -= dt;
          if (spawnT <= 0) {
            notes.push({ lane: Math.floor(Math.random() * 4), y: -20 });
            spawnT = Math.max(0.26, 0.58 - score * 0.0005);
          }
          if (inp.justPressed) {
            const lane = clamp(Math.floor(inp.x / laneW), 0, 3);
            const idx = notes.findIndex((n) => n.lane === lane && Math.abs(n.y - 535) < 55);
            if (idx >= 0) {
              const nx = lane * laneW + laneW / 2;
              notes.splice(idx, 1);
              score += 25;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, nx, 535, cols[lane], 12);
              spawnPopup(popups, nx, 505, '+25 ♪', cols[lane], 16);
            } else {
              rt.sfx.hit();
            }
          }
          for (let i = notes.length - 1; i >= 0; i--) {
            notes[i].y += (270 + score * 0.15) * dt;
            if (notes[i].y > H + 20) {
              notes.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Missed the beat! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Lives: ${lives} · Tap on the beat`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#3b0764', 'rgba(217,70,239,0.16)');
          for (let i = 1; i < 4; i++) {
            c.strokeStyle = 'rgba(255,255,255,0.12)';
            c.beginPath();
            c.moveTo(i * laneW, 0);
            c.lineTo(i * laneW, H);
            c.stroke();
          }
          drawRoundedBox(c, 8, 520, W - 16, 30, 8, 'rgba(255,255,255,0.15)', '#fff', 'rgba(255,255,255,0.3)');
          for (const n of notes) {
            drawRoundedBox(c, n.lane * laneW + 10, n.y - 16, laneW - 20, 32, 8, cols[n.lane], '#fff', cols[n.lane]);
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'safe-cracker-spin',
    num: 46,
    title: 'Safe Cracker Spin',
    icon: '🔓',
    category: 'timing',
    color: '#64748b',
    controlsHint: 'Drag around the dial to lock onto the target number!',
    desc: 'Crack the vault combination before the alarm timer runs out.',
    create(rt): MiniGameInstance {
      let dial = 0;
      let target = Math.floor(Math.random() * 12);
      let holdOk = 0;
      let timeLeft = 30;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          timeLeft -= dt;
          if (timeLeft <= 0) {
            rt.sfx.explode();
            rt.endGame(score, `Time's up! Vaults cracked: ${Math.floor(score / 40)}`);
            return;
          }
          if (inp.down) {
            const ang = Math.atan2(inp.y - 340, inp.x - W / 2);
            const norm = ((ang + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            dial = Math.round((norm / (Math.PI * 2)) * 12) % 12;
          }
          if (dial === target) {
            holdOk += dt;
            if (holdOk >= 0.35) {
              const a = (target / 12) * Math.PI * 2 - Math.PI / 2;
              const tx = W / 2 + Math.cos(a) * 105;
              const ty = 340 + Math.sin(a) * 105;
              spawnBurst(bursts, tx, ty, '#22c55e', 12);
              spawnPopup(popups, W / 2, 270, '+40 🔓', '#4ade80');
              score += 40;
              timeLeft = Math.min(35, timeLeft + 2.5);
              holdOk = 0;
              target = (target + Math.floor(rand(2, 10))) % 12;
              rt.setScore(score);
              rt.sfx.score();
            }
          } else {
            holdOk = 0;
          }
          rt.setStatus(`Target: #${target} · Time: ${Math.ceil(timeLeft)}s`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#090d16', 'rgba(100,116,139,0.16)');
          const cx = W / 2;
          const cy = 340;
          drawCircle(c, cx, cy, 130, '#334155', '#94a3b8');
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
            const nx = cx + Math.cos(a) * 105;
            const ny = cy + Math.sin(a) * 105;
            if (i === target) drawCircle(c, nx, ny, 16, '#22c55e', undefined, '#22c55e');
            if (i === dial) drawCircle(c, nx, ny, 18, 'rgba(250,204,21,0.45)', '#fde047');
            drawBadgeText(c, `${i}`, nx, ny, '#fff', 16);
          }
          drawBadgeText(c, `TARGET: ${target}`, cx, cy, '#fde047', 26);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'one-tap-drift',
    num: 47,
    title: 'One-Tap Drift',
    icon: '🏎️',
    category: 'runners',
    color: '#ef4444',
    controlsHint: 'Hold to drift RIGHT, release to steer LEFT!',
    desc: 'Weave through endless neon curves and stay on the road.',
    create(rt): MiniGameInstance {
      let cx = W / 2;
      let roadCenter = W / 2;
      let score = 0;
      let t = 0;
      let driftingRight = false;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const roadAt = (timeVal: number) => W / 2 + Math.sin(timeVal * 1.4) * 105 + Math.cos(timeVal * 2.5) * 35;
      return {
        update(dt, inp) {
          lastDt = dt;
          t += dt;
          driftingRight = inp.down;
          const speed = 190 + score * 0.8;
          cx += (inp.down ? 1 : -1) * 210 * dt;
          roadCenter = roadAt(t);
          if (Math.random() < 0.35) {
            spawnBurst(bursts, cx, 505, inp.down ? '#f43f5e' : '#38bdf8', 2, 0.35);
          }
          score += Math.round(dt * 30);
          rt.setScore(score);
          if (Math.abs(cx - roadCenter) > 64) {
            rt.sfx.explode();
            rt.endGame(score, `Flew off the track (${score} pt)!`);
            return;
          }
          rt.setStatus(`Hold=Right · Release=Left (${Math.round(speed)} km/h)`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#334155', 'rgba(239,68,68,0.14)');
          const stepY = 16;
          c.fillStyle = '#1e293b';
          c.beginPath();
          for (let y = 0; y <= H; y += stepY) {
            const rc = roadAt(t + (490 - y) / 220);
            if (y === 0) c.moveTo(rc - 62, y);
            else c.lineTo(rc - 62, y);
          }
          for (let y = H; y >= 0; y -= stepY) {
            const rc = roadAt(t + (490 - y) / 220);
            c.lineTo(rc + 62, y);
          }
          c.closePath();
          c.fill();

          c.strokeStyle = '#f43f5e';
          c.lineWidth = 3;
          c.beginPath();
          for (let y = 0; y <= H; y += stepY) {
            const rc = roadAt(t + (490 - y) / 220);
            if (y === 0) c.moveTo(rc - 62, y);
            else c.lineTo(rc - 62, y);
          }
          c.stroke();
          c.beginPath();
          for (let y = 0; y <= H; y += stepY) {
            const rc = roadAt(t + (490 - y) / 220);
            if (y === 0) c.moveTo(rc + 62, y);
            else c.lineTo(rc + 62, y);
          }
          c.stroke();

          updateAndDrawBursts(c, bursts, lastDt);
          drawCarSprite(c, cx, 490, driftingRight ? 0.28 : -0.28, '#ef4444', '#fde047', {
            spoiler: true,
            headlights: true,
            scale: 1.05,
          });
        },
      };
    },
  },
  {
    id: 'crossy-highway',
    num: 48,
    title: 'Crossy Highway',
    icon: '🐔',
    category: 'runners',
    color: '#facc15',
    controlsHint: 'Tap TOP to hop forward or LEFT/RIGHT to sidestep traffic!',
    desc: 'Cross busy highways packed with speeding cars.',
    create(rt): MiniGameInstance {
      let row = 0;
      let col = 4;
      let camRow = 0;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const lanes = Array.from({ length: 14 }, (_, idx) => ({
        row: idx,
        road: idx > 0 && idx % 4 !== 0,
        vx: (idx % 2 ? 1 : -1) * rand(90, 210),
        cars: [rand(0, W), rand(0, W) + 210],
      }));
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            if (inp.y < 360) row++;
            else if (inp.x < W / 2) col = Math.max(0, col - 1);
            else col = Math.min(8, col + 1);
            spawnBurst(bursts, col * 46 + 24, 560 - (row - camRow) * 52, '#fde047', 4, 0.4);
            rt.sfx.tap();
            if (row > score) {
              score = row;
              rt.setScore(score * 10);
            }
            if (row - camRow > 4) camRow = row - 4;
          }
          for (const l of lanes) {
            if (l.row < camRow - 2) {
              l.row += 14;
              l.road = l.row % 4 !== 0;
            }
            if (!l.road) continue;
            for (let i = 0; i < l.cars.length; i++) {
              l.cars[i] = (l.cars[i] + l.vx * dt + W + 120) % (W + 120) - 60;
              if (l.row === row && Math.abs(l.cars[i] - (col * 46 + 24)) < 32) {
                rt.sfx.explode();
                rt.endGame(score * 10, `Run over after ${score} hops!`);
                return;
              }
            }
          }
          rt.setStatus(`Hops forward: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#090d16');
          for (const l of lanes) {
            const sy = 560 - (l.row - camRow) * 52;
            if (sy < -50 || sy > H + 50) continue;
            drawRoundedBox(c, 0, sy - 24, W, 50, 0, l.road ? '#334155' : '#16a34a');
            if (l.road) {
              for (const cx of l.cars) {
                drawCarSprite(
                  c,
                  cx,
                  sy,
                  l.vx > 0 ? Math.PI / 2 : -Math.PI / 2,
                  l.vx > 0 ? '#facc15' : '#3b82f6',
                  l.vx > 0 ? '#0f172a' : '#f8fafc',
                  { taxi: l.vx > 0, headlights: true, scale: 0.88 }
                );
              }
            }
          }
          updateAndDrawBursts(c, bursts, lastDt);
          drawBadgeText(c, '🐔', col * 46 + 24, 560 - (row - camRow) * 52, '#fff', 32);
        },
      };
    },
  },
  {
    id: 'subway-lane-runner',
    num: 49,
    title: 'Subway Lane Runner',
    icon: '🛹',
    category: 'runners',
    color: '#38bdf8',
    controlsHint: 'Tap any of the 3 tracks to switch lanes — grab coins & dodge trains!',
    desc: 'High-speed 3-lane runner through subway tunnels.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      let time = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const laneX = (l: number) => 85 + l * 125;
      const trains = Array.from({ length: 5 }, (_, i) => ({
        lane: i % 3,
        y: -i * 155,
        coin: i % 2 === 0,
      }));
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          if (inp.justPressed) {
            lane = clamp(Math.floor(inp.x / (W / 3)), 0, 2);
            rt.sfx.tap();
          }
          score += Math.round(dt * 12);
          rt.setScore(score);
          const spd = 250 + score * 0.4;
          for (const tr of trains) {
            tr.y += spd * dt;
            if (tr.lane === lane && Math.abs(tr.y - 520) < 34) {
              if (tr.coin) {
                score += 30;
                spawnBurst(bursts, laneX(lane), 520, '#fde047', 10);
                spawnPopup(popups, laneX(lane), 490, '+30 🪙', '#fde047');
                tr.y = -120;
                tr.lane = Math.floor(Math.random() * 3);
                rt.sfx.score();
              } else {
                rt.sfx.explode();
                rt.endGame(score, `Hit a subway train at ${score} pt!`);
                return;
              }
            }
            if (tr.y > H + 50) {
              tr.y = -rand(60, 180);
              tr.lane = Math.floor(Math.random() * 3);
              tr.coin = Math.random() < 0.35;
            }
          }
          rt.setStatus(`Distance + Coins: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b', 'rgba(56,189,248,0.14)');
          for (let l = 0; l < 3; l++) drawRoundedBox(c, laneX(l) - 36, 0, 72, H, 0, 'rgba(255,255,255,0.05)');
          for (const tr of trains) {
            if (tr.coin) drawBadgeText(c, '🪙', laneX(tr.lane), tr.y, '#fff', 32);
            else drawTrainSprite(c, laneX(tr.lane), tr.y, '#ef4444', '#fde047');
          }
          drawCharacterSprite(c, laneX(lane), 520, {
            style: 'runner',
            suitColor: '#38bdf8',
            accentColor: '#f43f5e',
            stride: time * 14,
            action: 'idle',
            scale: 1.15,
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'floor-is-lava',
    num: 50,
    title: 'Floor Is Lava',
    icon: '🌋',
    category: 'runners',
    color: '#ef4444',
    controlsHint: 'Drag left/right to bounce higher while the lava rises!',
    desc: 'The floor is molten lava! Bounce upward across platforms.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = 460;
      let vy = -440;
      let lavaY = H + 20;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const furn = Array.from({ length: 10 }, (_, i) => ({ x: rand(25, W - 105), y: 510 - i * 62, w: 85 }));
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) px += clamp((inp.x - px) * 10, -340, 340) * dt;
          px = clamp(px, 20, W - 20);
          vy += 940 * dt;
          py += vy * dt;
          lavaY -= (26 + score * 0.08) * dt;
          if (vy > 0) {
            for (const f of furn) {
              if (px >= f.x - 10 && px <= f.x + f.w + 10 && py >= f.y - 14 && py <= f.y + 14) {
                vy = -540;
                py = f.y - 10;
                spawnBurst(bursts, px, f.y, '#fde047', 7, 0.55);
                rt.sfx.tap();
                break;
              }
            }
          }
          if (py < 260) {
            const d = 260 - py;
            py = 260;
            lavaY += d;
            score += Math.round(d / 3);
            rt.setScore(score);
            for (const f of furn) {
              f.y += d;
              if (f.y > H + 30) {
                f.y -= 620;
                f.x = rand(25, W - 105);
              }
            }
          }
          if (py > lavaY - 12 || py > H + 20) {
            rt.sfx.explode();
            rt.endGame(score, `Fell into the lava at ${score} pt!`);
            return;
          }
          rt.setStatus(`Height above lava: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#450a0a', '#7c2d12', 'rgba(239,68,68,0.2)');
          for (const f of furn) drawRoundedBox(c, f.x, f.y, f.w, 14, 6, '#facc15', '#78350f');
          drawCharacterSprite(c, px, py - 14, {
            style: 'runner',
            suitColor: '#f97316',
            accentColor: '#fde047',
            action: vy < 0 ? 'jump' : 'idle',
            scale: 1.05,
          });
          drawRoundedBox(c, 0, lavaY, W, H - lavaY + 40, 0, '#ef4444', '#fde047', '#ef4444');
          updateAndDrawBursts(c, bursts, lastDt);
        },
      };
    },
  },
];
