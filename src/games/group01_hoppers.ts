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

export const GROUP_01_HOPPERS: MiniGameDef[] = [
  {
    id: 'squirrel-acorn-hop',
    num: 1,
    title: 'Squirrel Acorn Hop',
    icon: '🐿️',
    category: 'hoppers',
    color: '#22c55e',
    controlsHint: 'Sleep links/rechts om op takken te springen & vallende eikels te ontwijken',
    desc: 'Eekhoorn springt omhoog van tak naar tak terwijl gouden eikels bonus geven en rotte noten vallen.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = H - 120;
      let vy = -500;
      let score = 0;
      let camY = 0;
      const bursts: Burst[] = [];
      const plats = Array.from({ length: 12 }, (_, i) => ({
        x: rand(35, W - 115),
        y: H - 70 - i * 54,
        w: 84,
        mv: i > 3 && i % 3 === 0 ? rand(-75, 75) : 0,
      }));
      const acorns: { x: number; y: number; bad: boolean }[] = [
        { x: 160, y: 120, bad: true },
        { x: 280, y: -40, bad: false },
      ];
      return {
        update(dt, inp) {
          if (inp.down) px += clamp((inp.x - px) * 10, -340, 340) * dt;
          px = clamp(px, 20, W - 20);
          vy += 980 * dt;
          py += vy * dt;

          if (vy > 0) {
            for (const p of plats) {
              if (px >= p.x - 10 && px <= p.x + p.w + 10 && py >= p.y - 12 && py <= p.y + 10) {
                vy = -560;
                rt.sfx.tap();
                spawnBurst(bursts, px, p.y, '#86efac', 6);
              }
            }
          }
          for (const p of plats) {
            if (p.mv) {
              p.x += p.mv * dt;
              if (p.x < 12 || p.x + p.w > W - 12) p.mv *= -1;
            }
          }
          if (py < H * 0.42) {
            const dy = H * 0.42 - py;
            py = H * 0.42;
            camY += dy;
            score = Math.max(score, Math.floor(camY / 6));
            rt.setScore(score);
            for (const p of plats) {
              p.y += dy;
              if (p.y > H + 20) {
                p.y -= 12 * 54;
                p.x = rand(20, W - 104);
              }
            }
            for (const a of acorns) a.y += dy;
          }
          for (const a of acorns) {
            a.y += (a.bad ? 160 : 95) * dt;
            if (Math.hypot(a.x - px, a.y - py) < 24) {
              if (a.bad) {
                rt.sfx.hit();
                rt.endGame(score, `Geraakt door rotte eikel op ${score} pt!`);
                return;
              } else {
                score += 40;
                rt.setScore(score);
                rt.sfx.score();
                spawnBurst(bursts, a.x, a.y, '#facc15', 10);
                a.y = -30;
                a.x = rand(30, W - 30);
              }
            }
            if (a.y > H + 30) {
              a.y = -rand(20, 120);
              a.x = rand(30, W - 30);
            }
          }
          if (py > H + 35) {
            rt.sfx.hit();
            rt.endGame(score, `Gevallen na ${score} punten!`);
          }
          rt.setStatus(`Hoogte: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#064e3b', '#0f172a');
          for (const p of plats) drawRoundedBox(c, p.x, p.y, p.w, 12, 6, p.mv ? '#fbbf24' : '#84cc16');
          for (const a of acorns) {
            drawBadgeText(c, a.bad ? '💣' : '🌰', a.x, a.y, '#fff', 22);
          }
          drawBadgeText(c, '🐿️', px, py, '#fff', 32);
          updateAndDrawBursts(c, bursts, 0.016);
        },
      };
    },
  },
  {
    id: 'penguin-ice-slide',
    num: 2,
    title: 'Penguin Ice Slide',
    icon: '🐧',
    category: 'hoppers',
    color: '#38bdf8',
    controlsHint: 'Houd ingedrukt om snel te duiken op hellingen & vlieg ver over orka-vakken!',
    desc: 'Glijd over golvende ijsbergen, lanceer hoog door de lucht en land zacht op het volgende ijs.',
    create(rt): MiniGameInstance {
      let dist = 0;
      let py = 260;
      let vy = 0;
      let speed = 220;
      let score = 0;
      const groundAt = (x: number) => 380 + Math.sin(x * 0.011) * 75 + Math.cos(x * 0.023) * 35;
      const bursts: Burst[] = [];
      let orcaX = 520;
      return {
        update(dt, inp) {
          dist += speed * dt;
          if (inp.down) vy += 1350 * dt;
          vy += 580 * dt;
          py += vy * dt;
          const gy = groundAt(dist + 95);
          if (py >= gy) {
            const slope = groundAt(dist + 100) - groundAt(dist + 90);
            if (vy > 320 && slope < -2) {
              speed = Math.min(480, speed + 45);
              rt.sfx.score();
              spawnBurst(bursts, 95, gy, '#bae6fd', 10);
            } else if (vy > 480 && slope > 4) {
              speed = Math.max(150, speed - 55);
              rt.sfx.hit();
            }
            py = gy;
            vy = Math.min(vy, slope * 28);
          } else {
            speed = Math.min(500, speed + 15 * dt);
          }
          orcaX -= speed * dt;
          if (orcaX < -50) orcaX = W + rand(120, 300);
          const orcaY = groundAt(dist + orcaX) - 14;
          if (Math.abs(orcaX - 95) < 28 && Math.abs(py - orcaY) < 28) {
            rt.sfx.explode();
            rt.endGame(score, `Orka hapte toe bij ${score}m!`);
            return;
          }
          score = Math.floor(dist / 12);
          rt.setScore(score);
          rt.setStatus(`Snelheid: ${Math.round(speed)} km/u`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#e0f2fe');
          c.fillStyle = '#f0f9ff';
          c.beginPath();
          c.moveTo(0, H);
          for (let x = 0; x <= W; x += 8) c.lineTo(x, groundAt(dist + x));
          c.lineTo(W, H);
          c.closePath();
          c.fill();
          c.strokeStyle = '#38bdf8';
          c.lineWidth = 4;
          c.beginPath();
          for (let x = 0; x <= W; x += 8) {
            if (x === 0) c.moveTo(0, groundAt(dist));
            else c.lineTo(x, groundAt(dist + x));
          }
          c.stroke();
          const oy = groundAt(dist + orcaX) - 10;
          drawBadgeText(c, '🐋', orcaX, oy, '#fff', 36);
          drawBadgeText(c, '🐧', 95, py - 12, '#fff', 32);
          updateAndDrawBursts(c, bursts, 0.016);
        },
      };
    },
  },
  {
    id: 'monkey-vine-swing',
    num: 3,
    title: 'Monkey Vine Swing',
    icon: '🐒',
    category: 'hoppers',
    color: '#16a34a',
    controlsHint: 'Houd ingedrukt om vast te grijpen aan een liaan, laat los om te vliegen!',
    desc: 'Zwaai als een oerwoudkoning van liaan naar liaan boven de krokodillenrivier.',
    create(rt): MiniGameInstance {
      let camX = 0;
      let mx = 80;
      let my = 220;
      let vx = 170;
      let vy = -120;
      let grabbed: { x: number; y: number; len: number } | null = null;
      let score = 0;
      const anchors = Array.from({ length: 8 }, (_, i) => ({ x: 110 + i * 165, y: 70 + (i % 3) * 28 }));
      const bursts: Burst[] = [];
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            let best = anchors[0];
            let bestD = Infinity;
            for (const a of anchors) {
              const d = Math.hypot(a.x - mx, a.y - my);
              if (d < bestD && a.x >= mx - 60) {
                bestD = d;
                best = a;
              }
            }
            if (bestD < 250) {
              grabbed = { x: best.x, y: best.y, len: Math.max(85, bestD) };
              rt.sfx.tap();
            }
          }
          if (!inp.down || inp.justReleased) grabbed = null;

          if (grabbed) {
            vy += 760 * dt;
            mx += vx * dt;
            my += vy * dt;
            const dx = mx - grabbed.x;
            const dy = my - grabbed.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            const nx = dx / dist;
            const ny = dy / dist;
            mx = grabbed.x + nx * grabbed.len;
            my = grabbed.y + ny * grabbed.len;
            const dot = vx * nx + vy * ny;
            if (dot > 0) {
              vx -= dot * nx;
              vy -= dot * ny;
            }
            vx += 48 * dt;
          } else {
            vy += 760 * dt;
            mx += vx * dt;
            my += vy * dt;
          }

          if (mx - camX > 150) camX = mx - 150;
          score = Math.max(score, Math.floor(mx / 18));
          rt.setScore(score);
          for (const a of anchors) {
            if (a.x < camX - 90) {
              a.x += 8 * 165;
              a.y = 65 + Math.random() * 65;
              spawnBurst(bursts, mx - camX, my, '#facc15', 5);
              rt.sfx.score();
            }
          }
          if (my > H - 20 || my < -80) {
            rt.sfx.explode();
            rt.endGame(score, `In het moeras beland na ${score}m!`);
          }
          rt.setStatus(grabbed ? 'Aan liaan! Laat los op hoogte' : 'Tik & houd vast voor liaan');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#022c22');
          drawRoundedBox(c, 0, H - 36, W, 36, 0, '#0369a1');
          for (const a of anchors) {
            const sx = a.x - camX;
            drawCircle(c, sx, a.y, 9, '#a3e635');
            if (grabbed && grabbed.x === a.x) {
              c.strokeStyle = '#84cc16';
              c.lineWidth = 4;
              c.beginPath();
              c.moveTo(sx, a.y);
              c.lineTo(mx - camX, my);
              c.stroke();
            }
          }
          drawBadgeText(c, '🐒', mx - camX, my, '#fff', 32);
          updateAndDrawBursts(c, bursts, 0.016);
        },
      };
    },
  },
  {
    id: 'goat-mountain-dash',
    num: 4,
    title: 'Goat Mountain Dash',
    icon: '🐐',
    category: 'hoppers',
    color: '#a3a3a3',
    controlsHint: 'Tik LINKS of RECHTS om van bergkam naar bergkam te springen',
    desc: 'Beklim een steile bergwand in twee banen en ontwijk vallende rotsblokken.',
    create(rt): MiniGameInstance {
      let lane: 0 | 1 = 0;
      let climb = 0;
      let speed = 230;
      const rocks = Array.from({ length: 5 }, (_, i) => ({
        lane: (i % 2) as 0 | 1,
        y: -i * 150 - 80,
        isCoin: i % 3 === 1,
      }));
      const laneX = (l: 0 | 1) => (l === 0 ? 125 : 295);
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            lane = inp.x < W / 2 ? 0 : 1;
            rt.sfx.tap();
          }
          speed = Math.min(480, speed + 10 * dt);
          climb += speed * dt;
          const score = Math.floor(climb / 14);
          rt.setScore(score);
          rt.setStatus(`Hoogte: ${score}m`);
          for (const rk of rocks) {
            rk.y += speed * dt;
            if (rk.lane === lane && Math.abs(rk.y - 500) < 34) {
              if (rk.isCoin) {
                climb += 350;
                rk.y = -120;
                rt.sfx.score();
              } else {
                rt.sfx.explode();
                rt.endGame(score, `Geraakt door bergrots op ${score}m!`);
                return;
              }
            }
            if (rk.y > H + 40) {
              rk.y = -rand(60, 180);
              rk.lane = Math.random() < 0.5 ? 0 : 1;
              rk.isCoin = Math.random() < 0.28;
            }
          }
        },
        onKey(k) {
          if (k === 'ArrowLeft') lane = 0;
          if (k === 'ArrowRight') lane = 1;
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#334155', '#1e293b');
          drawRoundedBox(c, 85, 0, 80, H, 0, '#475569');
          drawRoundedBox(c, 255, 0, 80, H, 0, '#475569');
          for (const rk of rocks) {
            drawBadgeText(c, rk.isCoin ? '⭐' : '🪨', laneX(rk.lane), rk.y, '#fff', 32);
          }
          drawBadgeText(c, '🐐', laneX(lane), 500, '#fff', 36);
        },
      };
    },
  },
  {
    id: 'crab-beach-scuttle',
    num: 5,
    title: 'Crab Beach Scuttle',
    icon: '🦀',
    category: 'hoppers',
    color: '#fb923c',
    controlsHint: 'Sleep horizontaal over het zand om parels te vangen & meeuwen te ontwijken',
    desc: 'Ren zijwaarts over het tropische strand, verzamel glimmende parels en ontwijk aanvallende meeuwen.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let score = 0;
      let lives = 3;
      const items = Array.from({ length: 7 }, (_, i) => ({
        x: rand(30, W - 30),
        y: -i * 95,
        vy: rand(170, 260),
        bad: i % 2 === 0,
      }));
      return {
        update(dt, inp) {
          if (inp.down) px = clamp(inp.x, 26, W - 26);
          for (const it of items) {
            it.y += (it.vy + score * 0.5) * dt;
            if (Math.hypot(it.x - px, it.y - 555) < 30) {
              if (it.bad) {
                lives--;
                rt.sfx.hit();
                it.y = -50;
                it.x = rand(30, W - 30);
                if (lives <= 0) {
                  rt.endGame(score, `${score} parelpunten verzameld!`);
                  return;
                }
              } else {
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                it.y = -40;
                it.x = rand(30, W - 30);
              }
            }
            if (it.y > H + 30) {
              it.y = -30;
              it.x = rand(30, W - 30);
            }
          }
          rt.setStatus(`Levens: ${lives} · Parels: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0ea5e9', '#fde68a');
          drawRoundedBox(c, 0, 490, W, 150, 0, '#fcd34d');
          for (const it of items) drawBadgeText(c, it.bad ? '🕊️' : '🦪', it.x, it.y, '#fff', 30);
          drawBadgeText(c, '🦀', px, 555, '#fff', 38);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'chameleon-tongue-catch',
    num: 6,
    title: 'Chameleon Tongue',
    icon: '🦎',
    category: 'hoppers',
    color: '#84cc16',
    controlsHint: 'Tik rechtstreeks op vliegen & kevers om je tong af te vuren! Vermijd wespen.',
    desc: 'Supersnelle tong-reflex: tik zo veel mogelijk insecten binnen de tijdslimiet.',
    create(rt): MiniGameInstance {
      let score = 0;
      let timer = 35;
      let tongueTo: { x: number; y: number; life: number } | null = null;
      const bugs = Array.from({ length: 8 }, (_, i) => ({
        x: rand(40, W - 40),
        y: rand(90, 430),
        vx: rand(-110, 110),
        vy: rand(-70, 70),
        wasp: i < 2,
      }));
      return {
        update(dt, inp) {
          timer -= dt;
          if (timer <= 0) {
            rt.sfx.win();
            rt.endGame(score, `Eindscore: ${score} punten in 35s!`);
            return;
          }
          if (tongueTo) {
            tongueTo.life -= dt;
            if (tongueTo.life <= 0) tongueTo = null;
          }
          for (const b of bugs) {
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 30 || b.x > W - 30) b.vx *= -1;
            if (b.y < 80 || b.y > 440) b.vy *= -1;
          }
          if (inp.justPressed) {
            tongueTo = { x: inp.x, y: inp.y, life: 0.14 };
            let hitAny = false;
            for (const b of bugs) {
              if (Math.hypot(b.x - inp.x, b.y - inp.y) < 36) {
                hitAny = true;
                if (b.wasp) {
                  score = Math.max(0, score - 40);
                  rt.sfx.hit();
                } else {
                  score += 30;
                  rt.sfx.score();
                }
                b.x = rand(40, W - 40);
                b.y = rand(90, 420);
              }
            }
            if (!hitAny) rt.sfx.tap();
            rt.setScore(score);
          }
          rt.setStatus(`Tijd: ${Math.ceil(timer)}s · Niet op 🐝 tikken!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e3a1e', '#0f172a');
          if (tongueTo) {
            c.strokeStyle = '#f472b6';
            c.lineWidth = 7;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(W / 2, 560);
            c.lineTo(tongueTo.x, tongueTo.y);
            c.stroke();
          }
          for (const b of bugs) drawBadgeText(c, b.wasp ? '🐝' : '🪰', b.x, b.y, '#fff', 30);
          drawBadgeText(c, '🦎', W / 2, 565, '#fff', 44);
        },
      };
    },
  },
  {
    id: 'hamster-wheel-turbo',
    num: 7,
    title: 'Hamster Wheel Turbo',
    icon: '🐹',
    category: 'hoppers',
    color: '#f59e0b',
    controlsHint: 'Tik telkens als de wijzer in het GROENE vak komt voor turbo-energie!',
    desc: 'Ritme-hardlopen in een rad: perfecte taps bouwen megasnelheid op zonder te vallen.',
    create(rt): MiniGameInstance {
      let ang = 0;
      let speed = 2.4;
      let score = 0;
      let lives = 3;
      let target = 1.2;
      return {
        update(dt, inp) {
          ang = (ang + speed * dt) % (Math.PI * 2);
          if (inp.justPressed) {
            const diff = Math.abs(Math.atan2(Math.sin(ang - target), Math.cos(ang - target)));
            if (diff < 0.48) {
              const perfect = diff < 0.2;
              score += perfect ? 50 : 25;
              speed = Math.min(6.4, speed + 0.28);
              target = rand(0, Math.PI * 2);
              rt.setScore(score);
              rt.sfx.score();
            } else {
              lives--;
              speed = Math.max(2.0, speed - 0.8);
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Uit het rad geslingerd bij ${score}W!`);
                return;
              }
            }
          }
          rt.setStatus(`Energie: ${score} Watt`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#451a03', '#0f172a');
          const cx = W / 2;
          const cy = 320;
          const rad = 140;
          c.strokeStyle = '#334155';
          c.lineWidth = 24;
          c.beginPath();
          c.arc(cx, cy, rad, 0, Math.PI * 2);
          c.stroke();

          c.strokeStyle = '#22c55e';
          c.lineWidth = 24;
          c.beginPath();
          c.arc(cx, cy, rad, target - 0.45, target + 0.45);
          c.stroke();

          const px = cx + Math.cos(ang) * rad;
          const py = cy + Math.sin(ang) * rad;
          drawCircle(c, px, py, 14, '#fde047', '#fff');
          drawBadgeText(c, '🐹', cx, cy, '#fff', 56);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'owl-night-glide',
    num: 8,
    title: 'Owl Night Glide',
    icon: '🦉',
    category: 'hoppers',
    color: '#6366f1',
    controlsHint: 'Houd ingedrukt om op nachtelijke thermiek te stijgen, laat los om te zweven',
    desc: 'Zweef stil door het donkere bos tussen holle boomstammen en vang gloeiwormen.',
    create(rt): MiniGameInstance {
      let py = 300;
      let vy = 0;
      let score = 0;
      const gates = Array.from({ length: 3 }, (_, i) => ({
        x: W + i * 210,
        gapY: rand(150, 470),
        passed: false,
      }));
      return {
        update(dt, inp) {
          vy += (inp.down ? -780 : 620) * dt;
          vy = clamp(vy, -360, 420);
          py += vy * dt;
          for (const g of gates) {
            g.x -= (170 + score * 2) * dt;
            if (!g.passed && g.x < 95) {
              g.passed = true;
              score += 10;
              rt.setScore(score);
              rt.sfx.score();
            }
            if (Math.abs(g.x - 95) < 34 && (py < g.gapY - 72 || py > g.gapY + 72)) {
              rt.sfx.hit();
              rt.endGame(score, `Tegen een boom gevlogen (${score} pt)!`);
              return;
            }
            if (g.x < -50) {
              g.x += 630;
              g.gapY = rand(140, 480);
              g.passed = false;
            }
          }
          if (py < 15 || py > H - 15) {
            rt.sfx.hit();
            rt.endGame(score, `Uit koers geraakt (${score} pt)!`);
          }
          rt.setStatus(`Vliegscore: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#1e1b4b');
          drawCircle(c, 330, 100, 32, '#fef08a');
          for (const g of gates) {
            drawRoundedBox(c, g.x - 24, 0, 48, g.gapY - 74, 8, '#3f2e21');
            drawRoundedBox(c, g.x - 24, g.gapY + 74, 48, H - g.gapY, 8, '#3f2e21');
          }
          drawBadgeText(c, '🦉', 95, py, '#fff', 34);
        },
      };
    },
  },
  {
    id: 'kangaroo-outback-vault',
    num: 9,
    title: 'Kangaroo Outback Vault',
    icon: '🦘',
    category: 'hoppers',
    color: '#d97706',
    controlsHint: 'Houd ingedrukt op de grond om sprongkracht op te laden & laat los over ravijnen',
    desc: 'Laad reuzensprongen op in de Australische outback en land precies op de rode rotsplateaus.',
    create(rt): MiniGameInstance {
      let charge = 0;
      let jumping = false;
      let kx = 85;
      let ky = 430;
      let vy = 0;
      let score = 0;
      const pads = [
        { x: 40, w: 120 },
        { x: 240, w: 100 },
        { x: 430, w: 95 },
        { x: 610, w: 90 },
      ];
      return {
        update(dt, inp) {
          if (!jumping) {
            if (inp.down) charge = clamp(charge + dt * 1.4, 0, 1);
            if (inp.justReleased && charge > 0.08) {
              jumping = true;
              vy = -440 - charge * 360;
              rt.sfx.tap();
            }
          } else {
            const hSpeed = 190 + charge * 260;
            for (const p of pads) p.x -= hSpeed * dt;
            vy += 1050 * dt;
            ky += vy * dt;
            if (ky >= 430 && vy > 0) {
              const onPad = pads.find((p) => kx >= p.x - 10 && kx <= p.x + p.w + 10);
              if (onPad) {
                ky = 430;
                jumping = false;
                charge = 0;
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
              } else if (ky > H + 30) {
                rt.sfx.explode();
                rt.endGame(score, `In het outback-ravijn gevallen (${score} pt)!`);
                return;
              }
            }
          }
          if (pads[0].x + pads[0].w < -20) {
            pads.shift();
            const last = pads[pads.length - 1];
            pads.push({ x: last.x + rand(155, 250), w: rand(75, 115) });
          }
          rt.setStatus(jumping ? 'Zweven!' : 'Houd vast & laat los');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#ea580c', '#451a03');
          for (const p of pads) drawRoundedBox(c, p.x, 430, p.w, 210, 8, '#b45309', '#fde68a');
          drawBadgeText(c, '🦘', kx, ky - 18, '#fff', 36);
          if (charge > 0 && !jumping) {
            drawRoundedBox(c, 50, 560, 320 * charge, 18, 9, '#facc15', '#fff');
          }
        },
      };
    },
  },
  {
    id: 'duck-pond-surf',
    num: 10,
    title: 'Duck Pond Surf',
    icon: '🦆',
    category: 'hoppers',
    color: '#06b6d4',
    controlsHint: 'Tik omhoog / omlaag over de 3 waterstromen en pak broodkruimels!',
    desc: 'Surf op snelle bootgolven, verzamel verloren eendjes en ontwijk drijvende boomstammen.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      let lives = 3;
      const laneY = (l: number) => 220 + l * 115;
      const obs = Array.from({ length: 6 }, (_, i) => ({
        x: W + i * 140,
        lane: i % 3,
        good: i % 2 === 0,
      }));
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            lane = clamp(Math.floor((inp.y - 160) / 115), 0, 2);
            rt.sfx.tap();
          }
          for (const o of obs) {
            o.x -= (210 + score * 0.6) * dt;
            if (o.lane === lane && Math.abs(o.x - 90) < 30) {
              if (o.good) {
                score += 20;
                rt.setScore(score);
                rt.sfx.score();
              } else {
                lives--;
                rt.sfx.hit();
                if (lives <= 0) {
                  rt.endGame(score, `${score} punten op de golven!`);
                  return;
                }
              }
              o.x = W + rand(90, 240);
              o.lane = Math.floor(Math.random() * 3);
            }
            if (o.x < -40) {
              o.x = W + rand(60, 180);
              o.lane = Math.floor(Math.random() * 3);
            }
          }
          rt.setStatus(`Golfscore: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0284c7', '#0c4a6e');
          for (let l = 0; l < 3; l++) {
            c.strokeStyle = 'rgba(255,255,255,0.22)';
            c.beginPath();
            c.moveTo(0, laneY(l) + 20);
            c.lineTo(W, laneY(l) + 20);
            c.stroke();
          }
          for (const o of obs) {
            drawBadgeText(c, o.good ? '🍞' : '🪵', o.x, laneY(o.lane), '#fff', 30);
          }
          drawBadgeText(c, '🦆', 90, laneY(lane), '#fff', 36);
          drawLives(c, lives);
        },
      };
    },
  },
];
