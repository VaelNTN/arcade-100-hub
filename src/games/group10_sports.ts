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
      const reset = () => {
        bx = W / 2;
        by = 520;
        vx = 0;
        vy = 0;
        shooting = false;
      };
      return {
        update(dt, inp) {
          keeperX += keeperVx * dt;
          if (keeperX < 95 || keeperX > W - 95) keeperVx *= -1;
          if (!shooting && inp.justReleased && inp.startY - inp.y > 25) {
            shooting = true;
            vx = clamp((inp.x - bx) * 2.5, -260, 260);
            vy = -520;
            rt.sfx.tap();
          }
          if (shooting) {
            bx += vx * dt;
            by += vy * dt;
            if (Math.abs(by - 165) < 22 && Math.abs(bx - keeperX) < 38) {
              lives--;
              rt.sfx.hit();
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
                keeperVx = (keeperVx > 0 ? 1 : -1) * Math.min(320, Math.abs(keeperVx) + 20);
              } else {
                lives--;
                rt.sfx.hit();
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
          drawGradientBg(c, '#15803d', '#14532d');
          drawRoundedBox(c, 65, 85, W - 130, 85, 6, 'rgba(255,255,255,0.12)', '#fff');
          drawBadgeText(c, '🧤', keeperX, 165, '#fff', 40);
          drawBadgeText(c, '⚽', bx, by, '#fff', 34);
          drawLives(c, lives);
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
      const reset = () => {
        bx = W / 2;
        by = 520;
        vx = 0;
        vy = 0;
        fly = false;
      };
      return {
        update(dt, inp) {
          if (!fly && inp.justReleased && inp.startY - inp.y > 25) {
            fly = true;
            vx = clamp((inp.x - bx) * 2.1, -240, 240);
            vy = -710;
            rt.sfx.tap();
          }
          if (fly) {
            vy += 760 * dt;
            bx += vx * dt;
            by += vy * dt;
            if (vy > 0 && Math.abs(by - 175) < 22 && Math.abs(bx - hoopX) < 34) {
              score += 50;
              rt.setScore(score);
              rt.sfx.win();
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
          drawGradientBg(c, '#7c2d12', '#1e293b');
          drawRoundedBox(c, hoopX - 55, 115, 110, 65, 8, '#f8fafc', '#ef4444');
          drawRoundedBox(c, hoopX - 30, 170, 60, 10, 5, '#ea580c');
          drawBadgeText(c, '🏀', bx, by, '#fff', 36);
          drawLives(c, lives);
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
      return {
        update(dt, inp) {
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
            } else rt.sfx.hit();
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
          drawGradientBg(c, '#064e3b', '#090d16');
          drawCircle(c, targetX, 260, 54, '#fff', '#0f172a');
          drawCircle(c, targetX, 260, 36, '#38bdf8');
          drawCircle(c, targetX, 260, 18, '#ef4444');
          c.strokeStyle = '#fde047';
          c.lineWidth = 3;
          c.beginPath();
          c.arc(aimX, aimY, 20, 0, Math.PI * 2);
          c.stroke();
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
          drawGradientBg(c, '#1e1b4b', '#090d16');
          drawRoundedBox(c, 80, 75, W - 160, H - 90, 12, '#d97706', '#fde68a');
          for (const p of pins) if (p.up) drawBadgeText(c, '🎳', p.x, p.y, '#fff', 26);
          drawCircle(c, bx, by, 16, '#0f172a', '#38bdf8');
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
      return {
        update(dt, inp) {
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
            rt.sfx.tap();
          }
          if (vy > 0 && by >= 515 && by <= 545 && Math.abs(bx - px) < 52) {
            vy = -Math.abs(vy) * 1.04;
            vx = (bx - px) * 5.8;
            score += 15;
            rt.setScore(score);
            rt.sfx.score();
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
          drawGradientBg(c, '#0369a1', '#0f172a');
          drawRoundedBox(c, 16, 95, W - 32, 460, 10, '#1d4ed8', '#fff');
          c.strokeStyle = 'rgba(255,255,255,0.45)';
          c.beginPath();
          c.moveTo(16, 325);
          c.lineTo(W - 16, 325);
          c.stroke();
          drawRoundedBox(c, px - 48, 525, 96, 16, 8, '#ef4444', '#fff');
          drawCircle(c, bx, by, 10, '#facc15', '#fff');
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
      return {
        update(dt, inp) {
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
          drawGradientBg(c, '#090d16', '#1e293b');
          drawRoundedBox(c, 35, 190, 350, 110, 18, '#0f172a', '#475569');
          for (let i = 0; i < 5; i++) {
            drawCircle(c, 75 + i * 67, 245, 22, phase === 'count' && i < lights ? '#ef4444' : '#334155', '#fff');
          }
          drawBadgeText(c, phase === 'go' ? 'GO! GO! GO!' : 'Get ready...', W / 2, 390, phase === 'go' ? '#22c55e' : '#94a3b8', 26);
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
      return {
        update(dt, inp) {
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
              const h = holes[r * 3 + c];
              if (h.active) {
                h.active = false;
                if (h.bomb) {
                  score = Math.max(0, score - 50);
                  rt.sfx.explode();
                } else {
                  score += 30;
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
          drawGradientBg(c, '#15803d', '#14532d');
          for (let i = 0; i < 9; i++) {
            const x = 100 + (i % 3) * 110;
            const y = 215 + Math.floor(i / 3) * 110;
            drawCircle(c, x, y, 40, '#451a03', '#78350f');
            if (holes[i].active) drawBadgeText(c, holes[i].bomb ? '💣' : '🐹', x, y, '#fff', 40);
          }
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
      let spawnT = 0.4;
      let score = 0;
      let lives = 3;
      return {
        update(dt, inp) {
          spawnT -= dt;
          if (spawnT <= 0) {
            const bomb = Math.random() < 0.2;
            items.push({
              x: rand(60, W - 60),
              y: H + 20,
              vx: rand(-90, 90),
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
          drawGradientBg(c, '#451a03', '#1c1917');
          for (const it of items) drawBadgeText(c, it.icon, it.x, it.y, '#fff', 38);
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
      return {
        update(dt, inp) {
          rope += aiPull * dt;
          if (inp.justPressed) {
            rope -= 0.14;
            rt.sfx.tap();
          }
          if (rope <= -1) {
            score += round * 100;
            round++;
            rope = 0;
            aiPull = Math.min(1.5, aiPull + 0.18);
            rt.setScore(score);
            rt.sfx.win();
          } else if (rope >= 1) {
            rt.sfx.hit();
            rt.endGame(score, `Pulled across the line in round ${round}!`);
            return;
          }
          rt.setStatus(`Round ${round} · Tap fast!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#15803d', '#064e3b');
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
          c.moveTo(45 + ox, 320);
          c.lineTo(W - 45 + ox, 320);
          c.stroke();
          drawBadgeText(c, '🚩', W / 2 + ox, 300, '#fff', 32);
          drawBadgeText(c, '💪', 65 + ox, 320, '#fff', 42);
          drawBadgeText(c, '🤖', W - 65 + ox, 320, '#fff', 42);
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
      return {
        update(dt, inp) {
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
          } else if (progress <= 0) {
            rt.sfx.hit();
            rt.endGame(score, `Fish escaped! Score: ${score}`);
            return;
          }
          rt.setStatus(`Catch: ${Math.round(progress * 100)}%`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0284c7', '#0c4a6e');
          drawRoundedBox(c, W / 2 - 34, 120, 68, 410, 14, '#0f172a', '#bae6fd');
          drawRoundedBox(c, W / 2 - 28, barY - 45, 56, 90, 10, '#22c55e');
          drawBadgeText(c, '🐟', W / 2, fishY, '#fff', 32);
          drawRoundedBox(c, 70, 560, 280 * progress, 18, 9, '#facc15', '#fff');
        },
      };
    },
  },
];
