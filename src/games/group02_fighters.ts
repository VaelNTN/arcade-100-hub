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
  FloatingPopup,
  rand,
  spawnBurst,
  spawnPopup,
  updateAndDrawBursts,
  updateAndDrawPopups,
} from '../game/engineHelpers';

export const GROUP_02_FIGHTERS: MiniGameDef[] = [
  {
    id: 'divekick-dojo',
    num: 11,
    title: 'Divekick Dojo',
    icon: '🥋',
    category: 'fighters',
    color: '#ef4444',
    controlsHint: 'Tap to jump, tap again mid-air for a Divekick!',
    desc: '1-hit KO dojo duel! Leap above your rival and land a diving kick.',
    create(rt): MiniGameInstance {
      let px = 110;
      let py = 490;
      let pvy = 0;
      let pvx = 0;
      let diving = false;
      let ax = 310;
      let ay = 490;
      let avy = 0;
      let avx = 0;
      let aiTimer = 0.7;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const resetRound = () => {
        px = 100;
        py = 490;
        pvx = 0;
        pvy = 0;
        diving = false;
        ax = 320;
        ay = 490;
        avx = 0;
        avy = 0;
        aiTimer = 0.6;
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            if (py >= 489) {
              pvy = -520;
              diving = false;
              rt.sfx.tap();
            } else if (!diving) {
              diving = true;
              pvx = 340;
              pvy = 480;
              rt.sfx.score();
            }
          }
          pvy += (diving ? 100 : 1080) * dt;
          px = clamp(px + pvx * dt, 40, W - 40);
          py += pvy * dt;
          if (py >= 490) {
            py = 490;
            pvy = 0;
            pvx = 0;
            diving = false;
          }
          aiTimer -= dt;
          if (aiTimer <= 0 && ay >= 489) {
            avy = -500;
            avx = 0;
            aiTimer = rand(0.9, 1.8);
          } else if (ay < 320 && avx === 0) {
            avx = -260;
            avy = 420;
          }
          avy += 980 * dt;
          ax = clamp(ax + avx * dt, 40, W - 40);
          ay += avy * dt;
          if (ay >= 490) {
            ay = 490;
            avy = 0;
            avx = 0;
          }
          if (Math.hypot(px - ax, py - ay) < 42 && (diving || avx !== 0)) {
            if (py < ay + 4 && diving) {
              score += 100;
              rt.setScore(score);
              rt.sfx.explode();
              spawnBurst(bursts, ax, ay, '#facc15', 14);
              spawnPopup(popups, ax, ay - 24, 'KO! +100', '#fde047');
              resetRound();
            } else {
              lives--;
              rt.sfx.hit();
              spawnBurst(bursts, px, py, '#ef4444', 12);
              if (lives <= 0) {
                rt.endGame(score, `Dojo KO! Final score: ${score}`);
                return;
              }
              resetRound();
            }
          }
          rt.setStatus(`Rounds Won: ${score / 100}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#7f1d1d', '#090d16', 'rgba(239, 68, 68, 0.16)');
          drawRoundedBox(c, 0, 520, W, 120, 0, '#451a03', '#f59e0b');
          drawCharacterSprite(c, px, py, {
            style: 'runner',
            suitColor: '#f8fafc',
            accentColor: '#ef4444',
            dir: 1,
            action: diving ? 'kick' : py < 488 ? 'jump' : 'idle',
            scale: 1.35,
            glow: diving ? '#facc15' : undefined,
          });
          drawCharacterSprite(c, ax, ay, {
            style: 'ninja',
            suitColor: '#1e1b4b',
            accentColor: '#38bdf8',
            dir: -1,
            action: avx !== 0 ? 'kick' : ay < 488 ? 'jump' : 'idle',
            scale: 1.35,
          });
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'samurai-draw',
    num: 12,
    title: 'Samurai Draw',
    icon: '⚔️',
    category: 'fighters',
    color: '#f59e0b',
    controlsHint: 'Wait for the golden "!" signal and TAP lightning fast!',
    desc: 'Stare down your rival. Strike first on the signal — early taps lose!',
    create(rt): MiniGameInstance {
      let state: 'wait' | 'ready' | 'cooldown' = 'wait';
      let waitTimer = rand(1.4, 3.2);
      let reactMs = 0;
      let aiLimit = 0.55;
      let score = 0;
      let round = 1;
      let banner = 'Wait for signal...';
      let slashLife = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (slashLife > 0) slashLife -= dt;
          if (state === 'wait') {
            waitTimer -= dt;
            if (inp.justPressed) {
              rt.sfx.hit();
              rt.endGame(score, `Struck too early in round ${round}!`);
              return;
            }
            if (waitTimer <= 0) {
              state = 'ready';
              reactMs = 0;
              banner = '⚡ STRIKE NOW!! ⚡';
              rt.sfx.tap();
            }
          } else if (state === 'ready') {
            reactMs += dt;
            if (inp.justPressed) {
              const pts = Math.max(50, Math.round((aiLimit - reactMs) * 600));
              score += pts;
              rt.setScore(score);
              rt.sfx.win();
              slashLife = 0.25;
              spawnBurst(bursts, 320, 410, '#fde047', 16);
              spawnPopup(popups, 310, 355, `+${pts}`, '#fde047', 22);
              banner = `WON! (${Math.round(reactMs * 1000)}ms)`;
              state = 'cooldown';
              waitTimer = 1.2;
              round++;
              aiLimit = Math.max(0.24, 0.55 - round * 0.035);
            } else if (reactMs >= aiLimit) {
              rt.sfx.explode();
              rt.endGame(score, `Too slow! Rival struck in ${Math.round(aiLimit * 1000)}ms`);
              return;
            }
          } else {
            waitTimer -= dt;
            if (waitTimer <= 0) {
              state = 'wait';
              waitTimer = rand(1.3, 3.3);
              banner = `Round ${round} · Focus...`;
            }
          }
          rt.setStatus(banner);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, state === 'ready' ? '#facc15' : '#1c1917', '#090d16');
          drawRoundedBox(c, 0, 440, W, 200, 0, '#292524');
          drawCharacterSprite(c, 100, 414, {
            style: 'ninja',
            suitColor: '#0f172a',
            accentColor: '#38bdf8',
            dir: 1,
            action: slashLife > 0 ? 'punch' : 'guard',
            scale: 1.45,
          });
          drawCharacterSprite(c, 320, 414, {
            style: 'monster',
            suitColor: '#7f1d1d',
            accentColor: '#fde047',
            dir: -1,
            action: 'guard',
            scale: 1.45,
          });
          if (slashLife > 0) {
            drawGlowLine(c, 70, 450, 360, 360, '#fef08a', 6, '#facc15');
          }
          if (state === 'ready') drawBadgeText(c, '❗', W / 2, 230, '#ef4444', 96);
          else drawBadgeText(c, banner, W / 2, 230, '#fde68a', 24);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'slap-king-rhythm',
    num: 13,
    title: 'Slap King Rhythm',
    icon: '🖐️',
    category: 'fighters',
    color: '#ec4899',
    controlsHint: 'Tap when the power needle hits the CENTER for maximum impact!',
    desc: 'Timing slap duel: land massive hits to knock out tougher champs.',
    create(rt): MiniGameInstance {
      let needle = 0.5;
      let dir = 1;
      let speed = 1.8;
      let score = 0;
      let enemyHp = 100;
      let tries = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          needle += dir * speed * dt;
          if (needle >= 1) {
            needle = 1;
            dir = -1;
          } else if (needle <= 0) {
            needle = 0;
            dir = 1;
          }
          if (inp.justPressed) {
            const acc = 1 - Math.abs(needle - 0.5) * 2;
            const dmg = Math.round(15 + acc * 65);
            enemyHp -= dmg;
            score += dmg * 3;
            rt.setScore(score);
            spawnBurst(bursts, 290, 260, acc > 0.8 ? '#facc15' : '#f472b6', 14);
            spawnPopup(popups, 300, 225, `-${dmg} HP`, acc > 0.8 ? '#fde047' : '#f472b6');
            if (enemyHp <= 0) {
              rt.sfx.win();
              score += 150;
              rt.setScore(score);
              spawnPopup(popups, W / 2, 175, 'KO! +150', '#22c55e', 22);
              enemyHp = 120;
              tries = 3;
              speed = Math.min(4.2, speed + 0.35);
            } else {
              tries--;
              rt.sfx.score();
              if (tries <= 0) {
                rt.sfx.hit();
                rt.endGame(score, `Opponent survived! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Enemy HP: ${enemyHp} · Tries: ${tries}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#4c0519', '#0f172a', 'rgba(236, 72, 153, 0.16)');
          drawCharacterSprite(c, 110, 275, {
            style: 'runner',
            suitColor: '#38bdf8',
            accentColor: '#fde047',
            dir: 1,
            action: bursts.length > 0 ? 'punch' : 'guard',
            scale: 1.5,
          });
          drawCharacterSprite(c, 300, 275, {
            style: 'sumo',
            suitColor: '#991b1b',
            accentColor: '#facc15',
            dir: -1,
            action: 'guard',
            scale: 1.55,
          });
          drawRoundedBox(c, 50, 430, 320, 28, 14, '#1e293b', '#f472b6');
          drawRoundedBox(c, 185, 432, 50, 24, 8, '#22c55e');
          drawCircle(c, 50 + needle * 320, 444, 14, '#fde047', '#fff', '#facc15');
          drawBadgeText(c, `HP ${enemyHp}`, 300, 200, '#fca5a5', 20);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'sumo-ring-push',
    num: 14,
    title: 'Sumo Ring Push',
    icon: '🏋️',
    category: 'fighters',
    color: '#b45309',
    controlsHint: 'Tap as FAST as possible to push your rival out of the ring!',
    desc: 'Dohyo ring power duel: mash faster each round to win.',
    create(rt): MiniGameInstance {
      let balance = 0; // -1 lose, +1 win
      let aiForce = 0.42;
      let score = 0;
      let round = 1;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          balance -= (aiForce + Math.sin(performance.now() * 0.005) * 0.14) * dt;
          if (inp.justPressed) {
            balance += 0.14;
            rt.sfx.tap();
          }
          if (balance >= 1) {
            const pts = round * 120;
            score += pts;
            round++;
            balance = 0;
            aiForce = Math.min(1.45, aiForce + 0.16);
            rt.setScore(score);
            rt.sfx.win();
            spawnBurst(bursts, W / 2 + 95, 330, '#fde047', 16);
            spawnPopup(popups, W / 2, 230, `RING OUT! +${pts}`, '#fde047', 20);
          } else if (balance <= -1) {
            rt.sfx.explode();
            rt.endGame(score, `Pushed out of the ring in round ${round}!`);
            return;
          }
          rt.setStatus(`Round ${round} · Tap fast to push!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#78350f', '#1c1917', 'rgba(250,204,21,0.12)');
          drawCircle(c, W / 2, 330, 155, '#d6b384', '#facc15', '#f59e0b');
          const ox = W / 2 + balance * 95;
          drawCharacterSprite(c, ox - 28, 330, {
            style: 'sumo',
            suitColor: '#ef4444',
            accentColor: '#fde047',
            dir: 1,
            stride: balance * 10,
            action: 'punch',
            scale: 1.45,
          });
          drawCharacterSprite(c, ox + 28, 330, {
            style: 'monster',
            suitColor: '#334155',
            accentColor: '#f87171',
            dir: -1,
            stride: balance * 10,
            action: 'guard',
            scale: 1.45,
          });
          drawBadgeText(c, 'TAP SUPER FAST!', W / 2, 540, '#fde047', 22);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'stickman-spear-throw',
    num: 15,
    title: 'Stickman Spear Throw',
    icon: '🏹',
    category: 'fighters',
    color: '#0ea5e9',
    controlsHint: 'Drag back anywhere and release to launch spears!',
    desc: 'Aim arc shots with gravity against distant targets.',
    create(rt): MiniGameInstance {
      let targetX = 320;
      let targetY = rand(180, 420);
      const spears: { x: number; y: number; vx: number; vy: number }[] = [];
      let dragPull: { dx: number; dy: number } | null = null;
      let score = 0;
      let ammo = 8;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) {
            const rawDx = inp.startX - inp.x;
            const rawDy = inp.startY - inp.y;
            if (Math.hypot(rawDx, rawDy) > 10) {
              dragPull = { dx: clamp(rawDx, 25, 220), dy: clamp(rawDy, -260, 260) };
            } else {
              dragPull = { dx: clamp(80 - inp.x, 25, 220), dy: clamp(470 - inp.y, -260, 260) };
            }
          }
          if (inp.justReleased && dragPull && ammo > 0) {
            spears.push({ x: 80, y: 470, vx: dragPull.dx * 3.2, vy: dragPull.dy * 3.2 });
            ammo--;
            dragPull = null;
            rt.sfx.tap();
          } else if (inp.justReleased) {
            dragPull = null;
          }
          for (let i = spears.length - 1; i >= 0; i--) {
            const s = spears[i];
            s.vy += 640 * dt;
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (Math.hypot(s.x - targetX, s.y - targetY) < 32) {
              score += 100;
              ammo += 2;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, targetX, targetY, '#facc15', 14);
              spawnPopup(popups, targetX, targetY - 18, '+100', '#fde047');
              spears.splice(i, 1);
              targetX = rand(230, 375);
              targetY = rand(140, 470);
              continue;
            }
            if (s.x > W + 30 || s.y > H + 30) spears.splice(i, 1);
          }
          if (ammo <= 0 && spears.length === 0) {
            rt.sfx.hit();
            rt.endGame(score, `Out of spears! Final score: ${score}`);
            return;
          }
          rt.setStatus(`Spears left: ${ammo}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b', 'rgba(14, 165, 233, 0.14)');
          drawCharacterSprite(c, 74, 474, {
            style: 'ninja',
            suitColor: '#1e293b',
            accentColor: '#38bdf8',
            dir: 1,
            action: dragPull ? 'guard' : 'idle',
            scale: 1.3,
          });
          drawBadgeText(c, '🎯', targetX, targetY, '#fff', 38);
          if (dragPull) {
            c.strokeStyle = '#facc15';
            c.lineWidth = 3;
            c.setLineDash([6, 6]);
            c.beginPath();
            c.moveTo(80, 470);
            c.lineTo(80 + dragPull.dx, 470 + dragPull.dy);
            c.stroke();
            c.setLineDash([]);
          }
          for (const s of spears) {
            const a = Math.atan2(s.vy, s.vx);
            drawGlowLine(
              c,
              s.x - Math.cos(a) * 14,
              s.y - Math.sin(a) * 14,
              s.x + Math.cos(a) * 14,
              s.y + Math.sin(a) * 14,
              '#fde047',
              4,
              '#facc15'
            );
          }
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'boxer-dodge-counter',
    num: 16,
    title: 'Boxer Dodge Counter',
    icon: '🥊',
    category: 'fighters',
    color: '#dc2626',
    controlsHint: 'Tap LEFT or RIGHT away from incoming red punches!',
    desc: "Read the champ's telegraph, slip punches, and score counters.",
    create(rt): MiniGameInstance {
      let side: 'L' | 'R' = 'L';
      let enemySide: 'L' | 'R' = 'R';
      let charge = 0;
      let interval = 1.1;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            const next = inp.x < W / 2 ? 'L' : 'R';
            if (next !== side) rt.sfx.tap();
            side = next;
          }
          charge += dt / interval;
          if (charge >= 1) {
            charge = 0;
            const px = side === 'L' ? 120 : 300;
            if (side === enemySide) {
              lives--;
              rt.sfx.hit();
              spawnBurst(bursts, px, 470, '#ef4444', 12);
              if (lives <= 0) {
                rt.endGame(score, `Knocked out! Score: ${score}`);
                return;
              }
            } else {
              score += 50;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, px, 470, '#fde047', 12);
              spawnPopup(popups, px, 435, 'COUNTER +50', '#fde047');
              interval = Math.max(0.45, interval - 0.03);
            }
            enemySide = Math.random() < 0.5 ? 'L' : 'R';
          }
          rt.setStatus(`Score: ${score} · Dodge ${enemySide === 'L' ? 'LEFT' : 'RIGHT'}!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16', 'rgba(220,38,38,0.16)');
          drawCharacterSprite(c, W / 2, 185, {
            style: 'boxer',
            suitColor: '#7f1d1d',
            accentColor: '#fde047',
            dir: enemySide === 'L' ? -1 : 1,
            action: charge > 0.7 ? 'punch' : 'guard',
            scale: 1.85,
          });
          const warnX = enemySide === 'L' ? 120 : 300;
          drawCircle(c, warnX, 310, 26 + charge * 26, `rgba(239,68,68,${0.3 + charge * 0.6})`, '#fca5a5');
          drawBadgeText(c, '🥊', warnX, 310, '#fff', 36);
          drawCharacterSprite(c, side === 'L' ? 120 : 300, 492, {
            style: 'boxer',
            suitColor: '#2563eb',
            accentColor: '#38bdf8',
            dir: side === 'L' ? 1 : -1,
            action: 'guard',
            scale: 1.4,
          });
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'knight-joust-charge',
    num: 17,
    title: 'Knight Joust Charge',
    icon: '🐎',
    category: 'fighters',
    color: '#64748b',
    controlsHint: 'Drag up/down to align your lance with the golden target!',
    desc: "Medieval jousting: strike the charging knight's weak spot.",
    create(rt): MiniGameInstance {
      let lanceY = 300;
      let targetY = rand(220, 390);
      let chargeX = W + 40;
      let speed = 230;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.down) lanceY = clamp(inp.y, 180, 440);
          chargeX -= speed * dt;
          if (chargeX <= 125) {
            if (Math.abs(lanceY - targetY) < 42) {
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
              spawnBurst(bursts, 130, targetY, '#fde047', 16);
              spawnPopup(popups, 150, targetY - 20, 'DIRECT HIT! +100', '#fde047');
              speed = Math.min(500, speed + 28);
            } else {
              lives--;
              rt.sfx.hit();
              spawnBurst(bursts, 100, lanceY, '#ef4444', 12);
              if (lives <= 0) {
                rt.endGame(score, `Unhorsed! Score: ${score}`);
                return;
              }
            }
            chargeX = W + 60;
            targetY = rand(200, 410);
          }
          rt.setStatus(`Tournament Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#14532d', 'rgba(100,116,139,0.14)');
          drawRoundedBox(c, 0, 440, W, 200, 0, '#92400e');
          drawCharacterSprite(c, 84, lanceY, {
            style: 'knight',
            suitColor: '#64748b',
            accentColor: '#38bdf8',
            dir: 1,
            action: 'punch',
            scale: 1.35,
          });
          drawGlowLine(c, 95, lanceY, 155, lanceY, '#e2e8f0', 6, '#38bdf8');

          drawCharacterSprite(c, chargeX, 340, {
            style: 'knight',
            suitColor: '#991b1b',
            accentColor: '#facc15',
            dir: -1,
            stride: chargeX * 0.15,
            action: 'punch',
            scale: 1.4,
          });
          drawCircle(c, chargeX - 10, targetY, 22, 'rgba(250,204,21,0.35)', '#facc15');
          drawBadgeText(c, '🎯', chargeX - 10, targetY, '#fff', 26);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'ninja-shuriken-parry',
    num: 18,
    title: 'Ninja Shuriken Parry',
    icon: '🥷',
    category: 'fighters',
    color: '#6366f1',
    controlsHint: 'Tap UP, DOWN, LEFT, or RIGHT to parry incoming shurikens!',
    desc: '360-degree ninja defense: parry flying stars before they hit.',
    create(rt): MiniGameInstance {
      type Dir = 0 | 1 | 2 | 3; // U, R, D, L
      const stars: { dir: Dir; dist: number; speed: number }[] = [{ dir: 0, dist: 230, speed: 120 }];
      let spawnT = 0.8;
      let score = 0;
      let lives = 3;
      let spin = 0;
      let lastDir: 1 | -1 = 1;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const cx = W / 2;
      const cy = 330;
      const posOf = (d: Dir, dist: number) => {
        if (d === 0) return { x: cx, y: cy - dist };
        if (d === 1) return { x: cx + dist, y: cy };
        if (d === 2) return { x: cx, y: cy + dist };
        return { x: cx - dist, y: cy };
      };
      return {
        update(dt, inp) {
          lastDt = dt;
          spin += dt * 10;
          spawnT -= dt;
          if (spawnT <= 0) {
            stars.push({ dir: Math.floor(Math.random() * 4) as Dir, dist: 240, speed: 115 + score * 0.4 });
            spawnT = Math.max(0.36, 1.0 - score * 0.002);
          }
          if (inp.justPressed) {
            const dx = inp.x - cx;
            const dy = inp.y - cy;
            const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
            if (d === 1) lastDir = 1;
            else if (d === 3) lastDir = -1;
            const idx = stars.findIndex((s) => s.dir === d && s.dist < 135);
            if (idx >= 0) {
              const hitPos = posOf(stars[idx].dir, stars[idx].dist);
              stars.splice(idx, 1);
              score += 20;
              rt.setScore(score);
              rt.sfx.score();
              spawnBurst(bursts, hitPos.x, hitPos.y, '#38bdf8', 12);
              spawnPopup(popups, hitPos.x, hitPos.y - 12, '+20', '#7dd3fc');
            } else rt.sfx.tap();
          }
          for (let i = stars.length - 1; i >= 0; i--) {
            stars[i].dist -= stars[i].speed * dt;
            if (stars[i].dist < 24) {
              stars.splice(i, 1);
              lives--;
              rt.sfx.hit();
              spawnBurst(bursts, cx, cy, '#ef4444', 12);
              if (lives <= 0) {
                rt.endGame(score, `Hit! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Parried: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16', 'rgba(99, 102, 241, 0.16)');
          drawCircle(c, cx, cy, 125, 'rgba(99,102,241,0.08)', '#818cf8');
          drawCharacterSprite(c, cx, cy, {
            style: 'ninja',
            suitColor: '#1e1b4b',
            accentColor: '#38bdf8',
            dir: lastDir,
            action: 'guard',
            scale: 1.4,
            glow: '#818cf8',
          });
          for (const s of stars) {
            const p = posOf(s.dir, s.dist);
            c.save();
            c.translate(p.x, p.y);
            c.rotate(spin);
            c.fillStyle = '#e2e8f0';
            c.strokeStyle = '#38bdf8';
            c.lineWidth = 2;
            c.beginPath();
            for (let k = 0; k < 4; k++) {
              const a = (k * Math.PI) / 2;
              c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
              c.lineTo(Math.cos(a + Math.PI / 4) * 5, Math.sin(a + Math.PI / 4) * 5);
            }
            c.closePath();
            c.fill();
            c.stroke();
            c.restore();
          }
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'gladiator-arena-survival',
    num: 19,
    title: 'Gladiator Arena',
    icon: '🏛️',
    category: 'fighters',
    color: '#eab308',
    controlsHint: 'Tap anywhere to dash in that direction and slice through foes!',
    desc: 'One-button colosseum dash combat against charging gladiators.',
    create(rt): MiniGameInstance {
      let gx = W / 2;
      let gy = 340;
      let tx = gx;
      let ty = gy;
      let dashT = 0;
      let score = 0;
      let lives = 3;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const foes = Array.from({ length: 4 }, () => ({
        x: rand(30, W - 30),
        y: Math.random() < 0.5 ? 70 : H - 40,
      }));
      return {
        update(dt, inp) {
          lastDt = dt;
          if (inp.justPressed) {
            tx = clamp(inp.x, 30, W - 30);
            ty = clamp(inp.y, 90, H - 40);
            dashT = 0.25;
            rt.sfx.tap();
          }
          if (dashT > 0) dashT -= dt;
          gx += (tx - gx) * 10 * dt;
          gy += (ty - gy) * 10 * dt;
          for (const f of foes) {
            const dx = gx - f.x;
            const dy = gy - f.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const spd = 65 + score * 0.2;
            f.x += (dx / dist) * spd * dt;
            f.y += (dy / dist) * spd * dt;
            if (dist < 28) {
              if (dashT > 0) {
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, f.x, f.y, '#fde047', 12);
                spawnPopup(popups, f.x, f.y - 12, '+25', '#fde047', 16);
              } else {
                lives--;
                rt.sfx.hit();
                spawnBurst(bursts, gx, gy, '#ef4444', 12);
                if (lives <= 0) {
                  rt.endGame(score, `Arena score: ${score}`);
                  return;
                }
              }
              f.x = rand(20, W - 20);
              f.y = Math.random() < 0.5 ? 60 : H - 30;
            }
          }
          rt.setStatus(`Survive · Dash into foes!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#78350f', '#451a03', 'rgba(234,179,8,0.14)');
          drawCircle(c, W / 2, 340, 195, 'rgba(254,240,138,0.08)', '#f59e0b');
          for (const f of foes) {
            drawCharacterSprite(c, f.x, f.y, {
              style: 'monster',
              suitColor: '#7f1d1d',
              accentColor: '#fbbf24',
              dir: f.x < gx ? 1 : -1,
              stride: f.x * 0.2,
              action: 'idle',
              scale: 1.05,
            });
          }
          drawCharacterSprite(c, gx, gy, {
            style: 'knight',
            suitColor: '#94a3b8',
            accentColor: '#facc15',
            dir: tx >= gx ? 1 : -1,
            action: dashT > 0 ? 'punch' : 'guard',
            scale: 1.25,
            glow: dashT > 0 ? '#fde047' : undefined,
          });
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
  {
    id: 'laser-sword-deflect',
    num: 20,
    title: 'Laser Sword Deflect',
    icon: '🔦',
    category: 'fighters',
    color: '#38bdf8',
    controlsHint: 'Tap LEFT, CENTER, or RIGHT to deflect droid laser bolts!',
    desc: 'Deflect incoming blaster shots right back at the 3 hover droids.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      let lives = 3;
      let time = 0;
      let lastDt = 0.016;
      const bursts: Burst[] = [];
      const popups: FloatingPopup[] = [];
      const laneX = (l: number) => 85 + l * 125;
      const bolts: { lane: number; y: number; vy: number }[] = [{ lane: 1, y: 120, vy: 250 }];
      let spawnT = 0.9;
      return {
        update(dt, inp) {
          lastDt = dt;
          time += dt;
          if (inp.justPressed) {
            lane = clamp(Math.floor(inp.x / (W / 3)), 0, 2);
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            bolts.push({ lane: Math.floor(Math.random() * 3), y: 120, vy: 240 + score * 0.7 });
            spawnT = Math.max(0.4, 1.05 - score * 0.003);
          }
          for (let i = bolts.length - 1; i >= 0; i--) {
            const b = bolts[i];
            b.y += b.vy * dt;
            if (b.vy > 0 && b.y >= 490 && b.y <= 535 && b.lane === lane) {
              b.vy = -420;
              rt.sfx.score();
              spawnBurst(bursts, laneX(lane), 505, '#38bdf8', 10);
            } else if (b.vy < 0 && b.y <= 120) {
              spawnBurst(bursts, laneX(b.lane), 110, '#facc15', 10);
              spawnPopup(popups, laneX(b.lane), 130, '+30', '#fde047');
              bolts.splice(i, 1);
              score += 30;
              rt.setScore(score);
            } else if (b.y > H) {
              bolts.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Droid lasers breached (${score} pt)!`);
                return;
              }
            }
          }
          rt.setStatus(`Deflected shots: ${score / 30}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#0f172a', 'rgba(56, 189, 248, 0.14)');
          for (let i = 0; i < 3; i++) {
            drawShipSprite(c, laneX(i), 100, 0, '#6366f1', '#38bdf8', { kind: 'ufo', scale: 0.95, time: time + i });
          }
          for (const b of bolts) {
            const lx = laneX(b.lane);
            drawGlowLine(c, lx, b.y - 12, lx, b.y + 12, b.vy > 0 ? '#ef4444' : '#38bdf8', 6);
          }
          drawRoundedBox(c, laneX(lane) - 34, 505, 68, 12, 6, '#38bdf8', '#fff', '#38bdf8');
          drawCharacterSprite(c, laneX(lane), 548, {
            style: 'robot',
            suitColor: '#0284c7',
            accentColor: '#38bdf8',
            dir: 1,
            action: 'guard',
            scale: 1.2,
            glow: '#38bdf8',
          });
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, lastDt);
          updateAndDrawPopups(c, popups, lastDt);
        },
      };
    },
  },
];

