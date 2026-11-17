import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  clamp,
  drawBadgeText,
  drawCircle,
  drawGradientBg,
  drawLives,
  drawRoundedBox,
  rand,
} from '../game/engineHelpers';

export const GROUP_07_PHYSICS: MiniGameDef[] = [
  {
    id: 'breakout-neon',
    num: 61,
    title: 'Breakout Neon',
    icon: '🧱',
    category: 'physics',
    color: '#38bdf8',
    controlsHint: 'Drag the neon paddle left and right to smash every brick!',
    desc: 'Classic brick breaker with escalating ball speed.',
    create(rt): MiniGameInstance {
      let padX = W / 2;
      let bx = W / 2;
      let by = 450;
      let vx = 180;
      let vy = -290;
      let score = 0;
      let lives = 3;
      const cols = ['#ef4444', '#fb923c', '#facc15', '#22c55e', '#38bdf8'];
      let bricks: { x: number; y: number; color: string }[] = [];
      const initBricks = () => {
        bricks = [];
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 6; c++) bricks.push({ x: 24 + c * 64, y: 90 + r * 30, color: cols[r] });
        }
      };
      initBricks();
      return {
        update(dt, inp) {
          if (inp.down) padX = clamp(inp.x, 48, W - 48);
          bx += vx * dt;
          by += vy * dt;
          if (bx < 10 || bx > W - 10) {
            vx *= -1;
            bx = clamp(bx, 10, W - 10);
          }
          if (by < 65) {
            vy = Math.abs(vy);
            by = 65;
          }
          if (vy > 0 && by >= 550 && by <= 570 && Math.abs(bx - padX) < 54) {
            vy = -Math.abs(vy) * 1.02;
            vx = (bx - padX) * 5.2;
            rt.sfx.tap();
          }
          for (let i = bricks.length - 1; i >= 0; i--) {
            const b = bricks[i];
            if (bx > b.x - 6 && bx < b.x + 62 && by > b.y - 6 && by < b.y + 26) {
              bricks.splice(i, 1);
              vy *= -1;
              score += 20;
              rt.setScore(score);
              rt.sfx.score();
              break;
            }
          }
          if (bricks.length === 0) {
            score += 100;
            rt.setScore(score);
            rt.sfx.win();
            initBricks();
          }
          if (by > H + 20) {
            lives--;
            rt.sfx.hit();
            if (lives <= 0) {
              rt.endGame(score, `Breakout final score: ${score}`);
              return;
            }
            bx = padX;
            by = 460;
            vx = 180;
            vy = -290;
          }
          rt.setStatus(`Bricks left: ${bricks.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e1b4b');
          for (const b of bricks) drawRoundedBox(c, b.x, b.y, 56, 20, 4, b.color);
          drawRoundedBox(c, padX - 46, 558, 92, 14, 7, '#38bdf8', '#fff');
          drawCircle(c, bx, by, 8, '#fde047', '#fff');
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'pool-trickshot',
    num: 62,
    title: 'Pool Trickshot',
    icon: '🎱',
    category: 'physics',
    color: '#15803d',
    controlsHint: 'Drag back from the cue ball to sink all red balls!',
    desc: 'Pocket billiards puzzle with bank shots and combos.',
    create(rt): MiniGameInstance {
      let wx = W / 2;
      let wy = 480;
      let wvx = 0;
      let wvy = 0;
      let drag = false;
      let aim = { x: wx, y: wy };
      let score = 0;
      let shots = 8;
      let balls = [
        { x: W / 2, y: 240, vx: 0, vy: 0 },
        { x: 140, y: 190, vx: 0, vy: 0 },
        { x: 280, y: 190, vx: 0, vy: 0 },
      ];
      const pockets = [
        { x: 34, y: 78 },
        { x: W - 34, y: 78 },
        { x: 34, y: H - 34 },
        { x: W - 34, y: H - 34 },
      ];
      return {
        update(dt, inp) {
          const moving = Math.hypot(wvx, wvy) > 8 || balls.some((b) => Math.hypot(b.vx, b.vy) > 8);
          if (!moving) {
            if (shots <= 0) {
              rt.endGame(score, `Out of shots! Score: ${score}`);
              return;
            }
            if (inp.down) {
              drag = true;
              aim = { x: inp.x, y: inp.y };
            }
            if (inp.justReleased && drag) {
              drag = false;
              wvx = clamp((wx - aim.x) * 3.8, -560, 560);
              wvy = clamp((wy - aim.y) * 3.8, -560, 560);
              shots--;
              rt.sfx.tap();
            }
          }
          const stepBall = (b: { x: number; y: number; vx: number; vy: number }) => {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.vx *= Math.pow(0.28, dt);
            b.vy *= Math.pow(0.28, dt);
            if (b.x < 34 || b.x > W - 34) {
              b.vx *= -0.88;
              b.x = clamp(b.x, 34, W - 34);
            }
            if (b.y < 78 || b.y > H - 34) {
              b.vy *= -0.88;
              b.y = clamp(b.y, 78, H - 34);
            }
          };
          const white = { x: wx, y: wy, vx: wvx, vy: wvy };
          stepBall(white);
          wx = white.x;
          wy = white.y;
          wvx = white.vx;
          wvy = white.vy;
          for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            stepBall(b);
            const dx = b.x - wx;
            const dy = b.y - wy;
            const d = Math.hypot(dx, dy);
            if (d > 0 && d < 24) {
              const nx = dx / d;
              const ny = dy / d;
              b.vx += wvx * 0.75 + nx * 90;
              b.vy += wvy * 0.75 + ny * 90;
              wvx *= 0.45;
              wvy *= 0.45;
              rt.sfx.tap();
            }
            if (pockets.some((p) => Math.hypot(b.x - p.x, b.y - p.y) < 26)) {
              balls.splice(i, 1);
              score += 100;
              shots += 2;
              rt.setScore(score);
              rt.sfx.win();
            }
          }
          if (balls.length === 0) {
            balls = [
              { x: rand(90, 330), y: rand(140, 320), vx: 0, vy: 0 },
              { x: rand(90, 330), y: rand(140, 320), vx: 0, vy: 0 },
              { x: rand(90, 330), y: rand(140, 320), vx: 0, vy: 0 },
            ];
          }
          rt.setStatus(`Shots left: ${shots}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#78350f', '#451a03');
          drawRoundedBox(c, 22, 66, W - 44, H - 88, 12, '#15803d', '#92400e');
          for (const p of pockets) drawCircle(c, p.x, p.y, 18, '#020617');
          for (const b of balls) drawCircle(c, b.x, b.y, 12, '#ef4444', '#fff');
          if (drag) {
            c.strokeStyle = '#fde047';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(wx, wy);
            c.lineTo(wx + (wx - aim.x), wy + (wy - aim.y));
            c.stroke();
          }
          drawCircle(c, wx, wy, 12, '#f8fafc', '#cbd5e1');
        },
      };
    },
  },
  {
    id: 'plinko-fair-drop',
    num: 63,
    title: 'Plinko Fair Drop',
    icon: '🟡',
    category: 'physics',
    color: '#facc15',
    controlsHint: 'Tap near the top to drop golden balls through the pegs!',
    desc: 'Free arcade Plinko: pick the best drop lane for 100-pt slots.',
    create(rt): MiniGameInstance {
      const pegs: { x: number; y: number }[] = [];
      for (let r = 0; r < 7; r++) {
        const cols = 6 + (r % 2);
        const offset = (W - (cols - 1) * 52) / 2;
        for (let c = 0; c < cols; c++) pegs.push({ x: offset + c * 52, y: 150 + r * 54 });
      }
      const balls: { x: number; y: number; vx: number; vy: number }[] = [];
      let ammo = 15;
      let score = 0;
      const mults = [5, 20, 50, 100, 50, 20, 5];
      return {
        update(dt, inp) {
          if (inp.justPressed && ammo > 0) {
            balls.push({ x: clamp(inp.x, 45, W - 45), y: 95, vx: rand(-25, 25), vy: 40 });
            ammo--;
            rt.sfx.tap();
          }
          for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            b.vy += 650 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 18 || b.x > W - 18) {
              b.vx *= -0.7;
              b.x = clamp(b.x, 18, W - 18);
            }
            for (const pg of pegs) {
              const dx = b.x - pg.x;
              const dy = b.y - pg.y;
              const d = Math.hypot(dx, dy);
              if (d < 15) {
                const nx = dx / Math.max(1, d);
                const ny = dy / Math.max(1, d);
                b.x = pg.x + nx * 16;
                b.y = pg.y + ny * 16;
                b.vx = nx * 140 + rand(-25, 25);
                b.vy = -Math.abs(b.vy * 0.45);
                rt.sfx.tap();
              }
            }
            if (b.y >= 540) {
              const slot = clamp(Math.floor((b.x / W) * 7), 0, 6);
              score += mults[slot];
              rt.setScore(score);
              rt.sfx.score();
              balls.splice(i, 1);
            }
          }
          if (ammo <= 0 && balls.length === 0) {
            rt.sfx.win();
            rt.endGame(score, `15 Plinko balls scored ${score} pt!`);
            return;
          }
          rt.setStatus(`Balls left: ${ammo} · Tap top to drop!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16');
          for (const pg of pegs) drawCircle(c, pg.x, pg.y, 6, '#e2e8f0');
          const sw = W / 7;
          mults.forEach((m, i) => {
            drawRoundedBox(c, i * sw + 3, 540, sw - 6, 48, 8, m === 100 ? '#facc15' : '#6366f1');
            drawBadgeText(c, `${m}`, i * sw + sw / 2, 564, m === 100 ? '#000' : '#fff', 16);
          });
          for (const b of balls) drawCircle(c, b.x, b.y, 9, '#fde047', '#fff');
        },
      };
    },
  },
  {
    id: 'ragdoll-cannon',
    num: 64,
    title: 'Ragdoll Cannon',
    icon: '🤸',
    category: 'physics',
    color: '#ef4444',
    controlsHint: 'Aim and release to launch the stuntman through the golden ring!',
    desc: 'Launch the stuntman in one clean arc onto the crash mat.',
    create(rt): MiniGameInstance {
      let drag = false;
      let aim = { x: 140, y: 400 };
      let dummy: { x: number; y: number; vx: number; vy: number } | null = null;
      let hoop = { x: 220, y: 240, hit: false };
      let mat = { x: 330, y: 500 };
      let score = 0;
      let lives = 5;
      return {
        update(dt, inp) {
          if (!dummy) {
            if (inp.down) {
              drag = true;
              aim = { x: inp.x, y: inp.y };
            }
            if (inp.justReleased && drag) {
              drag = false;
              dummy = {
                x: 65,
                y: 480,
                vx: clamp((aim.x - 65) * 2.5, 90, 480),
                vy: clamp((aim.y - 480) * 2.5, -580, -80),
              };
              rt.sfx.tap();
            }
          } else {
            dummy.vy += 650 * dt;
            dummy.x += dummy.vx * dt;
            dummy.y += dummy.vy * dt;
            if (!hoop.hit && Math.hypot(dummy.x - hoop.x, dummy.y - hoop.y) < 34) {
              hoop.hit = true;
              score += 50;
              rt.setScore(score);
              rt.sfx.score();
            }
            if (dummy.y >= 490 && Math.abs(dummy.x - mat.x) < 48) {
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
              dummy = null;
              hoop = { x: rand(160, 260), y: rand(180, 330), hit: false };
              mat = { x: rand(260, 360), y: 500 };
            } else if (dummy.x > W + 30 || dummy.y > H + 30) {
              dummy = null;
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Stunt show complete: ${score} pt!`);
                return;
              }
            }
          }
          rt.setStatus(`Stunt lives: ${lives}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0ea5e9', '#1e293b');
          drawRoundedBox(c, 0, 520, W, 120, 0, '#334155');
          drawCircle(c, hoop.x, hoop.y, 28, 'rgba(0,0,0,0)', hoop.hit ? '#22c55e' : '#facc15');
          drawRoundedBox(c, mat.x - 42, 502, 84, 18, 6, '#ef4444', '#fff');
          drawBadgeText(c, '💣', 65, 495, '#fff', 36);
          if (drag && !dummy) {
            c.strokeStyle = '#fde047';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(65, 480);
            c.lineTo(aim.x, aim.y);
            c.stroke();
          }
          if (dummy) drawBadgeText(c, '🤸', dummy.x, dummy.y, '#fff', 32);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'balance-beam-scale',
    num: 65,
    title: 'Balance Beam Scale',
    icon: '⚖️',
    category: 'physics',
    color: '#22d3ee',
    controlsHint: 'Hold LEFT or RIGHT to tilt the beam and balance the ball!',
    desc: 'Keep the steel ball balanced against shifting gusts.',
    create(rt): MiniGameInstance {
      let tilt = 0;
      let ballPos = 0; // -1..1
      let ballVel = 0;
      let score = 0;
      let windT = 0;
      return {
        update(dt, inp) {
          windT += dt;
          if (inp.down) tilt = clamp(tilt + (inp.x < W / 2 ? -2.2 : 2.2) * dt, -0.5, 0.5);
          else tilt *= Math.pow(0.2, dt);
          const push = Math.sin(windT * 1.9) * 0.65;
          ballVel += (Math.sin(tilt) * 3.4 + push) * dt;
          ballPos += ballVel * dt;
          score += Math.round(dt * 25);
          rt.setScore(score);
          if (Math.abs(ballPos) > 1.02) {
            rt.sfx.hit();
            rt.endGame(score, `Lost balance at ${score} pt!`);
            return;
          }
          rt.setStatus(`Balance: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#083344');
          const cx = W / 2;
          const cy = 360;
          c.save();
          c.translate(cx, cy);
          c.rotate(tilt);
          drawRoundedBox(c, -155, -8, 310, 16, 8, '#38bdf8', '#fff');
          drawCircle(c, ballPos * 145, -22, 16, '#facc15', '#fff');
          c.restore();
          drawBadgeText(c, '🔺', cx, cy + 20, '#fff', 30);
        },
      };
    },
  },
  {
    id: 'bubble-shooter-pop',
    num: 66,
    title: 'Bubble Shooter Pop',
    icon: '🫧',
    category: 'physics',
    color: '#ec4899',
    controlsHint: 'Tap upward to shoot colored bubbles at matching clusters!',
    desc: 'Pop matching bubbles in chain reactions before they drop.',
    create(rt): MiniGameInstance {
      const cols = ['#ef4444', '#38bdf8', '#22c55e', '#facc15'];
      const bubbles: { x: number; y: number; ci: number }[] = [];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 7; c++) {
          bubbles.push({ x: 46 + c * 54, y: 100 + r * 44, ci: Math.floor(Math.random() * 4) });
        }
      }
      let nextCi = Math.floor(Math.random() * 4);
      let shot: { x: number; y: number; vx: number; vy: number; ci: number } | null = null;
      let score = 0;
      return {
        update(dt, inp) {
          if (!shot && inp.justPressed && inp.y < 520) {
            const ang = Math.atan2(inp.y - 560, inp.x - W / 2);
            shot = { x: W / 2, y: 560, vx: Math.cos(ang) * 460, vy: Math.sin(ang) * 460, ci: nextCi };
            nextCi = Math.floor(Math.random() * 4);
            rt.sfx.tap();
          }
          if (shot) {
            shot.x += shot.vx * dt;
            shot.y += shot.vy * dt;
            if (shot.x < 24 || shot.x > W - 24) shot.vx *= -1;
            const hit = bubbles.find((b) => Math.hypot(b.x - shot!.x, b.y - shot!.y) < 34);
            if (hit || shot.y < 85) {
              const sx = shot.x;
              const sy = shot.y;
              const sci = shot.ci;
              shot = null;
              if (hit && hit.ci === sci) {
                for (let i = bubbles.length - 1; i >= 0; i--) {
                  if (bubbles[i].ci === sci && Math.hypot(bubbles[i].x - hit.x, bubbles[i].y - hit.y) < 88) {
                    bubbles.splice(i, 1);
                    score += 25;
                  }
                }
                rt.setScore(score);
                rt.sfx.score();
              } else {
                bubbles.push({ x: sx, y: sy, ci: sci });
              }
              if (bubbles.length === 0) {
                rt.sfx.win();
                rt.endGame(score + 200, `Board cleared! Score: ${score + 200}`);
                return;
              }
              if (bubbles.some((b) => b.y > 500)) {
                rt.sfx.hit();
                rt.endGame(score, `Bubbles too low! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Bubbles left: ${bubbles.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16');
          for (const b of bubbles) drawCircle(c, b.x, b.y, 19, cols[b.ci], '#fff');
          if (shot) drawCircle(c, shot.x, shot.y, 17, cols[shot.ci], '#fff');
          drawCircle(c, W / 2, 560, 20, cols[nextCi], '#fff');
        },
      };
    },
  },
  {
    id: 'magnet-pull-maze',
    num: 67,
    title: 'Magnet Pull Maze',
    icon: '🧲',
    category: 'physics',
    color: '#ef4444',
    controlsHint: 'Hold anywhere to pull the steel ball toward your magnet!',
    desc: 'Guide the steel ball past spinning sawblades into the portal.',
    create(rt): MiniGameInstance {
      let bx = 70;
      let by = 520;
      let vx = 0;
      let vy = 0;
      let goal = { x: 340, y: 120 };
      let score = 0;
      let t = 0;
      let saws = [
        { x: 210, y: 360, r: 24 },
        { x: 160, y: 210, r: 24 },
      ];
      return {
        update(dt, inp) {
          t += dt;
          if (inp.down) {
            const dx = inp.x - bx;
            const dy = inp.y - by;
            const d = Math.max(20, Math.hypot(dx, dy));
            vx += (dx / d) * 420 * dt;
            vy += (dy / d) * 420 * dt;
          }
          bx = clamp(bx + vx * dt, 24, W - 24);
          by = clamp(by + vy * dt, 80, H - 24);
          vx *= Math.pow(0.3, dt);
          vy *= Math.pow(0.3, dt);

          for (const s of saws) {
            if (Math.hypot(bx - s.x, by - s.y) < s.r + 14) {
              rt.sfx.explode();
              rt.endGame(score, `Hit a sawblade at ${score} pt!`);
              return;
            }
          }
          if (Math.hypot(bx - goal.x, by - goal.y) < 30) {
            score += 100;
            rt.setScore(score);
            rt.sfx.win();
            bx = rand(50, 120);
            by = rand(480, 560);
            vx = 0;
            vy = 0;
            goal = { x: rand(260, 360), y: rand(100, 180) };
            saws = [
              { x: rand(120, 300), y: rand(240, 420), r: 24 },
              { x: rand(120, 300), y: rand(180, 340), r: 24 },
            ];
          }
          rt.setStatus('Hold screen = magnet pull');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#090d16');
          drawCircle(c, goal.x, goal.y, 26, '#22c55e', '#fff');
          drawBadgeText(c, '🌀', goal.x, goal.y, '#fff', 30);
          for (const s of saws) {
            drawCircle(c, s.x, s.y, s.r, '#ef4444', '#fde047');
            drawBadgeText(c, '⚙️', s.x, s.y, '#fff', 26);
          }
          drawCircle(c, bx, by, 14, '#cbd5e1', '#38bdf8');
        },
      };
    },
  },
  {
    id: '2048-turbo',
    num: 68,
    title: '2048 Turbo',
    icon: '🔢',
    category: 'puzzles',
    color: '#f59e0b',
    controlsHint: 'Swipe up/down/left/right to merge matching tiles toward 2048!',
    desc: 'Classic sliding number puzzle — merge tiles to climb higher.',
    create(rt): MiniGameInstance {
      const grid = Array(16).fill(0);
      let score = 0;
      const addTile = () => {
        const empty = grid.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
        if (empty.length) grid[empty[Math.floor(Math.random() * empty.length)]] = Math.random() < 0.85 ? 2 : 4;
      };
      addTile();
      addTile();
      const slideLine = (vals: number[]) => {
        const nz = vals.filter((v) => v > 0);
        const res: number[] = [];
        for (let i = 0; i < nz.length; i++) {
          if (nz[i] === nz[i + 1]) {
            const sum = nz[i] * 2;
            res.push(sum);
            score += sum;
            i++;
          } else res.push(nz[i]);
        }
        while (res.length < 4) res.push(0);
        return res;
      };
      const move = (dir: 'up' | 'down' | 'left' | 'right') => {
        const before = grid.join(',');
        for (let i = 0; i < 4; i++) {
          let line: number[] = [];
          for (let j = 0; j < 4; j++) {
            const idx = dir === 'left' || dir === 'right' ? i * 4 + j : j * 4 + i;
            line.push(grid[idx]);
          }
          if (dir === 'right' || dir === 'down') line.reverse();
          let out = slideLine(line);
          if (dir === 'right' || dir === 'down') out.reverse();
          for (let j = 0; j < 4; j++) {
            const idx = dir === 'left' || dir === 'right' ? i * 4 + j : j * 4 + i;
            grid[idx] = out[j];
          }
        }
        if (grid.join(',') !== before) {
          addTile();
          rt.setScore(score);
          rt.sfx.score();
        }
      };
      return {
        update(_dt, inp) {
          if (inp.swipe) move(inp.swipe);
          rt.setStatus('Swipe any direction on the board');
        },
        onKey(k) {
          if (k === 'ArrowUp') move('up');
          if (k === 'ArrowDown') move('down');
          if (k === 'ArrowLeft') move('left');
          if (k === 'ArrowRight') move('right');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1c1917', '#090d16');
          drawRoundedBox(c, 25, 130, 370, 370, 14, '#292524', '#78350f');
          for (let rIdx = 0; rIdx < 4; rIdx++) {
            for (let cIdx = 0; cIdx < 4; cIdx++) {
              const v = grid[rIdx * 4 + cIdx];
              const x = 38 + cIdx * 89;
              const y = 143 + rIdx * 89;
              const fill = v === 0 ? '#44403c' : v >= 128 ? '#facc15' : v >= 16 ? '#fb923c' : '#fde68a';
              drawRoundedBox(c, x, y, 80, 80, 10, fill);
              if (v > 0) drawBadgeText(c, `${v}`, x + 40, y + 40, v >= 16 ? '#000' : '#1c1917', 24);
            }
          }
        },
      };
    },
  },
  {
    id: 'blockudoku-grid',
    num: 69,
    title: 'Blockudoku Grid',
    icon: '🟨',
    category: 'puzzles',
    color: '#38bdf8',
    controlsHint: 'Pick a piece below, then tap the 6x6 board to clear rows & columns!',
    desc: 'Clever block puzzle: fill full rows or columns for big combos.',
    create(rt): MiniGameInstance {
      const board = Array(36).fill(0);
      const shapes = [
        [[0, 0]],
        [[0, 0], [1, 0]],
        [[0, 0], [0, 1]],
        [[0, 0], [1, 0], [0, 1]],
        [[0, 0], [1, 0], [2, 0]],
      ];
      let hand = [0, 1, 3];
      let sel = 0;
      let score = 0;
      return {
        update(_dt, inp) {
          if (inp.justPressed) {
            if (inp.y > 470) {
              sel = clamp(Math.floor(inp.x / (W / 3)), 0, 2);
              rt.sfx.tap();
            } else if (inp.y >= 110 && inp.y <= 440) {
              const gx = Math.floor((inp.x - 45) / 55);
              const gy = Math.floor((inp.y - 110) / 55);
              const cells = shapes[hand[sel]];
              const ok = cells.every(([dx, dy]) => {
                const nx = gx + dx;
                const ny = gy + dy;
                return nx >= 0 && nx < 6 && ny >= 0 && ny < 6 && board[ny * 6 + nx] === 0;
              });
              if (ok) {
                for (const [dx, dy] of cells) board[(gy + dy) * 6 + (gx + dx)] = 1;
                score += cells.length * 10;
                // clear full rows/cols
                for (let r = 0; r < 6; r++) {
                  if ([0, 1, 2, 3, 4, 5].every((c) => board[r * 6 + c])) {
                    for (let c = 0; c < 6; c++) board[r * 6 + c] = 0;
                    score += 60;
                  }
                }
                for (let c = 0; c < 6; c++) {
                  if ([0, 1, 2, 3, 4, 5].every((r) => board[r * 6 + c])) {
                    for (let r = 0; r < 6; r++) board[r * 6 + c] = 0;
                    score += 60;
                  }
                }
                hand[sel] = Math.floor(Math.random() * shapes.length);
                rt.setScore(score);
                rt.sfx.score();
              } else rt.sfx.hit();
            }
          }
          rt.setStatus(`Piece #${sel + 1} selected · Tap board`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b');
          for (let rI = 0; rI < 6; rI++) {
            for (let cI = 0; cI < 6; cI++) {
              drawRoundedBox(c, 45 + cI * 55, 110 + rI * 55, 50, 50, 8, board[rI * 6 + cI] ? '#38bdf8' : '#334155');
            }
          }
          for (let i = 0; i < 3; i++) {
            drawRoundedBox(c, 22 + i * 130, 480, 116, 100, 12, i === sel ? 'rgba(250,204,21,0.22)' : '#1e293b', i === sel ? '#facc15' : '#475569');
            for (const [dx, dy] of shapes[hand[i]]) {
              drawRoundedBox(c, 52 + i * 130 + dx * 24, 505 + dy * 24, 20, 20, 4, '#facc15');
            }
          }
        },
      };
    },
  },
  {
    id: 'water-sort-lab',
    num: 70,
    title: 'Water Sort Lab',
    icon: '🧪',
    category: 'puzzles',
    color: '#2dd4bf',
    controlsHint: 'Tap a tube to pick up, then tap another tube to pour!',
    desc: 'Sort colored liquids until each tube holds one pure color.',
    create(rt): MiniGameInstance {
      const palette = ['#ef4444', '#38bdf8', '#facc15'];
      let tubes: number[][] = [];
      let selected: number | null = null;
      let score = 0;
      const makePuzzle = () => {
        const pool = [0, 0, 0, 1, 1, 1, 2, 2, 2].sort(() => Math.random() - 0.5);
        tubes = [pool.slice(0, 3), pool.slice(3, 6), pool.slice(6, 9), []];
        selected = null;
      };
      makePuzzle();
      return {
        update(_dt, inp) {
          if (inp.justPressed) {
            const idx = clamp(Math.floor((inp.x - 20) / ((W - 40) / 4)), 0, 3);
            if (selected === null) {
              if (tubes[idx].length > 0) {
                selected = idx;
                rt.sfx.tap();
              }
            } else {
              if (selected !== idx && tubes[idx].length < 3) {
                const top = tubes[selected][tubes[selected].length - 1];
                if (tubes[idx].length === 0 || tubes[idx][tubes[idx].length - 1] === top) {
                  tubes[idx].push(tubes[selected].pop() as number);
                  rt.sfx.score();
                  const solved = tubes.every((t) => t.length === 0 || (t.length === 3 && t.every((v) => v === t[0])));
                  if (solved) {
                    score += 100;
                    rt.setScore(score);
                    rt.sfx.win();
                    makePuzzle();
                  }
                } else rt.sfx.hit();
              }
              selected = null;
            }
          }
          rt.setStatus(selected !== null ? `Tube ${selected + 1} selected → tap target` : 'Tap a tube to pour');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#042f2e', '#090d16');
          tubes.forEach((t, idx) => {
            const bx = 46 + idx * 92;
            const by = selected === idx ? 215 : 235;
            drawRoundedBox(c, bx, by, 56, 195, 16, 'rgba(255,255,255,0.08)', selected === idx ? '#fde047' : '#94a3b8');
            t.forEach((colIdx, pos) => {
              drawRoundedBox(c, bx + 6, by + 135 - pos * 56, 44, 48, 8, palette[colIdx]);
            });
          });
        },
      };
    },
  },
];
