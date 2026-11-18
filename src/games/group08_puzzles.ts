import { MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCarSprite,
  drawCharacterSprite,
  drawCircle,
  drawGlowLine,
  drawGradientBg,
  drawRoundedBox,
  FloatingPopup,
  spawnBurst,
  spawnPopup,
  updateAndDrawBursts,
  updateAndDrawPopups,
} from '../game/engineHelpers';

export const GROUP_08_PUZZLES: MiniGameDef[] = [
  {
    id: 'minesweeper-arcade',
    num: 71,
    title: 'Minesweeper Arcade',
    icon: '💣',
    category: 'puzzles',
    color: '#64748b',
    controlsHint: 'Tap tiles to dig safely! Toggle Flag mode below to mark mines.',
    desc: 'Fast 6x6 Minesweeper with endless levels.',
    create(rt): MiniGameInstance {
      let flagMode = false;
      let score = 0;
      let lastDt = 0.016;
      let mines: boolean[] = [];
      let rev: boolean[] = [];
      let flags: boolean[] = [];
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const init = () => {
        mines = Array(36).fill(false);
        rev = Array(36).fill(false);
        flags = Array(36).fill(false);
        let placed = 0;
        while (placed < 6) {
          const i = Math.floor(Math.random() * 36);
          if (!mines[i]) {
            mines[i] = true;
            placed++;
          }
        }
      };
      init();
      const countAdj = (idx: number) => {
        const r = Math.floor(idx / 6);
        const c = idx % 6;
        let cnt = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6 && mines[nr * 6 + nc]) cnt++;
          }
        }
        return cnt;
      };
      const revealCell = (startIdx: number) => {
        const queue = [startIdx];
        let newlyRevealed = 0;
        while (queue.length > 0) {
          const idx = queue.shift() as number;
          if (rev[idx] || mines[idx] || flags[idx]) continue;
          rev[idx] = true;
          newlyRevealed++;
          if (countAdj(idx) === 0) {
            const r = Math.floor(idx / 6);
            const c = idx % 6;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < 6 && nc >= 0 && nc < 6) {
                  const nIdx = nr * 6 + nc;
                  if (!rev[nIdx] && !mines[nIdx]) queue.push(nIdx);
                }
              }
            }
          }
        }
        return newlyRevealed;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            if (inp.y > 495) {
              flagMode = !flagMode;
              rt.sfx.tap();
              return;
            }
            const c = Math.floor((inp.x - 45) / 55);
            const r = Math.floor((inp.y - 120) / 55);
            if (c >= 0 && c < 6 && r >= 0 && r < 6) {
              const i = r * 6 + c;
              if (flagMode) {
                if (!rev[i]) {
                  flags[i] = !flags[i];
                  rt.sfx.tap();
                }
              } else if (!flags[i] && !rev[i]) {
                // First-click safety guarantee
                if (mines[i] && rev.every((v) => !v)) {
                  const safeSlot = mines.findIndex((m, idx) => !m && idx !== i);
                  if (safeSlot >= 0) {
                    mines[i] = false;
                    mines[safeSlot] = true;
                  }
                }
                if (mines[i]) {
                  rt.sfx.explode();
                  rt.endGame(score, `BOOM! Hit a mine at ${score} pt!`);
                  return;
                }
                const count = revealCell(i);
                const pts = count * 15;
                score += pts;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, 45 + c * 55 + 25, 120 + r * 55 + 25, '#38bdf8', 8, 0.55);
                if (rev.filter(Boolean).length === 30) {
                  score += 100;
                  rt.setScore(score);
                  rt.sfx.win();
                  spawnPopup(popups, W / 2, 100, 'BOARD CLEAR! +100', '#4ade80', 20);
                  init();
                }
              }
            }
          }
          rt.setStatus(flagMode ? '🚩 Flag Mode ON' : '⛏️ Dig Mode ON');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#090d16');
          for (let rI = 0; rI < 6; rI++) {
            for (let cI = 0; cI < 6; cI++) {
              const i = rI * 6 + cI;
              const x = 45 + cI * 55;
              const y = 120 + rI * 55;
              drawRoundedBox(c, x, y, 50, 50, 8, rev[i] ? '#0f172a' : '#475569', '#94a3b8');
              if (rev[i]) {
                const n = countAdj(i);
                if (n > 0) drawBadgeText(c, `${n}`, x + 25, y + 25, n === 1 ? '#38bdf8' : n === 2 ? '#4ade80' : '#fde047', 20);
              } else if (flags[i]) {
                drawBadgeText(c, '🚩', x + 25, y + 25, '#fff', 22);
              }
            }
          }
          drawRoundedBox(c, 90, 515, 240, 52, 14, flagMode ? '#ef4444' : '#334155', '#fff');
          drawBadgeText(c, flagMode ? '🚩 Flagging (Tap=Switch)' : '⛏️ Digging (Tap=Flag)', W / 2, 541, '#fff', 16);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'connect-flow-pipes',
    num: 72,
    title: 'Connect Flow Pipes',
    icon: '🔌',
    category: 'puzzles',
    color: '#22c55e',
    controlsHint: 'Drag from a colored dot to its matching pair to connect pipes!',
    desc: 'Connect all matching color pairs across the grid.',
    create(rt): MiniGameInstance {
      const levels = [
        [
          { a: [0, 0], b: [4, 1], color: '#ef4444' },
          { a: [0, 4], b: [3, 3], color: '#38bdf8' },
          { a: [1, 2], b: [4, 4], color: '#facc15' },
        ],
        [
          { a: [0, 1], b: [3, 0], color: '#ef4444' },
          { a: [1, 1], b: [4, 3], color: '#38bdf8' },
          { a: [0, 4], b: [4, 4], color: '#facc15' },
        ],
        [
          { a: [0, 0], b: [2, 3], color: '#ef4444' },
          { a: [4, 0], b: [1, 4], color: '#38bdf8' },
          { a: [3, 2], b: [4, 4], color: '#facc15' },
        ],
        [
          { a: [1, 0], b: [4, 2], color: '#ef4444' },
          { a: [0, 2], b: [2, 4], color: '#38bdf8' },
          { a: [2, 1], b: [4, 4], color: '#facc15' },
        ],
      ];
      let levelIdx = 0;
      let pairs = levels[0].map((p) => ({ a: [...p.a], b: [...p.b], color: p.color }));
      let paths: [number, number][][] = pairs.map((p) => [p.a as [number, number]]);
      let activeIdx: number | null = null;
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const toCell = (x: number, y: number): [number, number] | null => {
        const cx = Math.floor((x - 45) / 66);
        const cy = Math.floor((y - 140) / 66);
        return cx >= 0 && cx < 5 && cy >= 0 && cy < 5 ? [cx, cy] : null;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            const cell = toCell(inp.x, inp.y);
            if (cell) {
              const pIdx = pairs.findIndex((p) => (p.a[0] === cell[0] && p.a[1] === cell[1]) || (p.b[0] === cell[0] && p.b[1] === cell[1]));
              if (pIdx >= 0) {
                activeIdx = pIdx;
                paths[pIdx] = [cell];
                rt.sfx.tap();
              }
            }
          } else if (inp.down && activeIdx !== null) {
            const cell = toCell(inp.x, inp.y);
            const cur = paths[activeIdx];
            const last = cur[cur.length - 1];
            if (cell && Math.abs(cell[0] - last[0]) + Math.abs(cell[1] - last[1]) === 1) {
              const otherEndpoint = pairs.some(
                (p, idx) =>
                  idx !== activeIdx &&
                  ((p.a[0] === cell[0] && p.a[1] === cell[1]) || (p.b[0] === cell[0] && p.b[1] === cell[1]))
              );
              if (!otherEndpoint && !cur.some((c) => c[0] === cell[0] && c[1] === cell[1])) {
                cur.push(cell);
                rt.sfx.tap();
              }
            }
          } else if (inp.justReleased) {
            activeIdx = null;
            const allDone = pairs.every((p, idx) => {
              const pt = paths[idx];
              if (pt.length < 2) return false;
              const start = pt[0];
              const end = pt[pt.length - 1];
              return (
                (start[0] === p.a[0] && start[1] === p.a[1] && end[0] === p.b[0] && end[1] === p.b[1]) ||
                (start[0] === p.b[0] && start[1] === p.b[1] && end[0] === p.a[0] && end[1] === p.a[1])
              );
            });
            if (allDone) {
              spawnBurst(bursts, W / 2, 300, '#22c55e', 18);
              spawnPopup(popups, W / 2, 120, 'FLOW COMPLETE! +100', '#4ade80', 20);
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
              levelIdx = (levelIdx + 1) % levels.length;
              pairs = levels[levelIdx].map((p) => ({ a: [...p.a], b: [...p.b], color: p.color }));
              paths = pairs.map((p) => [p.a as [number, number]]);
            }
          }
          rt.setStatus(`Level ${Math.floor(score / 100) + 1} · Drag matching dots`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e293b', 'rgba(34,197,94,0.12)');
          for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
              drawRoundedBox(c, 45 + x * 66, 140 + y * 66, 62, 62, 10, '#1e293b', '#334155');
            }
          }
          pairs.forEach((p, idx) => {
            const pts = paths[idx];
            for (let i = 1; i < pts.length; i++) {
              const x1 = 45 + pts[i - 1][0] * 66 + 31;
              const y1 = 140 + pts[i - 1][1] * 66 + 31;
              const x2 = 45 + pts[i][0] * 66 + 31;
              const y2 = 140 + pts[i][1] * 66 + 31;
              drawGlowLine(c, x1, y1, x2, y2, p.color, 13, p.color);
            }
            drawCircle(c, 45 + p.a[0] * 66 + 31, 140 + p.a[1] * 66 + 31, 18, p.color, '#fff', p.color);
            drawCircle(c, 45 + p.b[0] * 66 + 31, 140 + p.b[1] * 66 + 31, 18, p.color, '#fff', p.color);
          });
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'sokoban-crate-push',
    num: 73,
    title: 'Sokoban Crate Push',
    icon: '📦',
    category: 'puzzles',
    color: '#d97706',
    controlsHint: 'Swipe in any direction to push crates onto the green targets!',
    desc: 'Classic warehouse box-pushing puzzle.',
    create(rt): MiniGameInstance {
      const levels = [
        { p: { x: 1, y: 3 }, boxes: [{ x: 2, y: 2 }, { x: 3, y: 3 }], goals: [{ x: 4, y: 2 }, { x: 4, y: 4 }] },
        { p: { x: 1, y: 2 }, boxes: [{ x: 2, y: 1 }, { x: 2, y: 3 }], goals: [{ x: 4, y: 1 }, { x: 4, y: 3 }] },
        { p: { x: 0, y: 2 }, boxes: [{ x: 1, y: 2 }, { x: 2, y: 3 }], goals: [{ x: 4, y: 2 }, { x: 4, y: 4 }] },
        { p: { x: 2, y: 4 }, boxes: [{ x: 2, y: 2 }, { x: 3, y: 2 }], goals: [{ x: 1, y: 1 }, { x: 4, y: 1 }] },
      ];
      let levelIdx = 0;
      let px = 1;
      let py = 3;
      let dir: 1 | -1 = 1;
      let stepCnt = 0;
      let boxes: { x: number; y: number }[] = [];
      let goals: { x: number; y: number }[] = [];
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const loadLevel = (idx: number) => {
        const lv = levels[idx % levels.length];
        px = lv.p.x;
        py = lv.p.y;
        boxes = lv.boxes.map((b) => ({ ...b }));
        goals = lv.goals.map((g) => ({ ...g }));
      };
      loadLevel(0);
      const move = (dx: number, dy: number) => {
        if (dx < 0) dir = -1;
        else if (dx > 0) dir = 1;
        const nx = clamp(px + dx, 0, 5);
        const ny = clamp(py + dy, 0, 5);
        const b = boxes.find((bx) => bx.x === nx && bx.y === ny);
        if (b) {
          const bx2 = clamp(b.x + dx, 0, 5);
          const by2 = clamp(b.y + dy, 0, 5);
          if ((bx2 === b.x && by2 === b.y) || boxes.some((o) => o.x === bx2 && o.y === by2)) return;
          b.x = bx2;
          b.y = by2;
        }
        px = nx;
        py = ny;
        stepCnt++;
        rt.sfx.tap();
        if (goals.every((g) => boxes.some((b2) => b2.x === g.x && b2.y === g.y))) {
          spawnBurst(bursts, W / 2, 290, '#22c55e', 18);
          spawnPopup(popups, W / 2, 110, 'SOLVED! +100', '#4ade80', 22);
          score += 100;
          rt.setScore(score);
          rt.sfx.win();
          levelIdx = (levelIdx + 1) % levels.length;
          loadLevel(levelIdx);
        }
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed && inp.y > 495) {
            loadLevel(levelIdx);
            rt.sfx.tap();
            return;
          }
          if (inp.swipe === 'up') move(0, -1);
          if (inp.swipe === 'down') move(0, 1);
          if (inp.swipe === 'left') move(-1, 0);
          if (inp.swipe === 'right') move(1, 0);
          rt.setStatus(`Level ${levelIdx + 1} · Swipe to push crates`);
        },
        onKey(k) {
          if (k === 'ArrowUp') move(0, -1);
          if (k === 'ArrowDown') move(0, 1);
          if (k === 'ArrowLeft') move(-1, 0);
          if (k === 'ArrowRight') move(1, 0);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#292524', '#090d16', 'rgba(217,119,6,0.14)');
          for (let y = 0; y < 6; y++) {
            for (let x = 0; x < 6; x++) {
              drawRoundedBox(c, 45 + x * 55, 130 + y * 55, 50, 50, 8, '#44403c', '#57534e');
            }
          }
          for (const g of goals) drawBadgeText(c, '❎', 70 + g.x * 55, 155 + g.y * 55, '#22c55e', 28);
          for (const b of boxes) {
            const onGoal = goals.some((g) => g.x === b.x && g.y === b.y);
            drawRoundedBox(c, 49 + b.x * 55, 134 + b.y * 55, 42, 42, 8, onGoal ? '#22c55e' : '#d97706', '#fde68a');
            drawBadgeText(c, '📦', 70 + b.x * 55, 155 + b.y * 55, '#fff', 26);
          }
          drawCharacterSprite(c, 70 + px * 55, 155 + py * 55, {
            style: 'worker',
            suitColor: '#f97316',
            accentColor: '#facc15',
            dir,
            stride: stepCnt * 1.4,
            scale: 0.95,
          });
          drawRoundedBox(c, 115, 515, 190, 48, 12, '#44403c', '#f59e0b');
          drawBadgeText(c, '🔄 Reset Level', W / 2, 539, '#fde68a', 16);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'sliding-15-puzzle',
    num: 74,
    title: 'Sliding 15-Puzzle',
    icon: '🔟',
    category: 'puzzles',
    color: '#38bdf8',
    controlsHint: 'Tap a tile next to the gap to order 1 through 15!',
    desc: 'Classic 15-tile sliding puzzle.',
    create(rt): MiniGameInstance {
      const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 0, 15];
      // Shuffle via valid moves so always solvable
      let empty = 14;
      for (let k = 0; k < 45; k++) {
        const er = Math.floor(empty / 4);
        const ec = empty % 4;
        const nbs = [
          er > 0 ? empty - 4 : -1,
          er < 3 ? empty + 4 : -1,
          ec > 0 ? empty - 1 : -1,
          ec < 3 ? empty + 1 : -1,
        ].filter((n) => n >= 0);
        const pick = nbs[Math.floor(Math.random() * nbs.length)];
        [tiles[empty], tiles[pick]] = [tiles[pick], tiles[empty]];
        empty = pick;
      }
      let moves = 0;
      return {
        update(_dt, inp) {
          if (inp.justPressed) {
            const c = Math.floor((inp.x - 36) / 88);
            const r = Math.floor((inp.y - 135) / 88);
            if (c >= 0 && c < 4 && r >= 0 && r < 4) {
              const idx = r * 4 + c;
              const er = Math.floor(empty / 4);
              const ec = empty % 4;
              if (Math.abs(er - r) + Math.abs(ec - c) === 1) {
                [tiles[empty], tiles[idx]] = [tiles[idx], tiles[empty]];
                empty = idx;
                moves++;
                rt.sfx.tap();
                const solved = tiles.slice(0, 15).every((v, i) => v === i + 1);
                if (solved) {
                  const pts = Math.max(100, 500 - moves * 5);
                  rt.setScore(pts);
                  rt.sfx.win();
                  rt.endGame(pts, `Solved in ${moves} moves!`);
                }
              }
            }
          }
          rt.setStatus(`Moves: ${moves} · Order 1..15`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b', 'rgba(56,189,248,0.14)');
          for (let i = 0; i < 16; i++) {
            const v = tiles[i];
            if (v === 0) continue;
            const x = 36 + (i % 4) * 88;
            const y = 135 + Math.floor(i / 4) * 88;
            drawRoundedBox(c, x, y, 80, 80, 12, v === i + 1 ? '#0284c7' : '#334155', '#fff');
            drawBadgeText(c, `${v}`, x + 40, y + 40, '#fff', 26);
          }
        },
      };
    },
  },
  {
    id: 'match-3-gem-rush',
    num: 75,
    title: 'Match-3 Gem Rush',
    icon: '💎',
    category: 'puzzles',
    color: '#ec4899',
    controlsHint: 'Tap two adjacent gems to swap and match 3+ in a row!',
    desc: 'Fast gem-matching blitz with chain combos.',
    create(rt): MiniGameInstance {
      const gems = ['💎', '🍒', '🍋', '🍏', '🔮'];
      const grid = Array.from({ length: 36 }, () => Math.floor(Math.random() * 5));
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      let sel: number | null = null;
      let score = 0;
      let timer = 50;
      let lastDt = 0.016;
      const clearMatches = (awardScore: boolean) => {
        const hit = new Set<number>();
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c < 4; c++) {
            const v = grid[r * 6 + c];
            if (v === grid[r * 6 + c + 1] && v === grid[r * 6 + c + 2]) {
              hit.add(r * 6 + c);
              hit.add(r * 6 + c + 1);
              hit.add(r * 6 + c + 2);
            }
          }
        }
        for (let c = 0; c < 6; c++) {
          for (let r = 0; r < 4; r++) {
            const v = grid[r * 6 + c];
            if (v === grid[(r + 1) * 6 + c] && v === grid[(r + 2) * 6 + c]) {
              hit.add(r * 6 + c);
              hit.add((r + 1) * 6 + c);
              hit.add((r + 2) * 6 + c);
            }
          }
        }
        if (hit.size > 0) {
          hit.forEach((idx) => {
            if (awardScore) {
              const gx = 45 + (idx % 6) * 55 + 25;
              const gy = 130 + Math.floor(idx / 6) * 55 + 25;
              spawnBurst(bursts, gx, gy, '#f472b6', 7, 0.55);
            }
            grid[idx] = Math.floor(Math.random() * 5);
          });
          if (awardScore) {
            const pts = hit.size * 15;
            score += pts;
            rt.setScore(score);
            rt.sfx.score();
            spawnPopup(popups, W / 2, 110, `+${pts} 💎`, '#fde047');
          }
        }
        return hit.size > 0;
      };
      while (clearMatches(false)) {
        // Clear initial board matches cleanly
      }
      return {
        update(dt, inp) {
          lastDt = dt;
          timer -= dt;
          if (timer <= 0) {
            rt.sfx.win();
            rt.endGame(score, `Time's up! Gem Score: ${score}`);
            return;
          }
          if (inp.justPressed) {
            const c = Math.floor((inp.x - 45) / 55);
            const r = Math.floor((inp.y - 130) / 55);
            if (c >= 0 && c < 6 && r >= 0 && r < 6) {
              const idx = r * 6 + c;
              if (sel === null) {
                sel = idx;
                rt.sfx.tap();
              } else {
                const sr = Math.floor(sel / 6);
                const sc = sel % 6;
                if (Math.abs(sr - r) + Math.abs(sc - c) === 1) {
                  [grid[sel], grid[idx]] = [grid[idx], grid[sel]];
                  if (!clearMatches(true)) {
                    [grid[sel], grid[idx]] = [grid[idx], grid[sel]];
                    rt.sfx.hit();
                  } else {
                    while (clearMatches(true)) {
                      // Cascade chain combos
                    }
                  }
                }
                sel = null;
              }
            }
          }
          rt.setStatus(`Time: ${Math.ceil(timer)}s · Swap neighbors`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#3b0764', '#090d16', 'rgba(236,72,153,0.16)');
          for (let i = 0; i < 36; i++) {
            const x = 45 + (i % 6) * 55;
            const y = 130 + Math.floor(i / 6) * 55;
            drawRoundedBox(c, x, y, 50, 50, 10, '#1e293b', sel === i ? '#fde047' : '#475569');
            drawBadgeText(c, gems[grid[i]], x + 25, y + 25, '#fff', 28);
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'parking-jam-out',
    num: 76,
    title: 'Parking Jam Out',
    icon: '🚙',
    category: 'puzzles',
    color: '#ef4444',
    controlsHint: "Tap parked cars to slide them out of the red car's path!",
    desc: 'Clear the exit lane on the right for the red car.',
    create(rt): MiniGameInstance {
      interface ParkedCar {
        x: number;
        y: number;
        w: number;
        h: number;
        horiz: boolean;
        hero: boolean;
        color: string;
        stripe: string;
      }
      const layouts: ParkedCar[][] = [
        [
          { x: 1, y: 2, w: 2, h: 1, horiz: true, hero: true, color: '#ef4444', stripe: '#fde047' },
          { x: 3, y: 1, w: 1, h: 2, horiz: false, hero: false, color: '#38bdf8', stripe: '#f8fafc' },
          { x: 2, y: 3, w: 2, h: 1, horiz: true, hero: false, color: '#facc15', stripe: '#1e293b' },
          { x: 4, y: 2, w: 1, h: 2, horiz: false, hero: false, color: '#22c55e', stripe: '#f8fafc' },
        ],
        [
          { x: 0, y: 2, w: 2, h: 1, horiz: true, hero: true, color: '#ef4444', stripe: '#fde047' },
          { x: 2, y: 0, w: 1, h: 3, horiz: false, hero: false, color: '#38bdf8', stripe: '#f8fafc' },
          { x: 3, y: 1, w: 2, h: 1, horiz: true, hero: false, color: '#facc15', stripe: '#1e293b' },
          { x: 4, y: 2, w: 1, h: 2, horiz: false, hero: false, color: '#22c55e', stripe: '#f8fafc' },
          { x: 1, y: 3, w: 2, h: 1, horiz: true, hero: false, color: '#a855f7', stripe: '#f8fafc' },
        ],
        [
          { x: 0, y: 2, w: 2, h: 1, horiz: true, hero: true, color: '#ef4444', stripe: '#fde047' },
          { x: 2, y: 1, w: 1, h: 2, horiz: false, hero: false, color: '#38bdf8', stripe: '#f8fafc' },
          { x: 3, y: 0, w: 1, h: 3, horiz: false, hero: false, color: '#facc15', stripe: '#1e293b' },
          { x: 4, y: 1, w: 1, h: 2, horiz: false, hero: false, color: '#22c55e', stripe: '#f8fafc' },
          { x: 2, y: 3, w: 2, h: 1, horiz: true, hero: false, color: '#a855f7', stripe: '#f8fafc' },
        ],
      ];
      let layoutIdx = 0;
      let cars: ParkedCar[] = layouts[0].map((c) => ({ ...c }));
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            const gx = Math.floor((inp.x - 45) / 55);
            const gy = Math.floor((inp.y - 135) / 55);
            const car = cars.find((c) => gx >= c.x && gx < c.x + c.w && gy >= c.y && gy < c.y + c.h);
            if (car) {
              const step = inp.swipe === 'left' || inp.swipe === 'up' ? -1 : 1;
              const nx = car.x + (car.horiz ? step : 0);
              const ny = car.y + (car.horiz ? 0 : step);
              const inBounds = nx >= 0 && ny >= 0 && nx + car.w <= 6 && ny + car.h <= 6;
              const overlap = cars.some(
                (o) =>
                  o !== car &&
                  nx < o.x + o.w &&
                  nx + car.w > o.x &&
                  ny < o.y + o.h &&
                  ny + car.h > o.y
              );
              if (car.hero && nx + car.w >= 6 && !overlap) {
                spawnBurst(bursts, 375, 272, '#22c55e', 16);
                spawnPopup(popups, 300, 235, 'EXIT! +100', '#4ade80', 20);
                score += 100;
                rt.setScore(score);
                rt.sfx.win();
                layoutIdx = (layoutIdx + 1) % layouts.length;
                cars = layouts[layoutIdx].map((c) => ({ ...c }));
              } else if (inBounds && !overlap) {
                car.x = nx;
                car.y = ny;
                rt.sfx.tap();
              } else {
                const nx2 = car.x - (car.horiz ? step : 0);
                const ny2 = car.y - (car.horiz ? 0 : step);
                const ok2 =
                  nx2 >= 0 &&
                  ny2 >= 0 &&
                  nx2 + car.w <= 6 &&
                  ny2 + car.h <= 6 &&
                  !cars.some((o) => o !== car && nx2 < o.x + o.w && nx2 + car.w > o.x && ny2 < o.y + o.h && ny2 + car.h > o.y);
                if (ok2) {
                  car.x = nx2;
                  car.y = ny2;
                  rt.sfx.tap();
                } else rt.sfx.hit();
              }
            }
          }
          rt.setStatus(`Lot ${Math.floor(score / 100) + 1} · Guide red car →`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#090d16', 'rgba(239,68,68,0.12)');
          drawRoundedBox(c, 40, 130, 340, 340, 12, '#334155', '#94a3b8');
          for (let i = 1; i < 6; i++) {
            c.strokeStyle = 'rgba(255,255,255,0.08)';
            c.lineWidth = 1;
            c.beginPath();
            c.moveTo(45 + i * 55, 135);
            c.lineTo(45 + i * 55, 465);
            c.moveTo(45, 135 + i * 55);
            c.lineTo(375, 135 + i * 55);
            c.stroke();
          }
          drawRoundedBox(c, 372, 244, 18, 56, 4, '#22c55e', '#fff', '#22c55e');
          for (const car of cars) {
            const cx = 45 + (car.x + car.w / 2) * 55;
            const cy = 135 + (car.y + car.h / 2) * 55;
            const lenScale = Math.max(car.w, car.h) * 0.95;
            drawCarSprite(c, cx, cy, car.horiz ? Math.PI / 2 : 0, car.color, car.stripe, {
              scale: lenScale * 0.92,
              headlights: car.hero,
              spoiler: car.hero,
            });
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'nonogram-picross',
    num: 77,
    title: 'Nonogram Picross',
    icon: '🎨',
    category: 'puzzles',
    color: '#6366f1',
    controlsHint: 'Tap cells using the row & column clues to reveal the pixel art!',
    desc: 'Logic picture puzzle on a quick 5x5 grid.',
    create(rt): MiniGameInstance {
      const presets = [
        [0,1,0,1,0, 1,1,1,1,1, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0],
        [0,0,1,0,0, 0,1,1,1,0, 1,1,0,1,1, 0,1,1,1,0, 0,0,1,0,0],
        [0,1,1,1,0, 1,0,0,0,1, 1,0,1,0,1, 1,0,0,0,1, 0,1,1,1,0],
        [1,0,1,0,1, 1,1,1,1,1, 0,1,1,1,0, 0,0,1,0,0, 0,1,1,1,0],
      ];
      let level = 0;
      let target = presets[0];
      let cur = Array(25).fill(0);
      let score = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const clue = (arr: number[]) => {
        const res: number[] = [];
        let run = 0;
        for (const v of arr) {
          if (v) run++;
          else if (run) {
            res.push(run);
            run = 0;
          }
        }
        if (run) res.push(run);
        return res.length ? res.join(' ') : '0';
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            const c = Math.floor((inp.x - 105) / 54);
            const r = Math.floor((inp.y - 180) / 54);
            if (c >= 0 && c < 5 && r >= 0 && r < 5) {
              cur[r * 5 + c] = cur[r * 5 + c] ? 0 : 1;
              rt.sfx.tap();
              if (cur.every((v, i) => v === target[i])) {
                spawnBurst(bursts, 240, 315, '#38bdf8', 18);
                spawnPopup(popups, 240, 130, 'ART COMPLETE! +100', '#fde047', 18);
                score += 100;
                rt.setScore(score);
                rt.sfx.win();
                level = (level + 1) % presets.length;
                target = presets[level];
                cur = Array(25).fill(0);
              }
            }
          }
          rt.setStatus(`Puzzles solved: ${score / 100}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16', 'rgba(99,102,241,0.14)');
          for (let rI = 0; rI < 5; rI++) {
            const rowClue = clue(target.slice(rI * 5, rI * 5 + 5));
            drawBadgeText(c, rowClue, 90, 207 + rI * 54, '#fde047', 14, 'right');
            for (let cI = 0; cI < 5; cI++) {
              if (rI === 0) {
                const colClue = clue([0, 1, 2, 3, 4].map((rr) => target[rr * 5 + cI]));
                drawBadgeText(c, colClue, 132 + cI * 54, 155, '#fde047', 14);
              }
              drawRoundedBox(c, 105 + cI * 54, 180 + rI * 54, 48, 48, 8, cur[rI * 5 + cI] ? '#38bdf8' : '#334155', '#94a3b8');
            }
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: '24-math-speed',
    num: 78,
    title: '24 Math Speed',
    icon: '➕',
    category: 'puzzles',
    color: '#22c55e',
    controlsHint: 'Tap number → operator → number until one tile equals 24!',
    desc: 'Quick mental math: combine 4 numbers to make 24.',
    create(rt): MiniGameInstance {
      const sets = [
        [3, 8, 2, 2],
        [4, 6, 1, 1],
        [6, 6, 6, 6],
        [8, 3, 4, 1],
        [9, 3, 4, 2],
      ];
      let nums = [...sets[0]];
      let firstIdx: number | null = null;
      let op: '+' | '-' | '×' | '÷' | null = null;
      let score = 0;
      const nextSet = () => {
        nums = [...sets[Math.floor(Math.random() * sets.length)]];
        firstIdx = null;
        op = null;
      };
      return {
        update(_dt, inp) {
          if (inp.justPressed) {
            if (inp.y > 460) {
              nextSet();
              rt.sfx.tap();
              return;
            }
            if (inp.y >= 170 && inp.y <= 290) {
              const i = clamp(Math.floor((inp.x - 24) / 94), 0, nums.length - 1);
              if (firstIdx === null || op === null) {
                firstIdx = i;
                rt.sfx.tap();
              } else if (i !== firstIdx) {
                const a = nums[firstIdx];
                const b = nums[i];
                let res = a + b;
                if (op === '-') res = a - b;
                if (op === '×') res = a * b;
                if (op === '÷') res = b !== 0 ? a / b : a;
                const remaining = nums.filter((_, idx) => idx !== firstIdx && idx !== i);
                remaining.push(Math.round(res * 100) / 100);
                nums = remaining;
                firstIdx = null;
                op = null;
                rt.sfx.score();
                if (nums.length === 1 && Math.abs(nums[0] - 24) < 0.01) {
                  score += 100;
                  rt.setScore(score);
                  rt.sfx.win();
                  nextSet();
                }
              }
            } else if (inp.y >= 330 && inp.y <= 410) {
              const ops: ('+' | '-' | '×' | '÷')[] = ['+', '-', '×', '÷'];
              op = ops[clamp(Math.floor((inp.x - 24) / 94), 0, 3)];
              rt.sfx.tap();
            }
          }
          rt.setStatus('Make 24! Tap Reset if stuck');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#064e3b', '#090d16');
          nums.forEach((n, i) => {
            drawRoundedBox(c, 28 + i * 94, 175, 82, 96, 14, '#1e293b', firstIdx === i ? '#fde047' : '#2dd4bf');
            drawBadgeText(c, `${n}`, 69 + i * 94, 223, '#fff', 28);
          });
          (['+', '-', '×', '÷'] as const).forEach((s, i) => {
            drawRoundedBox(c, 28 + i * 94, 335, 82, 68, 14, op === s ? '#facc15' : '#334155');
            drawBadgeText(c, s, 69 + i * 94, 369, op === s ? '#000' : '#fff', 30);
          });
          drawRoundedBox(c, 110, 480, 200, 50, 14, '#475569');
          drawBadgeText(c, '🔄 Reset Cards', W / 2, 505, '#fff', 16);
        },
      };
    },
  },
  {
    id: 'memory-chain-blitz',
    num: 79,
    title: 'Memory Chain Blitz',
    icon: '🧠',
    category: 'puzzles',
    color: '#a855f7',
    controlsHint: 'Watch the glowing pads and repeat the sequence cleanly!',
    desc: 'High-speed Simon Says memory challenge.',
    create(rt): MiniGameInstance {
      const seq: number[] = [Math.floor(Math.random() * 4)];
      let showIdx = 0;
      let timer = 0.5;
      let showing = true;
      let inputIdx = 0;
      let lit = -1;
      let score = 0;
      const cols = ['#ef4444', '#38bdf8', '#22c55e', '#facc15'];
      return {
        update(dt, inp) {
          if (showing) {
            timer -= dt;
            if (timer <= 0) {
              if (lit >= 0) {
                lit = -1;
                showIdx++;
                timer = 0.2;
                if (showIdx >= seq.length) {
                  showing = false;
                  inputIdx = 0;
                }
              } else {
                lit = seq[showIdx];
                rt.sfx.tap();
                timer = 0.45;
              }
            }
          } else if (inp.justPressed) {
            if (inp.x < 35 || inp.x > W - 35 || inp.y < 155 || inp.y > 520) return;
            const c = inp.x < W / 2 ? 0 : 1;
            const r = inp.y < 336 ? 0 : 1;
            const pad = r * 2 + c;
            if (pad === seq[inputIdx]) {
              inputIdx++;
              rt.sfx.score();
              if (inputIdx >= seq.length) {
                score += seq.length * 20;
                rt.setScore(score);
                rt.sfx.win();
                seq.push(Math.floor(Math.random() * 4));
                showing = true;
                showIdx = 0;
                timer = 0.7;
              }
            } else {
              rt.sfx.explode();
              rt.endGame(score, `Wrong pad! Streak: ${seq.length}`);
              return;
            }
          }
          rt.setStatus(showing ? `Watch closely (${seq.length} steps)...` : `Your turn: ${inputIdx}/${seq.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e1b4b', 'rgba(168,85,247,0.16)');
          for (let i = 0; i < 4; i++) {
            const x = 42 + (i % 2) * 176;
            const y = 160 + Math.floor(i / 2) * 176;
            c.globalAlpha = lit === i ? 1 : 0.45;
            drawRoundedBox(c, x, y, 160, 160, 22, cols[i], lit === i ? '#fff' : undefined, lit === i ? cols[i] : undefined);
            c.globalAlpha = 1;
          }
        },
      };
    },
  },
  {
    id: 'hexa-merge',
    num: 80,
    title: 'Hexa Merge',
    icon: '🐝',
    category: 'puzzles',
    color: '#eab308',
    controlsHint: 'Tap a column to drop the block & merge matching numbers!',
    desc: 'Drop & merge numbers before the stack hits the top.',
    create(rt): MiniGameInstance {
      const cols: number[][] = [[], [], [], [], []];
      let nextVal = 2;
      let score = 0;
      const dropIn = (colIdx: number) => {
        const col = cols[colIdx];
        if (col.length >= 7) {
          rt.sfx.explode();
          rt.endGame(score, `Column full! Score: ${score}`);
          return;
        }
        col.push(nextVal);
        while (col.length >= 2 && col[col.length - 1] === col[col.length - 2]) {
          const v = (col.pop() as number) * 2;
          col[col.length - 1] = v;
          score += v;
          rt.sfx.score();
        }
        rt.setScore(score);
        nextVal = [2, 4, 8][Math.floor(Math.random() * 3)];
      };
      return {
        update(_dt, inp) {
          if (inp.justPressed) {
            const colIdx = clamp(Math.floor((inp.x - 25) / 74), 0, 4);
            dropIn(colIdx);
          }
          rt.setStatus(`Next block: ${nextVal}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#422006', '#090d16');
          drawRoundedBox(c, W / 2 - 34, 88, 68, 52, 12, '#facc15', '#fff');
          drawBadgeText(c, `${nextVal}`, W / 2, 114, '#000', 22);
          for (let ci = 0; ci < 5; ci++) {
            const bx = 30 + ci * 74;
            drawRoundedBox(c, bx, 160, 66, 430, 10, 'rgba(255,255,255,0.06)', '#78350f');
            cols[ci].forEach((v, ri) => {
              const by = 532 - ri * 58;
              drawRoundedBox(c, bx + 4, by, 58, 52, 10, v >= 32 ? '#ef4444' : v >= 8 ? '#fb923c' : '#fde047');
              drawBadgeText(c, `${v}`, bx + 33, by + 26, '#000', 18);
            });
          }
        },
      };
    },
  },
];
