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

export const GROUP_02_FIGHTERS: MiniGameDef[] = [
  {
    id: 'divekick-dojo',
    num: 11,
    title: 'Divekick Dojo',
    icon: '🥋',
    category: 'fighters',
    color: '#ef4444',
    controlsHint: 'Tik omhoog om te springen, tik opnieuw in de lucht voor een Divekick!',
    desc: '1-Hit KO Dojo-duel! Spring boven je rivaal en land de genadeloze schuine duiktrap.',
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
      const bursts: Burst[] = [];
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
              resetRound();
            } else {
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Dojo KO! Eindscore: ${score}`);
                return;
              }
              resetRound();
            }
          }
          rt.setStatus(`Rondes gewonnen: ${score / 100}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#7f1d1d', '#090d16');
          drawRoundedBox(c, 0, 520, W, 120, 0, '#451a03');
          drawBadgeText(c, diving ? '🦶💥' : '🥋', px, py, '#fff', 40);
          drawBadgeText(c, '🥷', ax, ay, '#fff', 40);
          drawLives(c, lives);
          updateAndDrawBursts(c, bursts, 0.016);
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
    controlsHint: 'Wacht op het gouden "!" teken en TIK razendsnel!',
    desc: 'Staar naar de horizon. Wie het eerst slaat na het signaal wint — te vroeg tikken = straf!',
    create(rt): MiniGameInstance {
      let state: 'wait' | 'ready' | 'cooldown' = 'wait';
      let waitTimer = rand(1.4, 3.2);
      let reactMs = 0;
      let aiLimit = 0.55;
      let score = 0;
      let round = 1;
      let banner = 'Wacht op teken...';
      return {
        update(dt, inp) {
          if (state === 'wait') {
            waitTimer -= dt;
            if (inp.justPressed) {
              rt.sfx.hit();
              rt.endGame(score, `Te vroeg bewogen in ronde ${round}!`);
              return;
            }
            if (waitTimer <= 0) {
              state = 'ready';
              reactMs = 0;
              banner = '⚡ SLAG NU!! ⚡';
              rt.sfx.tap();
            }
          } else if (state === 'ready') {
            reactMs += dt;
            if (inp.justPressed) {
              const pts = Math.max(50, Math.round((aiLimit - reactMs) * 600));
              score += pts;
              rt.setScore(score);
              rt.sfx.win();
              banner = `GEWONNEN! (${Math.round(reactMs * 1000)}ms)`;
              state = 'cooldown';
              waitTimer = 1.2;
              round++;
              aiLimit = Math.max(0.24, 0.55 - round * 0.035);
            } else if (reactMs >= aiLimit) {
              rt.sfx.explode();
              rt.endGame(score, `Te laat! Rival sloeg in ${Math.round(aiLimit * 1000)}ms`);
              return;
            }
          } else {
            waitTimer -= dt;
            if (waitTimer <= 0) {
              state = 'wait';
              waitTimer = rand(1.3, 3.3);
              banner = `Ronde ${round} · Concentreer...`;
            }
          }
          rt.setStatus(banner);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, state === 'ready' ? '#facc15' : '#1c1917', '#090d16');
          drawRoundedBox(c, 0, 440, W, 200, 0, '#292524');
          drawBadgeText(c, '🥷', 100, 410, '#fff', 48);
          drawBadgeText(c, '👹', 320, 410, '#fff', 48);
          if (state === 'ready') drawBadgeText(c, '❗', W / 2, 230, '#ef4444', 96);
          else drawBadgeText(c, banner, W / 2, 230, '#fde68a', 24);
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
    controlsHint: 'Tik zodra de krachtmeter exact in het MIDDEN staat voor maximale impact!',
    desc: 'Timing-vechtspel: bouw gigantische combo-klappen op tegen steeds sterkere kampioenen.',
    create(rt): MiniGameInstance {
      let needle = 0.5;
      let dir = 1;
      let speed = 1.8;
      let score = 0;
      let enemyHp = 100;
      let tries = 3;
      const bursts: Burst[] = [];
      return {
        update(dt, inp) {
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
            spawnBurst(bursts, 290, 260, acc > 0.8 ? '#facc15' : '#f472b6', 12);
            if (enemyHp <= 0) {
              rt.sfx.win();
              score += 150;
              rt.setScore(score);
              enemyHp = 120;
              tries = 3;
              speed = Math.min(4.2, speed + 0.35);
            } else {
              tries--;
              rt.sfx.score();
              if (tries <= 0) {
                rt.sfx.hit();
                rt.endGame(score, `Tegenstander overleefde! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Vijand HP: ${enemyHp} · Pogingen: ${tries}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#4c0519', '#0f172a');
          drawBadgeText(c, '😎', 110, 260, '#fff', 56);
          drawBadgeText(c, '😤', 300, 260, '#fff', 56);
          drawRoundedBox(c, 50, 430, 320, 28, 14, '#1e293b', '#f472b6');
          drawRoundedBox(c, 185, 432, 50, 24, 8, '#22c55e');
          drawCircle(c, 50 + needle * 320, 444, 14, '#fde047', '#fff');
          drawBadgeText(c, `HP ${enemyHp}`, 300, 200, '#fca5a5', 20);
          updateAndDrawBursts(c, bursts, 0.016);
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
    controlsHint: 'Tik zo SNEL mogelijk op de Sumo-knop om de tegenstander uit de ring te duwen!',
    desc: 'Krachtduel in het Japanse dohyo-zand: verhoog je duwtempo elke ronde.',
    create(rt): MiniGameInstance {
      let balance = 0; // -1 lose, +1 win
      let aiForce = 0.42;
      let score = 0;
      let round = 1;
      return {
        update(dt, inp) {
          balance -= (aiForce + Math.sin(performance.now() * 0.005) * 0.14) * dt;
          if (inp.justPressed) {
            balance += 0.14;
            rt.sfx.tap();
          }
          if (balance >= 1) {
            score += round * 120;
            round++;
            balance = 0;
            aiForce = Math.min(1.45, aiForce + 0.16);
            rt.setScore(score);
            rt.sfx.win();
          } else if (balance <= -1) {
            rt.sfx.explode();
            rt.endGame(score, `Uit de ring geduwd in ronde ${round}!`);
            return;
          }
          rt.setStatus(`Ronde ${round} · Tik snel om te duwen!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#78350f', '#1c1917');
          drawCircle(c, W / 2, 330, 155, '#d6b384', '#facc15');
          const ox = W / 2 + balance * 95;
          drawBadgeText(c, '🦍', ox - 32, 330, '#fff', 50);
          drawBadgeText(c, '👹', ox + 32, 330, '#fff', 50);
          drawBadgeText(c, 'TIK RAZENDSNEL!', W / 2, 540, '#fde047', 22);
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
    controlsHint: 'Sleep achteruit vanaf je schutter en laat los om speren naar vijanden te werpen!',
    desc: 'Bereken boogschot en zwaartekracht tegen vijanden op hoge rotsplatformen.',
    create(rt): MiniGameInstance {
      let targetX = 320;
      let targetY = rand(180, 420);
      let spears: { x: number; y: number; vx: number; vy: number }[] = [];
      let dragEnd: { x: number; y: number } | null = null;
      let score = 0;
      let ammo = 8;
      return {
        update(dt, inp) {
          if (inp.down) dragEnd = { x: inp.x, y: inp.y };
          if (inp.justReleased && dragEnd && ammo > 0) {
            const dx = clamp(80 - dragEnd.x, 20, 240);
            const dy = clamp(470 - dragEnd.y, -260, 260);
            spears.push({ x: 80, y: 470, vx: dx * 3.2, vy: dy * 3.2 });
            ammo--;
            dragEnd = null;
            rt.sfx.tap();
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
              spears.splice(i, 1);
              targetX = rand(230, 375);
              targetY = rand(140, 470);
              continue;
            }
            if (s.x > W + 30 || s.y > H + 30) spears.splice(i, 1);
          }
          if (ammo <= 0 && spears.length === 0) {
            rt.sfx.hit();
            rt.endGame(score, `Speren op! Eindscore: ${score}`);
            return;
          }
          rt.setStatus(`Speren over: ${ammo}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e293b');
          drawBadgeText(c, '🏹', 80, 470, '#fff', 40);
          drawBadgeText(c, '🎯', targetX, targetY, '#fff', 38);
          if (dragEnd) {
            c.strokeStyle = '#facc15';
            c.lineWidth = 3;
            c.setLineDash([6, 6]);
            c.beginPath();
            c.moveTo(80, 470);
            c.lineTo(80 + (80 - dragEnd.x), 470 + (470 - dragEnd.y));
            c.stroke();
            c.setLineDash([]);
          }
          for (const s of spears) drawCircle(c, s.x, s.y, 7, '#facc15', '#fff');
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
    controlsHint: 'Tik LINKS of RECHTS weg van rode stoot-waarschuwingen en deel counters uit!',
    desc: 'Lees de waarschuwing van de bokskampioen, ontwijk en land directe uppercuts.',
    create(rt): MiniGameInstance {
      let side: 'L' | 'R' = 'L';
      let enemySide: 'L' | 'R' = 'R';
      let charge = 0;
      let interval = 1.1;
      let score = 0;
      let lives = 3;
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            const next = inp.x < W / 2 ? 'L' : 'R';
            if (next !== side) rt.sfx.tap();
            side = next;
          }
          charge += dt / interval;
          if (charge >= 1) {
            charge = 0;
            if (side === enemySide) {
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Knock-out! Score: ${score}`);
                return;
              }
            } else {
              score += 50;
              rt.setScore(score);
              rt.sfx.score();
              interval = Math.max(0.45, interval - 0.03);
            }
            enemySide = Math.random() < 0.5 ? 'L' : 'R';
          }
          rt.setStatus(`Score: ${score} · Ontwijk ${enemySide === 'L' ? 'LINKS' : 'RECHTS'}!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16');
          drawBadgeText(c, '😈', W / 2, 180, '#fff', 66);
          const warnX = enemySide === 'L' ? 120 : 300;
          drawCircle(c, warnX, 310, 26 + charge * 26, `rgba(239,68,68,${0.3 + charge * 0.6})`);
          drawBadgeText(c, '🥊', warnX, 310, '#fff', 36);
          drawBadgeText(c, '😎', side === 'L' ? 120 : 300, 490, '#fff', 46);
          drawLives(c, lives);
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
    controlsHint: 'Sleep omhoog/omlaag om lanshoogte precies op het zwakke punt van het schild te richten!',
    desc: 'Middeleeuws steekspel: raak de gouden doelcirkel op de aanstormende ridder.',
    create(rt): MiniGameInstance {
      let lanceY = 300;
      let targetY = rand(220, 390);
      let chargeX = W + 40;
      let speed = 230;
      let score = 0;
      let lives = 3;
      return {
        update(dt, inp) {
          if (inp.down) lanceY = clamp(inp.y, 180, 440);
          chargeX -= speed * dt;
          if (chargeX <= 125) {
            if (Math.abs(lanceY - targetY) < 42) {
              score += 100;
              rt.setScore(score);
              rt.sfx.win();
              speed = Math.min(500, speed + 28);
            } else {
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Uit het zadel gelicht! Score: ${score}`);
                return;
              }
            }
            chargeX = W + 60;
            targetY = rand(200, 410);
          }
          rt.setStatus(`Toernooi Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#14532d');
          drawRoundedBox(c, 0, 440, W, 200, 0, '#92400e');
          drawBadgeText(c, '🛡️', 90, lanceY, '#fff', 44);
          c.strokeStyle = '#e2e8f0';
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(95, lanceY);
          c.lineTo(155, lanceY);
          c.stroke();

          drawBadgeText(c, '🏇', chargeX, 340, '#fff', 52);
          drawCircle(c, chargeX - 10, targetY, 22, 'rgba(250,204,21,0.35)', '#facc15');
          drawBadgeText(c, '🎯', chargeX - 10, targetY, '#fff', 26);
          drawLives(c, lives);
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
    controlsHint: 'Tik BOVEN, ONDER, LINKS of RECHTS om vliegende werpsterren af te weren!',
    desc: '360-graden ninja-verdediging: tik in de richting van de dichtstbijzijnde shuriken.',
    create(rt): MiniGameInstance {
      type Dir = 0 | 1 | 2 | 3; // U, R, D, L
      const stars: { dir: Dir; dist: number; speed: number }[] = [{ dir: 0, dist: 230, speed: 120 }];
      let spawnT = 0.8;
      let score = 0;
      let lives = 3;
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
          spawnT -= dt;
          if (spawnT <= 0) {
            stars.push({ dir: Math.floor(Math.random() * 4) as Dir, dist: 240, speed: 115 + score * 0.4 });
            spawnT = Math.max(0.36, 1.0 - score * 0.002);
          }
          if (inp.justPressed) {
            const dx = inp.x - cx;
            const dy = inp.y - cy;
            const d: Dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : dy > 0 ? 2 : 0;
            const idx = stars.findIndex((s) => s.dir === d && s.dist < 135);
            if (idx >= 0) {
              stars.splice(idx, 1);
              score += 20;
              rt.setScore(score);
              rt.sfx.score();
            } else rt.sfx.tap();
          }
          for (let i = stars.length - 1; i >= 0; i--) {
            stars[i].dist -= stars[i].speed * dt;
            if (stars[i].dist < 24) {
              stars.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Geraakt! Score: ${score}`);
                return;
              }
            }
          }
          rt.setStatus(`Gepareerd: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#090d16');
          drawCircle(c, cx, cy, 115, 'rgba(99,102,241,0.1)', '#818cf8');
          drawBadgeText(c, '🥷', cx, cy, '#fff', 44);
          for (const s of stars) {
            const p = posOf(s.dir, s.dist);
            drawBadgeText(c, '💠', p.x, p.y, '#fff', 28);
          }
          drawLives(c, lives);
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
    controlsHint: 'Tik ergens om die kant op te dashen en vijanden neer te maaien!',
    desc: '1-knops colosseum dash-gevecht tegen aanstormende krijgers.',
    create(rt): MiniGameInstance {
      let gx = W / 2;
      let gy = 340;
      let tx = gx;
      let ty = gy;
      let dashT = 0;
      let score = 0;
      let lives = 3;
      const foes = Array.from({ length: 4 }, () => ({
        x: rand(30, W - 30),
        y: Math.random() < 0.5 ? 70 : H - 40,
      }));
      return {
        update(dt, inp) {
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
              } else {
                lives--;
                rt.sfx.hit();
                if (lives <= 0) {
                  rt.endGame(score, `Arena score: ${score}`);
                  return;
                }
              }
              f.x = rand(20, W - 20);
              f.y = Math.random() < 0.5 ? 60 : H - 30;
            }
          }
          rt.setStatus(`Overleef · Dash op vijanden!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#78350f', '#451a03');
          drawCircle(c, W / 2, 340, 195, 'rgba(254,240,138,0.08)', '#f59e0b');
          for (const f of foes) drawBadgeText(c, '👹', f.x, f.y, '#fff', 32);
          drawBadgeText(c, dashT > 0 ? '⚔️' : '🛡️', gx, gy, '#fff', 36);
          drawLives(c, lives);
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
    controlsHint: 'Tik LINKS, MIDDEN of RECHTS om je plasmazwaard op tijd voor droids te zwaaien!',
    desc: 'Kaats schoten van 3 laser-droids direct terug naar hun afzender.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      let lives = 3;
      const laneX = (l: number) => 85 + l * 125;
      const bolts: { lane: number; y: number; vy: number }[] = [{ lane: 1, y: 120, vy: 250 }];
      let spawnT = 0.9;
      return {
        update(dt, inp) {
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
            } else if (b.vy < 0 && b.y <= 120) {
              bolts.splice(i, 1);
              score += 30;
              rt.setScore(score);
            } else if (b.y > H) {
              bolts.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Droid lasers doorbroken (${score} pt)!`);
                return;
              }
            }
          }
          rt.setStatus(`Gekaatste schoten: ${score / 30}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#0f172a');
          for (let i = 0; i < 3; i++) drawBadgeText(c, '🛸', laneX(i), 100, '#fff', 36);
          for (const b of bolts) drawRoundedBox(c, laneX(b.lane) - 4, b.y - 14, 8, 28, 4, b.vy > 0 ? '#ef4444' : '#38bdf8');
          drawRoundedBox(c, laneX(lane) - 34, 505, 68, 12, 6, '#38bdf8', '#fff');
          drawBadgeText(c, '🤖', laneX(lane), 548, '#fff', 34);
          drawLives(c, lives);
        },
      };
    },
  },
];
