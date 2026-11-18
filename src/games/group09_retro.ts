import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCharacterSprite,
  drawCircle,
  drawGlowLine,
  drawGradientBg,
  drawLives,
  drawRoundedBox,
  drawShipSprite,
  drawStarfield,
  FloatingPopup,
  rand,
  spawnBurst,
  spawnPopup,
  updateAndDrawBursts,
  updateAndDrawPopups,
} from '../game/engineHelpers';

export const GROUP_09_RETRO: MiniGameDef[] = [
  {
    id: 'snake-neon-arena',
    num: 81,
    title: 'Snake Neon Arena',
    icon: '🐍',
    category: 'retro',
    color: '#22c55e',
    controlsHint: 'Swipe in any direction to steer your neon snake to apples!',
    desc: 'Classic neon snake without hitting walls or your tail.',
    create(rt): MiniGameInstance {
      const body = [
        { x: 10, y: 12 },
        { x: 9, y: 12 },
        { x: 8, y: 12 },
      ];
      let dir = { x: 1, y: 0 };
      let lastMovedDir = { x: 1, y: 0 };
      let food = { x: 15, y: 8 };
      let stepT = 0;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const steer = (dx: number, dy: number) => {
        if (dx !== -lastMovedDir.x || dy !== -lastMovedDir.y) {
          dir = { x: dx, y: dy };
        }
      };
      const spawnFood = () => {
        let tries = 0;
        let fx = 0;
        let fy = 0;
        do {
          fx = Math.floor(Math.random() * 20);
          fy = Math.floor(Math.random() * 24);
          tries++;
        } while (body.some((b) => b.x === fx && b.y === fy) && tries < 80);
        food = { x: fx, y: fy };
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.swipe === 'up') steer(0, -1);
          if (inp.swipe === 'down') steer(0, 1);
          if (inp.swipe === 'left') steer(-1, 0);
          if (inp.swipe === 'right') steer(1, 0);
          stepT += dt;
          if (stepT >= 0.125) {
            stepT = 0;
            lastMovedDir = { ...dir };
            const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
            if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 24 || body.some((b) => b.x === head.x && b.y === head.y)) {
              rt.sfx.explode();
              rt.endGame(score, `Snake crashed at length ${body.length}!`);
              return;
            }
            body.unshift(head);
            if (head.x === food.x && head.y === food.y) {
              const ax = 10 + food.x * 20 + 10;
              const ay = 80 + food.y * 20 + 10;
              spawnBurst(bursts, ax, ay, '#ef4444', 12);
              spawnPopup(popups, ax, ay - 12, '+20 🍎', '#fde047', 16);
              score += 20;
              rt.setScore(score);
              rt.sfx.score();
              spawnFood();
            } else body.pop();
          }
          rt.setStatus(`Length: ${body.length}`);
        },
        onKey(k) {
          if (k === 'ArrowUp') steer(0, -1);
          if (k === 'ArrowDown') steer(0, 1);
          if (k === 'ArrowLeft') steer(-1, 0);
          if (k === 'ArrowRight') steer(1, 0);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#064e3b', 'rgba(34,197,94,0.14)');
          drawRoundedBox(c, 10, 80, 400, 480, 10, '#090d16', '#22c55e');
          drawBadgeText(c, '🍎', 10 + food.x * 20 + 10, 80 + food.y * 20 + 10, '#fff', 18);
          for (let i = body.length - 1; i >= 0; i--) {
            const b = body[i];
            const isHead = i === 0;
            drawRoundedBox(c, 11 + b.x * 20, 81 + b.y * 20, 18, 18, isHead ? 6 : 5, isHead ? '#fde047' : '#22c55e', undefined, isHead ? '#facc15' : undefined);
            if (isHead) {
              const cx = 10 + b.x * 20 + 10;
              const cy = 80 + b.y * 20 + 10;
              c.fillStyle = '#090d16';
              const ex1 = cx + dir.x * 4 - dir.y * 3;
              const ey1 = cy + dir.y * 4 + dir.x * 3;
              const ex2 = cx + dir.x * 4 + dir.y * 3;
              const ey2 = cy + dir.y * 4 - dir.x * 3;
              c.fillRect(ex1 - 1.5, ey1 - 1.5, 3, 3);
              c.fillRect(ex2 - 1.5, ey2 - 1.5, 3, 3);
            }
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'paper-territory',
    num: 82,
    title: 'Paper Territory',
    icon: '🗺️',
    category: 'retro',
    color: '#ec4899',
    controlsHint: 'Swipe to loop outside your base and claim territory!',
    desc: 'Claim territory Paper.io-style while dodging rival bots.',
    create(rt): MiniGameInstance {
      const N = 20;
      const grid = Array(N * N).fill(0); // 1 = owned, 2 = trail
      for (let y = 8; y <= 11; y++) for (let x = 8; x <= 11; x++) grid[y * N + x] = 1;
      let gx = 9;
      let gy = 9;
      let dx = 1;
      let dy = 0;
      let lastDx = 1;
      let lastDy = 0;
      const bot = { x: 2, y: 2, dx: 1, dy: 0 };
      let stepT = 0;
      let score = 40;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const setDir = (ndx: number, ndy: number) => {
        if (ndx !== -lastDx || ndy !== -lastDy) {
          dx = ndx;
          dy = ndy;
        }
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.swipe === 'up') setDir(0, -1);
          if (inp.swipe === 'down') setDir(0, 1);
          if (inp.swipe === 'left') setDir(-1, 0);
          if (inp.swipe === 'right') setDir(1, 0);
          stepT += dt;
          if (stepT >= 0.14) {
            stepT = 0;
            lastDx = dx;
            lastDy = dy;
            gx = clamp(gx + dx, 0, N - 1);
            gy = clamp(gy + dy, 0, N - 1);
            const cur = grid[gy * N + gx];
            if (cur === 2) {
              rt.sfx.explode();
              rt.endGame(score, `Hit your own trail! Claimed: ${score} pt`);
              return;
            }
            if (cur === 1) {
              let claimed = 0;
              for (let i = 0; i < grid.length; i++) {
                if (grid[i] === 2) {
                  grid[i] = 1;
                  claimed++;
                }
              }
              if (claimed > 0) {
                spawnBurst(bursts, 20 + gx * 19 + 9, 120 + gy * 19 + 9, '#ec4899', 12);
                score = Math.round((grid.filter((v) => v === 1).length / (N * N)) * 1000);
                rt.setScore(score);
                rt.sfx.score();
              }
            } else grid[gy * N + gx] = 2;

            if (Math.random() < 0.25) {
              const dirs = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ];
              const dPick = dirs[Math.floor(Math.random() * 4)];
              bot.dx = dPick[0];
              bot.dy = dPick[1];
            }
            bot.x = clamp(bot.x + bot.dx, 0, N - 1);
            bot.y = clamp(bot.y + bot.dy, 0, N - 1);
            if (grid[bot.y * N + bot.x] === 2 || (bot.x === gx && bot.y === gy && grid[gy * N + gx] !== 1)) {
              rt.sfx.explode();
              rt.endGame(score, `Bot cut your trail! (${score} pt)`);
              return;
            }
          }
          rt.setStatus(`Territory: ${score} pt · Swipe to steer`);
        },
        onKey(k) {
          if (k === 'ArrowUp') setDir(0, -1);
          if (k === 'ArrowDown') setDir(0, 1);
          if (k === 'ArrowLeft') setDir(-1, 0);
          if (k === 'ArrowRight') setDir(1, 0);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b', 'rgba(236,72,153,0.12)');
          const cell = 19;
          for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
              const v = grid[y * N + x];
              drawRoundedBox(c, 20 + x * cell, 120 + y * cell, cell - 1, cell - 1, 2, v === 1 ? '#ec4899' : v === 2 ? '#f9a8d4' : '#334155');
            }
          }
          drawCircle(c, 20 + gx * cell + 9, 120 + gy * cell + 9, 9, '#fde047', '#fff', '#facc15');
          drawCircle(c, 20 + bot.x * cell + 9, 120 + bot.y * cell + 9, 9, '#38bdf8', '#fff', '#38bdf8');
          updateAndDrawBursts(c, bursts, lastDt);
        },
      };
    },
  },
  {
    id: 'pac-maze-chomp',
    num: 83,
    title: 'Pac-Maze Chomp',
    icon: '🟡',
    category: 'retro',
    color: '#facc15',
    controlsHint: 'Swipe to eat yellow pellets & dodge ghosts!',
    desc: 'Retro maze chase with corner power pellets.',
    create(rt): MiniGameInstance {
      const W_G = 11;
      const H_G = 11;
      const pellets = Array(W_G * H_G).fill(1);
      for (const idx of [13, 19, 25, 29, 39, 41, 79, 81, 91, 95, 101, 107]) pellets[idx] = 2; // 2=wall
      let px = 5;
      let py = 5;
      let dx = 1;
      let dy = 0;
      let powerT = 0;
      let score = 0;
      let time = 0;
      const ghosts = [
        { x: 0, y: 0, color: '#ef4444' },
        { x: 10, y: 0, color: '#38bdf8' },
        { x: 10, y: 10, color: '#f472b6' },
      ];
      let stepT = 0;
      const tryDir = (ndx: number, ndy: number) => {
        dx = ndx;
        dy = ndy;
      };
      const checkGhostHits = (): boolean => {
        for (const g of ghosts) {
          if (g.x === px && g.y === py) {
            if (powerT > 0) {
              score += 80;
              g.x = 5;
              g.y = 5;
              rt.setScore(score);
              rt.sfx.win();
            } else {
              rt.sfx.explode();
              rt.endGame(score, `Caught by a ghost! Score: ${score}`);
              return true;
            }
          }
        }
        return false;
      };
      return {
        update(dt, inp) {
          time += dt;
          if (inp.swipe === 'up') tryDir(0, -1);
          if (inp.swipe === 'down') tryDir(0, 1);
          if (inp.swipe === 'left') tryDir(-1, 0);
          if (inp.swipe === 'right') tryDir(1, 0);
          if (powerT > 0) powerT -= dt;
          stepT += dt;
          if (stepT >= 0.18) {
            stepT = 0;
            const nx = clamp(px + dx, 0, W_G - 1);
            const ny = clamp(py + dy, 0, H_G - 1);
            if (pellets[ny * W_G + nx] !== 2) {
              px = nx;
              py = ny;
            }
            if (checkGhostHits()) return;
            if (pellets[py * W_G + px] === 1) {
              pellets[py * W_G + px] = 0;
              score += 10;
              if ((px === 0 || px === 10) && (py === 0 || py === 10)) powerT = 5;
              rt.setScore(score);
              rt.sfx.score();
            }
            for (const g of ghosts) {
              const dirs = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ];
              const d = dirs[Math.floor(Math.random() * 4)];
              const gnx = clamp(g.x + d[0], 0, W_G - 1);
              const gny = clamp(g.y + d[1], 0, H_G - 1);
              if (pellets[gny * W_G + gnx] !== 2) {
                g.x = gnx;
                g.y = gny;
              }
            }
            if (checkGhostHits()) return;
            if (!pellets.some((v) => v === 1)) {
              for (let i = 0; i < pellets.length; i++) if (pellets[i] === 0) pellets[i] = 1;
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
            }
          }
          rt.setStatus(powerT > 0 ? `⚡ POWER: ${Math.ceil(powerT)}s` : 'Swipe to steer');
        },
        onKey(k) {
          if (k === 'ArrowUp') tryDir(0, -1);
          if (k === 'ArrowDown') tryDir(0, 1);
          if (k === 'ArrowLeft') tryDir(-1, 0);
          if (k === 'ArrowRight') tryDir(1, 0);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#1e1b4b', 'rgba(250,204,21,0.12)');
          const cell = 34;
          for (let y = 0; y < H_G; y++) {
            for (let x = 0; x < W_G; x++) {
              const v = pellets[y * W_G + x];
              const cx = 23 + x * cell + 17;
              const cy = 120 + y * cell + 17;
              if (v === 2) drawRoundedBox(c, 23 + x * cell + 2, 120 + y * cell + 2, cell - 4, cell - 4, 6, '#3b82f6', '#60a5fa');
              else if (v === 1) drawCircle(c, cx, cy, (x === 0 || x === 10) && (y === 0 || y === 10) ? 7 : 3, '#fde047');
            }
          }
          // Animated Pac-Man facing current direction
          const pcx = 23 + px * cell + 17;
          const pcy = 120 + py * cell + 17;
          const aim = Math.atan2(dy, dx);
          const mouth = 0.2 + Math.abs(Math.sin(time * 14)) * 0.45;
          c.save();
          c.fillStyle = '#facc15';
          c.shadowColor = '#facc15';
          c.shadowBlur = 10;
          c.beginPath();
          c.moveTo(pcx, pcy);
          c.arc(pcx, pcy, 14, aim + mouth, aim + Math.PI * 2 - mouth);
          c.closePath();
          c.fill();
          c.restore();
          for (const g of ghosts) {
            drawBadgeText(c, powerT > 0 ? '😨' : '👻', 23 + g.x * cell + 17, 120 + g.y * cell + 17, g.color, 24);
          }
        },
      };
    },
  },
  {
    id: 'tetris-sprint',
    num: 84,
    title: 'Tetris Sprint',
    icon: '🟦',
    category: 'retro',
    color: '#38bdf8',
    controlsHint: 'Tap LEFT · ROTATE · RIGHT or swipe down to hard-drop!',
    desc: 'Stack falling blocks and clear full horizontal rows.',
    create(rt): MiniGameInstance {
      const COLS = 8;
      const ROWS = 14;
      const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
      const shapes = [
        [[1, 1, 1, 1]],
        [[1, 1], [1, 1]],
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0], [1, 0], [1, 1]],
        [[1, 1, 0], [0, 1, 1]],
      ];
      let cur = shapes[0];
      let cx = 3;
      let cy = 0;
      let fallT = 0;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const fits = (mat: number[][], nx: number, ny: number) =>
        mat.every((row, r) =>
          row.every((v, c) => !v || (nx + c >= 0 && nx + c < COLS && ny + r < ROWS && (ny + r < 0 || !board[ny + r][nx + c])))
        );
      const rotateMat = (mat: number[][]) =>
        mat[0].map((_, c) => mat.map((row) => row[c]).reverse());
      const tryRotate = () => {
        const rot = rotateMat(cur);
        for (const kick of [0, -1, 1, -2, 2]) {
          if (fits(rot, cx + kick, cy)) {
            cur = rot;
            cx += kick;
            rt.sfx.tap();
            return;
          }
        }
      };
      const lock = () => {
        cur.forEach((row, r) =>
          row.forEach((v, c) => {
            if (v && cy + r >= 0) board[cy + r][cx + c] = 1;
          })
        );
        let cleared = 0;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].every((v) => v > 0)) {
            spawnBurst(bursts, W / 2, 95 + r * 32 + 16, '#22d3ee', 12);
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            score += 100;
            cleared++;
            r++;
            rt.sfx.score();
          }
        }
        if (cleared > 0) {
          spawnPopup(popups, W / 2, 260, `+${cleared * 100} LINE!`, '#fde047', 20);
        }
        score += 10;
        rt.setScore(score);
        cur = shapes[Math.floor(Math.random() * shapes.length)];
        cx = 3;
        cy = 0;
        if (!fits(cur, cx, cy)) {
          rt.sfx.explode();
          rt.endGame(score, `Topped out! Tetris Score: ${score}`);
        }
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.swipe === 'down') {
            while (fits(cur, cx, cy + 1)) cy++;
            lock();
            return;
          }
          if (inp.swipe === 'left' && fits(cur, cx - 1, cy)) {
            cx--;
            rt.sfx.tap();
          } else if (inp.swipe === 'right' && fits(cur, cx + 1, cy)) {
            cx++;
            rt.sfx.tap();
          } else if (inp.justReleased && !inp.swipe) {
            if (inp.x < W / 3 && fits(cur, cx - 1, cy)) {
              cx--;
              rt.sfx.tap();
            } else if (inp.x > (W * 2) / 3 && fits(cur, cx + 1, cy)) {
              cx++;
              rt.sfx.tap();
            } else {
              tryRotate();
            }
          }
          fallT += dt;
          if (fallT >= 0.45) {
            fallT = 0;
            if (fits(cur, cx, cy + 1)) cy++;
            else lock();
          }
          rt.setStatus('Tap L / Center(Rotate) / R · Swipe↓ Drop');
        },
        onKey(k) {
          if (k === 'ArrowLeft' && fits(cur, cx - 1, cy)) {
            cx--;
            rt.sfx.tap();
          } else if (k === 'ArrowRight' && fits(cur, cx + 1, cy)) {
            cx++;
            rt.sfx.tap();
          } else if (k === 'ArrowUp') {
            tryRotate();
          } else if (k === 'ArrowDown' || k === ' ') {
            while (fits(cur, cx, cy + 1)) cy++;
            lock();
          }
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e1b4b', 'rgba(56,189,248,0.14)');
          const cell = 32;
          const ox = (W - COLS * cell) / 2;
          const oy = 95;
          drawRoundedBox(c, ox - 4, oy - 4, COLS * cell + 8, ROWS * cell + 8, 8, '#0f172a', '#38bdf8');
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (board[y][x]) drawRoundedBox(c, ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2, 4, '#22d3ee');
            }
          }
          // Ghost drop preview
          let ghostY = cy;
          while (fits(cur, cx, ghostY + 1)) ghostY++;
          cur.forEach((row, ry) =>
            row.forEach((v, rx) => {
              if (v) drawRoundedBox(c, ox + (cx + rx) * cell + 2, oy + (ghostY + ry) * cell + 2, cell - 4, cell - 4, 4, 'rgba(250,204,21,0.18)', 'rgba(250,204,21,0.45)');
            })
          );
          cur.forEach((row, ry) =>
            row.forEach((v, rx) => {
              if (v) drawRoundedBox(c, ox + (cx + rx) * cell + 1, oy + (cy + ry) * cell + 1, cell - 2, cell - 2, 4, '#facc15', '#fff');
            })
          );
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'pong-twist',
    num: 85,
    title: 'Pong Twist',
    icon: '🏓',
    category: 'retro',
    color: '#22d3ee',
    controlsHint: 'Drag the bottom paddle left/right to smash past the AI!',
    desc: 'High-speed neon Pong duel.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let ax = W / 2;
      let bx = W / 2;
      let by = H / 2;
      let vx = 180;
      let vy = 260;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) px = clamp(inp.x, 50, W - 50);
          ax += clamp((bx - ax) * 5, -240, 240) * dt;
          bx += vx * dt;
          by += vy * dt;
          if (bx < 10 || bx > W - 10) {
            vx *= -1;
            bx = clamp(bx, 10, W - 10);
          }
          if (vy > 0 && by >= 550 && by <= 575 && Math.abs(bx - px) < 55) {
            vy = -clamp(Math.abs(vy) * 1.05, 240, 620);
            vx = clamp((bx - px) * 5.4, -400, 400);
            score += 10;
            rt.setScore(score);
            rt.sfx.tap();
            spawnBurst(bursts, bx, 560, '#22d3ee', 6, 0.45);
          } else if (vy < 0 && by <= 105 && by >= 85 && Math.abs(bx - ax) < 52) {
            vy = clamp(Math.abs(vy) * 1.03, 240, 620);
            spawnBurst(bursts, bx, 95, '#ef4444', 6, 0.45);
            rt.sfx.tap();
          }
          if (by < 55) {
            score += 80;
            rt.setScore(score);
            rt.sfx.win();
            spawnBurst(bursts, bx, 60, '#fde047', 14);
            spawnPopup(popups, W / 2, 160, 'GOAL! +80', '#fde047', 20);
            bx = W / 2;
            by = H / 2;
            vy = 260;
            vx = rand(-180, 180);
          } else if (by > H + 15) {
            lives--;
            rt.sfx.hit();
            if (lives <= 0) {
              rt.endGame(score, `Pong Duel over! Score: ${score}`);
              return;
            }
            bx = W / 2;
            by = H / 2;
            vy = -260;
          }
          rt.setStatus(`Rally Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#083344', 'rgba(34,211,238,0.14)');
          c.strokeStyle = 'rgba(255,255,255,0.18)';
          c.setLineDash([10, 10]);
          c.beginPath();
          c.moveTo(20, H / 2);
          c.lineTo(W - 20, H / 2);
          c.stroke();
          c.setLineDash([]);
          drawRoundedBox(c, ax - 45, 86, 90, 14, 7, '#ef4444', '#fff', '#ef4444');
          drawRoundedBox(c, px - 50, 560, 100, 14, 7, '#22d3ee', '#fff', '#22d3ee');
          drawCircle(c, bx, by, 10, '#fde047', '#fff', '#facc15');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'dig-dug-tunnel',
    num: 86,
    title: 'Dig Dug Tunnel',
    icon: '⛏️',
    category: 'retro',
    color: '#d97706',
    controlsHint: 'Swipe to dig underground tunnels & grab gems!',
    desc: 'Dig for underground gems while evading chasing monsters.',
    create(rt): MiniGameInstance {
      const dirt = Array.from({ length: 12 }, () => Array(9).fill(1));
      dirt[2][4] = 0;
      let px = 4;
      let py = 2;
      let dir: 1 | -1 = 1;
      let steps = 0;
      let gem = { x: 7, y: 9 };
      const monster = { x: 1, y: 9 };
      let score = 0;
      let stepT = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const move = (dx: number, dy: number) => {
        if (dx < 0) dir = -1;
        else if (dx > 0) dir = 1;
        px = clamp(px + dx, 0, 8);
        py = clamp(py + dy, 0, 11);
        steps++;
        if (dirt[py][px]) {
          dirt[py][px] = 0;
          score += 5;
          rt.setScore(score);
          spawnBurst(bursts, 42 + px * 42, 115 + py * 42, '#d97706', 5, 0.4);
        }
        rt.sfx.tap();
        if (monster.x === px && monster.y === py) {
          rt.sfx.explode();
          rt.endGame(score, `Caught underground! Score: ${score}`);
        }
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.swipe === 'up') move(0, -1);
          if (inp.swipe === 'down') move(0, 1);
          if (inp.swipe === 'left') move(-1, 0);
          if (inp.swipe === 'right') move(1, 0);
          if (monster.x === px && monster.y === py) return;
          if (px === gem.x && py === gem.y) {
            spawnBurst(bursts, 42 + gem.x * 42, 115 + gem.y * 42, '#38bdf8', 14);
            spawnPopup(popups, 42 + gem.x * 42, 95 + gem.y * 42, '+60 💎', '#fde047');
            score += 60;
            rt.setScore(score);
            rt.sfx.win();
            gem = { x: Math.floor(Math.random() * 9), y: Math.floor(Math.random() * 10) + 2 };
          }
          stepT += dt;
          if (stepT >= 0.35) {
            stepT = 0;
            if (Math.abs(px - monster.x) > Math.abs(py - monster.y)) {
              monster.x += Math.sign(px - monster.x);
            } else monster.y += Math.sign(py - monster.y);
            if (monster.x === px && monster.y === py) {
              rt.sfx.explode();
              rt.endGame(score, `Caught underground! Score: ${score}`);
              return;
            }
          }
          rt.setStatus('Swipe to dig & grab 💎!');
        },
        onKey(k) {
          if (k === 'ArrowUp') move(0, -1);
          if (k === 'ArrowDown') move(0, 1);
          if (k === 'ArrowLeft') move(-1, 0);
          if (k === 'ArrowRight') move(1, 0);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#451a03', '#1c1917');
          for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 9; x++) {
              drawRoundedBox(c, 22 + x * 42, 95 + y * 42, 40, 40, 4, dirt[y][x] ? '#92400e' : '#1c1917');
            }
          }
          drawBadgeText(c, '💎', 42 + gem.x * 42, 115 + gem.y * 42, '#fff', 26);
          drawCharacterSprite(c, 42 + monster.x * 42, 115 + monster.y * 42, {
            style: 'monster',
            suitColor: '#dc2626',
            accentColor: '#fde047',
            dir: px >= monster.x ? 1 : -1,
            stride: stepT * 10,
            scale: 0.78,
          });
          drawCharacterSprite(c, 42 + px * 42, 115 + py * 42, {
            style: 'worker',
            suitColor: '#38bdf8',
            accentColor: '#fde047',
            dir,
            stride: steps * 1.4,
            scale: 0.78,
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'qix-line-cutter',
    num: 87,
    title: 'Qix Line Cutter',
    icon: '✂️',
    category: 'retro',
    color: '#a855f7',
    controlsHint: 'Tap to slice horizontally when the bouncing spark is clear!',
    desc: 'Shrink the arena past 75% without touching the spark.',
    create(rt): MiniGameInstance {
      let box = { x: 30, y: 100, w: W - 60, h: 460 };
      const spark = { x: W / 2, y: 300, vx: 175, vy: 195 };
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const totalArea = (W - 60) * 460;
      return {
        update(dt, inp) {
          lastDt = dt;
          spark.x += spark.vx * dt;
          spark.y += spark.vy * dt;
          if (spark.x < box.x + 14 || spark.x > box.x + box.w - 14) {
            spark.vx *= -1;
            spark.x = clamp(spark.x, box.x + 14, box.x + box.w - 14);
          }
          if (spark.y < box.y + 14 || spark.y > box.y + box.h - 14) {
            spark.vy *= -1;
            spark.y = clamp(spark.y, box.y + 14, box.y + box.h - 14);
          }
          if (inp.justPressed && inp.y > box.y + 20 && inp.y < box.y + box.h - 20) {
            if (Math.abs(spark.y - inp.y) < 32) {
              rt.sfx.explode();
              rt.endGame(score, `Spark hit your slice line! (${score} pt)`);
              return;
            }
            spawnBurst(bursts, W / 2, inp.y, '#a855f7', 12);
            if (spark.y < inp.y) box.h = inp.y - box.y;
            else {
              box.h = box.y + box.h - inp.y;
              box.y = inp.y;
            }
            const pct = Math.round((1 - (box.w * box.h) / totalArea) * 100);
            score = pct * 10;
            rt.setScore(score);
            rt.sfx.score();
            if (pct >= 75) {
              score += 250;
              rt.setScore(score);
              rt.sfx.win();
              box = { x: 30, y: 100, w: W - 60, h: 460 };
              spark.vx *= 1.15;
              spark.vy *= 1.15;
            }
          }
          rt.setStatus('Tap a line to slice the arena!');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#3b0764', '#090d16', 'rgba(168,85,247,0.16)');
          drawRoundedBox(c, 30, 100, W - 60, 460, 10, '#1e1b4b', '#475569');
          drawRoundedBox(c, box.x, box.y, box.w, box.h, 8, '#090d16', '#a855f7');
          drawBadgeText(c, '⚡', spark.x, spark.y, '#fde047', 30);
          updateAndDrawBursts(c, bursts, lastDt);
        },
      };
    },
  },
  {
    id: 'missile-command-city',
    num: 88,
    title: 'Missile Command City',
    icon: '🏙️',
    category: 'retro',
    color: '#ef4444',
    controlsHint: 'Tap the night sky to intercept missiles above your 4 cities!',
    desc: 'Defend your 4 cities from incoming missile barrages.',
    create(rt): MiniGameInstance {
      const cities = [65, 160, 260, 355].map((x) => ({ x, alive: true }));
      const missiles: { sx: number; sy: number; x: number; y: number; vx: number; vy: number }[] = [];
      const blasts: { x: number; y: number; r: number; life: number }[] = [];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let spawnT = 0.6;
      let score = 0;
      let time = 0;
      let lastDt = 0.016;
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          if (inp.justPressed && inp.y < 520) {
            blasts.push({ x: inp.x, y: inp.y, r: 46, life: 0.45 });
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            const sx = rand(20, W - 20);
            const liveCities = cities.filter((c) => c.alive);
            const tx = liveCities.length > 0 ? liveCities[Math.floor(Math.random() * liveCities.length)].x : rand(40, W - 40);
            const dx = tx - sx;
            const dy = 565;
            const dist = Math.hypot(dx, dy);
            const spd = 80 + score * 0.25;
            missiles.push({ sx, sy: 0, x: sx, y: 0, vx: (dx / dist) * spd, vy: (dy / dist) * spd });
            spawnT = Math.max(0.35, 1.0 - score * 0.002);
          }
          for (let i = blasts.length - 1; i >= 0; i--) {
            blasts[i].life -= dt;
            if (blasts[i].life <= 0) blasts.splice(i, 1);
          }
          for (let i = missiles.length - 1; i >= 0; i--) {
            const m = missiles[i];
            m.x += m.vx * dt;
            m.y += m.vy * dt;
            if (blasts.some((b) => Math.hypot(b.x - m.x, b.y - m.y) < b.r)) {
              spawnBurst(bursts, m.x, m.y, '#38bdf8', 10);
              spawnPopup(popups, m.x, m.y - 10, '+20', '#7dd3fc', 15);
              missiles.splice(i, 1);
              score += 20;
              rt.setScore(score);
              rt.sfx.score();
              continue;
            }
            if (m.y >= 565) {
              const hit = cities.find((c) => c.alive && Math.abs(c.x - m.x) < 42);
              if (hit) {
                hit.alive = false;
                spawnBurst(bursts, hit.x, 560, '#ef4444', 18);
                rt.sfx.explode();
              }
              missiles.splice(i, 1);
              if (cities.every((c) => !c.alive)) {
                rt.endGame(score, `All cities destroyed! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Cities left: ${cities.filter((c) => c.alive).length}/4`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#1e1b4b', 'rgba(239,68,68,0.12)');
          drawStarfield(c, time, 28, 8);
          drawRoundedBox(c, 0, 575, W, 65, 0, '#14532d');
          for (const ct of cities) drawBadgeText(c, ct.alive ? '🏙️' : '🔥', ct.x, 560, '#fff', 36);
          for (const m of missiles) {
            drawGlowLine(c, m.sx, m.sy, m.x, m.y, '#ef4444', 3, '#ef4444');
            drawCircle(c, m.x, m.y, 4.5, '#fde047', '#fff');
          }
          for (const b of blasts) drawCircle(c, b.x, b.y, b.r * (b.life / 0.45), 'rgba(56,189,248,0.65)', '#fff', '#38bdf8');
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'bomber-grid',
    num: 89,
    title: 'Bomber Grid',
    icon: '💣',
    category: 'retro',
    color: '#fb923c',
    controlsHint: 'Swipe to move & tap to drop timed bombs on blocks and ghosts!',
    desc: 'Classic grid bomber: blast crates and clear ghost bots.',
    create(rt): MiniGameInstance {
      const bricks = Array.from({ length: 8 }, () => Array(8).fill(0));
      for (let i = 0; i < 16; i++) bricks[Math.floor(Math.random() * 6) + 2][Math.floor(Math.random() * 8)] = 1;
      bricks[0][0] = 0;
      let px = 0;
      let py = 0;
      let dir: 1 | -1 = 1;
      let steps = 0;
      const bombs: { x: number; y: number; t: number }[] = [];
      let foes = [
        { x: 7, y: 7 },
        { x: 7, y: 2 },
      ];
      let score = 0;
      let moveT = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const step = (dx: number, dy: number) => {
        if (dx < 0) dir = -1;
        else if (dx > 0) dir = 1;
        const nx = clamp(px + dx, 0, 7);
        const ny = clamp(py + dy, 0, 7);
        if (!bricks[ny][nx]) {
          px = nx;
          py = ny;
          steps++;
          rt.sfx.tap();
        }
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.swipe === 'up') step(0, -1);
          else if (inp.swipe === 'down') step(0, 1);
          else if (inp.swipe === 'left') step(-1, 0);
          else if (inp.swipe === 'right') step(1, 0);
          else if (inp.justReleased && !inp.swipe && bombs.length < 3) {
            bombs.push({ x: px, y: py, t: 1.5 });
            rt.sfx.tap();
          }
          for (let i = bombs.length - 1; i >= 0; i--) {
            bombs[i].t -= dt;
            if (bombs[i].t <= 0) {
              const b = bombs.splice(i, 1)[0];
              rt.sfx.explode();
              spawnBurst(bursts, 55 + b.x * 44, 151 + b.y * 44, '#fb923c', 18);
              for (let r = Math.max(0, b.y - 1); r <= Math.min(7, b.y + 1); r++) bricks[r][b.x] = 0;
              for (let c = Math.max(0, b.x - 1); c <= Math.min(7, b.x + 1); c++) bricks[b.y][c] = 0;
              foes = foes.filter((f) => {
                const dead = (f.x === b.x && Math.abs(f.y - b.y) <= 1) || (f.y === b.y && Math.abs(f.x - b.x) <= 1);
                if (dead) {
                  spawnPopup(popups, 55 + f.x * 44, 130 + f.y * 44, '+100 💥', '#fde047');
                  score += 100;
                  rt.setScore(score);
                  rt.sfx.win();
                }
                return !dead;
              });
              if (foes.length === 0) {
                foes = [
                  { x: 7, y: 7 },
                  { x: 2, y: 7 },
                  { x: 7, y: 1 },
                ];
              }
            }
          }
          moveT += dt;
          if (moveT >= 0.45) {
            moveT = 0;
            for (const f of foes) {
              const dirs = [
                [1, 0],
                [-1, 0],
                [0, 1],
                [0, -1],
              ];
              const d = dirs[Math.floor(Math.random() * 4)];
              const nx = clamp(f.x + d[0], 0, 7);
              const ny = clamp(f.y + d[1], 0, 7);
              if (!bricks[ny][nx]) {
                f.x = nx;
                f.y = ny;
              }
              if (f.x === px && f.y === py) {
                rt.sfx.hit();
                rt.endGame(score, `Hit by a monster! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus('Swipe=Move · Tap=Drop Bomb');
        },
        onKey(k) {
          if (k === 'ArrowUp') step(0, -1);
          if (k === 'ArrowDown') step(0, 1);
          if (k === 'ArrowLeft') step(-1, 0);
          if (k === 'ArrowRight') step(1, 0);
          if (k === ' ' && bombs.length < 3) {
            bombs.push({ x: px, y: py, t: 1.5 });
            rt.sfx.tap();
          }
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#090d16', 'rgba(251,146,60,0.12)');
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              drawRoundedBox(c, 34 + x * 44, 130 + y * 44, 42, 42, 6, bricks[y][x] ? '#92400e' : '#1e293b');
            }
          }
          for (const b of bombs) drawBadgeText(c, '💣', 55 + b.x * 44, 151 + b.y * 44, '#fff', 26);
          for (const f of foes) drawBadgeText(c, '👻', 55 + f.x * 44, 151 + f.y * 44, '#fff', 28);
          drawCharacterSprite(c, 55 + px * 44, 151 + py * 44, {
            style: 'robot',
            suitColor: '#38bdf8',
            accentColor: '#fde047',
            dir,
            stride: steps * 1.4,
            scale: 0.8,
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'centipede-blaster',
    num: 90,
    title: 'Centipede Blaster',
    icon: '🐛',
    category: 'retro',
    color: '#84cc16',
    controlsHint: 'Drag the cannon left/right to blast every centipede segment!',
    desc: 'Arcade classic: blast the descending centipede wave by wave.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let fireT = 0;
      let score = 0;
      let time = 0;
      let lastDt = 0.016;
      const bullets: { x: number; y: number }[] = [];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let segs = Array.from({ length: 10 }, (_, i) => ({ x: 40 + i * 28, y: 90, dir: 1 }));
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          if (inp.down) px = clamp(inp.x, 24, W - 24);
          fireT -= dt;
          if (fireT <= 0) {
            bullets.push({ x: px, y: 540 });
            fireT = 0.2;
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].y -= 480 * dt;
            if (bullets[i].y < 50) {
              bullets.splice(i, 1);
              continue;
            }
            for (let j = segs.length - 1; j >= 0; j--) {
              if (Math.hypot(bullets[i].x - segs[j].x, bullets[i].y - segs[j].y) < 18) {
                const sx = segs[j].x;
                const sy = segs[j].y;
                bullets.splice(i, 1);
                segs.splice(j, 1);
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, sx, sy, '#84cc16', 10);
                spawnPopup(popups, sx, sy - 10, '+25', '#bef264', 15);
                break;
              }
            }
          }
          for (const s of segs) {
            s.x += s.dir * (165 + score * 0.15) * dt;
            if ((s.dir < 0 && s.x < 24) || (s.dir > 0 && s.x > W - 24)) {
              s.x = clamp(s.x, 24, W - 24);
              s.dir *= -1;
              s.y += 32;
            }
            if (s.y > 540) {
              rt.sfx.explode();
              rt.endGame(score, `Centipede reached the bottom (${score} pt)!`);
              return;
            }
          }
          if (segs.length === 0) {
            score += 100;
            rt.setScore(score);
            rt.sfx.win();
            spawnPopup(popups, W / 2, 240, 'WAVE CLEAR! +100', '#fde047', 20);
            segs = Array.from({ length: 12 }, (_, i) => ({ x: 40 + i * 26, y: 90, dir: 1 }));
          }
          rt.setStatus(`Segments left: ${segs.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#022c22', '#090d16', 'rgba(132,204,22,0.14)');
          for (const b of bullets) drawGlowLine(c, b.x, b.y - 8, b.x, b.y + 8, '#fde047', 4, '#facc15');
          for (let i = 0; i < segs.length; i++) {
            const s = segs[i];
            drawCircle(c, s.x, s.y, 13, i === 0 ? '#facc15' : '#84cc16', '#fff', '#84cc16');
          }
          drawShipSprite(c, px, 560, 0, '#22c55e', '#fde047', { kind: 'fighter', scale: 0.95, thrust: 0.5, time });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
];
