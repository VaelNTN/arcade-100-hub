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
      let body = [
        { x: 10, y: 12 },
        { x: 9, y: 12 },
        { x: 8, y: 12 },
      ];
      let dir = { x: 1, y: 0 };
      let food = { x: 15, y: 8 };
      let stepT = 0;
      let score = 0;
      const steer = (dx: number, dy: number) => {
        if (dx !== -dir.x || dy !== -dir.y) dir = { x: dx, y: dy };
      };
      return {
        update(dt, inp) {
          if (inp.swipe === 'up') steer(0, -1);
          if (inp.swipe === 'down') steer(0, 1);
          if (inp.swipe === 'left') steer(-1, 0);
          if (inp.swipe === 'right') steer(1, 0);
          stepT += dt;
          if (stepT >= 0.125) {
            stepT = 0;
            const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
            if (head.x < 0 || head.x >= 20 || head.y < 0 || head.y >= 24 || body.some((b) => b.x === head.x && b.y === head.y)) {
              rt.sfx.explode();
              rt.endGame(score, `Snake crashed at length ${body.length}!`);
              return;
            }
            body.unshift(head);
            if (head.x === food.x && head.y === food.y) {
              score += 20;
              rt.setScore(score);
              rt.sfx.score();
              food = { x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 24) };
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
          drawGradientBg(c, '#020617', '#064e3b');
          drawRoundedBox(c, 10, 80, 400, 480, 10, '#090d16', '#22c55e');
          drawBadgeText(c, '🍎', 10 + food.x * 20 + 10, 80 + food.y * 20 + 10, '#fff', 18);
          body.forEach((b, i) => {
            drawRoundedBox(c, 11 + b.x * 20, 81 + b.y * 20, 18, 18, 5, i === 0 ? '#fde047' : '#22c55e');
          });
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
      let bot = { x: 2, y: 2, dx: 1, dy: 0 };
      let stepT = 0;
      let score = 40;
      return {
        update(dt, inp) {
          if (inp.swipe === 'up') {
            dx = 0;
            dy = -1;
          }
          if (inp.swipe === 'down') {
            dx = 0;
            dy = 1;
          }
          if (inp.swipe === 'left') {
            dx = -1;
            dy = 0;
          }
          if (inp.swipe === 'right') {
            dx = 1;
            dy = 0;
          }
          stepT += dt;
          if (stepT >= 0.14) {
            stepT = 0;
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
                score = Math.round((grid.filter((v) => v === 1).length / (N * N)) * 1000);
                rt.setScore(score);
                rt.sfx.score();
              }
            } else grid[gy * N + gx] = 2;

            // Bot patrol
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
            if (grid[bot.y * N + bot.x] === 2) {
              rt.sfx.explode();
              rt.endGame(score, `Bot cut your trail! (${score} pt)`);
              return;
            }
          }
          rt.setStatus(`Territory: ${score} pt · Swipe to steer`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b');
          const cell = 19;
          for (let y = 0; y < N; y++) {
            for (let x = 0; x < N; x++) {
              const v = grid[y * N + x];
              drawRoundedBox(c, 20 + x * cell, 120 + y * cell, cell - 1, cell - 1, 2, v === 1 ? '#ec4899' : v === 2 ? '#f9a8d4' : '#334155');
            }
          }
          drawCircle(c, 20 + gx * cell + 9, 120 + gy * cell + 9, 8, '#fde047', '#fff');
          drawCircle(c, 20 + bot.x * cell + 9, 120 + bot.y * cell + 9, 8, '#38bdf8', '#fff');
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
      // Walls cross pattern
      for (const idx of [13, 19, 25, 29, 39, 41, 79, 81, 91, 95, 101, 107]) pellets[idx] = 2; // 2=wall
      let px = 5;
      let py = 5;
      let dx = 1;
      let dy = 0;
      let powerT = 0;
      let score = 0;
      let ghosts = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ];
      let stepT = 0;
      const tryDir = (ndx: number, ndy: number) => {
        dx = ndx;
        dy = ndy;
      };
      return {
        update(dt, inp) {
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
                  return;
                }
              }
            }
            if (!pellets.some((v) => v === 1)) {
              for (let i = 0; i < pellets.length; i++) if (pellets[i] === 0) pellets[i] = 1;
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
            }
          }
          rt.setStatus(powerT > 0 ? `⚡ POWER: ${Math.ceil(powerT)}s` : 'Swipe to steer');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#1e1b4b');
          const cell = 34;
          for (let y = 0; y < H_G; y++) {
            for (let x = 0; x < W_G; x++) {
              const v = pellets[y * W_G + x];
              const cx = 23 + x * cell + 17;
              const cy = 120 + y * cell + 17;
              if (v === 2) drawRoundedBox(c, 23 + x * cell + 2, 120 + y * cell + 2, cell - 4, cell - 4, 6, '#3b82f6');
              else if (v === 1) drawCircle(c, cx, cy, (x === 0 || x === 10) && (y === 0 || y === 10) ? 7 : 3, '#fde047');
            }
          }
          drawCircle(c, 23 + px * cell + 17, 120 + py * cell + 17, 13, '#facc15', '#fff');
          for (const g of ghosts) {
            drawBadgeText(c, powerT > 0 ? '😨' : '👻', 23 + g.x * cell + 17, 120 + g.y * cell + 17, '#fff', 24);
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
      const fits = (mat: number[][], nx: number, ny: number) =>
        mat.every((row, r) =>
          row.every((v, c) => !v || (nx + c >= 0 && nx + c < COLS && ny + r < ROWS && (ny + r < 0 || !board[ny + r][nx + c])))
        );
      const rotateMat = (mat: number[][]) =>
        mat[0].map((_, c) => mat.map((row) => row[c]).reverse());
      const lock = () => {
        cur.forEach((row, r) =>
          row.forEach((v, c) => {
            if (v && cy + r >= 0) board[cy + r][cx + c] = 1;
          })
        );
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r].every((v) => v > 0)) {
            board.splice(r, 1);
            board.unshift(Array(COLS).fill(0));
            score += 100;
            r++;
            rt.sfx.score();
          }
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
          if (inp.swipe === 'down') {
            while (fits(cur, cx, cy + 1)) cy++;
            lock();
            return;
          }
          if (inp.justPressed) {
            if (inp.x < W / 3 && fits(cur, cx - 1, cy)) {
              cx--;
              rt.sfx.tap();
            } else if (inp.x > (W * 2) / 3 && fits(cur, cx + 1, cy)) {
              cx++;
              rt.sfx.tap();
            } else {
              const rot = rotateMat(cur);
              if (fits(rot, cx, cy)) {
                cur = rot;
                rt.sfx.tap();
              }
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
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e1b4b');
          const cell = 32;
          const ox = (W - COLS * cell) / 2;
          const oy = 95;
          drawRoundedBox(c, ox - 4, oy - 4, COLS * cell + 8, ROWS * cell + 8, 8, '#0f172a', '#38bdf8');
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (board[y][x]) drawRoundedBox(c, ox + x * cell + 1, oy + y * cell + 1, cell - 2, cell - 2, 4, '#22d3ee');
            }
          }
          cur.forEach((row, ry) =>
            row.forEach((v, rx) => {
              if (v) drawRoundedBox(c, ox + (cx + rx) * cell + 1, oy + (cy + ry) * cell + 1, cell - 2, cell - 2, 4, '#facc15');
            })
          );
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
      return {
        update(dt, inp) {
          if (inp.down) px = clamp(inp.x, 50, W - 50);
          ax += clamp((bx - ax) * 5, -240, 240) * dt;
          bx += vx * dt;
          by += vy * dt;
          if (bx < 10 || bx > W - 10) {
            vx *= -1;
            bx = clamp(bx, 10, W - 10);
          }
          if (vy > 0 && by >= 550 && by <= 575 && Math.abs(bx - px) < 55) {
            vy = -Math.abs(vy) * 1.05;
            vx = (bx - px) * 5.4;
            score += 10;
            rt.setScore(score);
            rt.sfx.tap();
          } else if (vy < 0 && by <= 105 && by >= 85 && Math.abs(bx - ax) < 52) {
            vy = Math.abs(vy) * 1.03;
            rt.sfx.tap();
          }
          if (by < 55) {
            score += 80;
            rt.setScore(score);
            rt.sfx.win();
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
          drawGradientBg(c, '#020617', '#083344');
          drawRoundedBox(c, ax - 45, 86, 90, 14, 7, '#ef4444');
          drawRoundedBox(c, px - 50, 560, 100, 14, 7, '#22d3ee');
          drawCircle(c, bx, by, 10, '#fde047', '#fff');
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
      let gem = { x: 7, y: 9 };
      let monster = { x: 1, y: 9 };
      let score = 0;
      let stepT = 0;
      const move = (dx: number, dy: number) => {
        px = clamp(px + dx, 0, 8);
        py = clamp(py + dy, 0, 11);
        if (dirt[py][px]) {
          dirt[py][px] = 0;
          score += 5;
          rt.setScore(score);
        }
        rt.sfx.tap();
      };
      return {
        update(dt, inp) {
          if (inp.swipe === 'up') move(0, -1);
          if (inp.swipe === 'down') move(0, 1);
          if (inp.swipe === 'left') move(-1, 0);
          if (inp.swipe === 'right') move(1, 0);
          if (px === gem.x && py === gem.y) {
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
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#451a03', '#1c1917');
          for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 9; x++) {
              drawRoundedBox(c, 22 + x * 42, 95 + y * 42, 40, 40, 4, dirt[y][x] ? '#92400e' : '#1c1917');
            }
          }
          drawBadgeText(c, '💎', 42 + gem.x * 42, 115 + gem.y * 42, '#fff', 26);
          drawBadgeText(c, '👾', 42 + monster.x * 42, 115 + monster.y * 42, '#fff', 28);
          drawBadgeText(c, '👷', 42 + px * 42, 115 + py * 42, '#fff', 28);
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
      let spark = { x: W / 2, y: 300, vx: 175, vy: 195 };
      let score = 0;
      const totalArea = (W - 60) * 460;
      return {
        update(dt, inp) {
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
          drawGradientBg(c, '#3b0764', '#090d16');
          drawRoundedBox(c, 30, 100, W - 60, 460, 10, '#1e1b4b', '#475569');
          drawRoundedBox(c, box.x, box.y, box.w, box.h, 8, '#090d16', '#a855f7');
          drawBadgeText(c, '⚡', spark.x, spark.y, '#fde047', 30);
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
      const missiles: { sx: number; sy: number; x: number; y: number; spd: number }[] = [];
      const blasts: { x: number; y: number; r: number; life: number }[] = [];
      let spawnT = 0.6;
      let score = 0;
      return {
        update(dt, inp) {
          if (inp.justPressed && inp.y < 520) {
            blasts.push({ x: inp.x, y: inp.y, r: 46, life: 0.45 });
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            missiles.push({ sx: rand(20, W - 20), sy: 0, x: rand(40, W - 40), y: 0, spd: 80 + score * 0.25 });
            spawnT = Math.max(0.35, 1.0 - score * 0.002);
          }
          for (let i = blasts.length - 1; i >= 0; i--) {
            blasts[i].life -= dt;
            if (blasts[i].life <= 0) blasts.splice(i, 1);
          }
          for (let i = missiles.length - 1; i >= 0; i--) {
            const m = missiles[i];
            m.y += m.spd * dt;
            if (blasts.some((b) => Math.hypot(b.x - m.x, b.y - m.y) < b.r)) {
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
          drawGradientBg(c, '#020617', '#1e1b4b');
          drawRoundedBox(c, 0, 575, W, 65, 0, '#14532d');
          for (const ct of cities) drawBadgeText(c, ct.alive ? '🏙️' : '🔥', ct.x, 560, '#fff', 36);
          for (const m of missiles) {
            c.strokeStyle = '#ef4444';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(m.sx, m.sy);
            c.lineTo(m.x, m.y);
            c.stroke();
            drawCircle(c, m.x, m.y, 4, '#fde047');
          }
          for (const b of blasts) drawCircle(c, b.x, b.y, b.r * (b.life / 0.45), 'rgba(56,189,248,0.65)', '#fff');
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
      const bombs: { x: number; y: number; t: number }[] = [];
      let foes = [
        { x: 7, y: 7 },
        { x: 7, y: 2 },
      ];
      let score = 0;
      let moveT = 0;
      const step = (dx: number, dy: number) => {
        const nx = clamp(px + dx, 0, 7);
        const ny = clamp(py + dy, 0, 7);
        if (!bricks[ny][nx]) {
          px = nx;
          py = ny;
          rt.sfx.tap();
        }
      };
      return {
        update(dt, inp) {
          if (inp.swipe === 'up') step(0, -1);
          else if (inp.swipe === 'down') step(0, 1);
          else if (inp.swipe === 'left') step(-1, 0);
          else if (inp.swipe === 'right') step(1, 0);
          else if (inp.justPressed && bombs.length < 3) {
            bombs.push({ x: px, y: py, t: 1.5 });
            rt.sfx.tap();
          }
          for (let i = bombs.length - 1; i >= 0; i--) {
            bombs[i].t -= dt;
            if (bombs[i].t <= 0) {
              const b = bombs.splice(i, 1)[0];
              rt.sfx.explode();
              for (let r = Math.max(0, b.y - 1); r <= Math.min(7, b.y + 1); r++) bricks[r][b.x] = 0;
              for (let c = Math.max(0, b.x - 1); c <= Math.min(7, b.x + 1); c++) bricks[b.y][c] = 0;
              foes = foes.filter((f) => {
                const dead = (f.x === b.x && Math.abs(f.y - b.y) <= 1) || (f.y === b.y && Math.abs(f.x - b.x) <= 1);
                if (dead) {
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
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#090d16');
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              drawRoundedBox(c, 34 + x * 44, 130 + y * 44, 42, 42, 6, bricks[y][x] ? '#92400e' : '#1e293b');
            }
          }
          for (const b of bombs) drawBadgeText(c, '💣', 55 + b.x * 44, 151 + b.y * 44, '#fff', 26);
          for (const f of foes) drawBadgeText(c, '👻', 55 + f.x * 44, 151 + f.y * 44, '#fff', 28);
          drawBadgeText(c, '🤖', 55 + px * 44, 151 + py * 44, '#fff', 28);
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
      const bullets: { x: number; y: number }[] = [];
      let segs = Array.from({ length: 10 }, (_, i) => ({ x: 40 + i * 28, y: 90, dir: 1 }));
      return {
        update(dt, inp) {
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
                bullets.splice(i, 1);
                segs.splice(j, 1);
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                break;
              }
            }
          }
          for (const s of segs) {
            s.x += s.dir * (165 + score * 0.15) * dt;
            if (s.x < 24 || s.x > W - 24) {
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
            segs = Array.from({ length: 12 }, (_, i) => ({ x: 40 + i * 26, y: 90, dir: 1 }));
          }
          rt.setStatus(`Segments left: ${segs.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#022c22', '#090d16');
          for (const b of bullets) drawRoundedBox(c, b.x - 2, b.y - 8, 4, 14, 2, '#fde047');
          for (const s of segs) drawCircle(c, s.x, s.y, 13, '#84cc16', '#fff');
          drawBadgeText(c, '🔫', px, 560, '#fff', 34);
        },
      };
    },
  },
];
