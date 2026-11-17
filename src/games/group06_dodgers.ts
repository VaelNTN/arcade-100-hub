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

export const GROUP_06_DODGERS: MiniGameDef[] = [
  {
    id: 'laser-hallway-dash',
    num: 51,
    title: 'Laser Hallway Dash',
    icon: '🚨',
    category: 'runners',
    color: '#ef4444',
    controlsHint: 'Houd ingedrukt om naar voren te sluipen — laat los achter dekking voor lasers!',
    desc: 'Sluip door een streng beveiligd museum vol aan- en uitknipperende beveiligingslasers.',
    create(rt): MiniGameInstance {
      let py = 540;
      let t = 0;
      let score = 0;
      const lasers = Array.from({ length: 4 }, (_, i) => ({ y: 120 + i * 105, period: 2.2 - i * 0.15, offset: i * 0.7 }));
      return {
        update(dt, inp) {
          t += dt;
          if (inp.down) py -= 160 * dt;
          for (const l of lasers) {
            const on = Math.sin(((t + l.offset) / l.period) * Math.PI * 2) > 0;
            if (on && Math.abs(py - l.y) < 16) {
              rt.sfx.explode();
              rt.endGame(score, `Alarm afgegaan! Score: ${score}`);
              return;
            }
          }
          if (py < 70) {
            score += 100;
            py = 540;
            rt.setScore(score);
            rt.sfx.win();
          }
          rt.setStatus(`Kluizen leeggeroofd: ${score / 100}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e293b');
          drawBadgeText(c, '💎', W / 2, 65, '#fff', 36);
          for (const l of lasers) {
            const on = Math.sin(((t + l.offset) / l.period) * Math.PI * 2) > 0;
            c.strokeStyle = on ? '#ef4444' : 'rgba(239,68,68,0.2)';
            c.lineWidth = on ? 7 : 2;
            c.beginPath();
            c.moveTo(20, l.y);
            c.lineTo(W - 20, l.y);
            c.stroke();
          }
          drawBadgeText(c, '🥷', W / 2, py, '#fff', 34);
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
    controlsHint: 'Tik om het verkeerslicht op het kruispunt om te zetten en botsingen te voorkomen!',
    desc: 'Regel twee drukke wegen tegelijk: laat auto’s doorstromen zonder één ongeluk.',
    create(rt): MiniGameInstance {
      let nsGreen = true;
      let score = 0;
      const cars: { axis: 'ns' | 'ew'; pos: number; spd: number }[] = [];
      let spawnT = 0.5;
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            nsGreen = !nsGreen;
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            cars.push({ axis: Math.random() < 0.5 ? 'ns' : 'ew', pos: -30, spd: 145 + score * 0.3 });
            spawnT = Math.max(0.45, 1.0 - score * 0.002);
          }
          const stopLine = 240;
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
            }
          }
          const inBoxNS = cars.some((cCar) => cCar.axis === 'ns' && Math.abs(cCar.pos - H / 2) < 30);
          const inBoxEW = cars.some((cCar) => cCar.axis === 'ew' && Math.abs(cCar.pos - W / 2) < 30);
          if (inBoxNS && inBoxEW && stopLine > 0) {
            rt.sfx.explode();
            rt.endGame(score, `Kruispunt botsing bij ${score} pt!`);
            return;
          }
          rt.setStatus(nsGreen ? '↕️ Noord-Zuid GROEN' : '↔️ Oost-West GROEN');
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#14532d', '#064e3b');
          drawRoundedBox(c, W / 2 - 42, 0, 84, H, 0, '#334155');
          drawRoundedBox(c, 0, H / 2 - 42, W, 84, 0, '#334155');
          drawCircle(c, W / 2, H / 2 - 70, 12, nsGreen ? '#22c55e' : '#ef4444');
          drawCircle(c, W / 2 - 70, H / 2, 12, !nsGreen ? '#22c55e' : '#ef4444');
          for (const cCar of cars) {
            const x = cCar.axis === 'ns' ? W / 2 : cCar.pos;
            const y = cCar.axis === 'ns' ? cCar.pos : H / 2;
            drawBadgeText(c, cCar.axis === 'ns' ? '🚗' : '🚕', x, y, '#fff', 28);
          }
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
    controlsHint: 'Sleep naar links en rechts om gloeiende meteoren & schokgolven te ontwijken!',
    desc: 'Overleef een steeds heftigere meteorenregen en pak energieschilden op.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let score = 0;
      let spawnT = 0.3;
      const meteors: { x: number; y: number; r: number; spd: number }[] = [];
      return {
        update(dt, inp) {
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
              rt.endGame(score, `Verpletterd door meteoor (${score} pt)!`);
              return;
            }
            if (m.y > H + 40) meteors.splice(i, 1);
          }
          rt.setStatus(`Overleefd: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1c1917', '#450a0a');
          for (const m of meteors) {
            drawCircle(c, m.x, m.y, m.r, '#ea580c', '#fde047');
          }
          drawBadgeText(c, '🧑‍🚀', px, 545, '#fff', 36);
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
    controlsHint: 'Tik op één van de 3 roltrappen en sprint vooruit langs vallende koffers!',
    desc: 'Ren tegen een versnellende luchthaven-roltrap op vol rollende bagage.',
    create(rt): MiniGameInstance {
      let lane = 1;
      let score = 0;
      const laneX = (l: number) => 85 + l * 125;
      const bags = Array.from({ length: 5 }, (_, i) => ({ lane: i % 3, y: -i * 130, spd: 230 }));
      return {
        update(dt, inp) {
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
              rt.endGame(score, `Gestruikeld over een koffer (${score} pt)!`);
              return;
            }
            if (b.y > H + 30) {
              b.y = -40;
              b.lane = Math.floor(Math.random() * 3);
            }
          }
          rt.setStatus(`Roltrap-sprint: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#0f172a');
          for (let l = 0; l < 3; l++) drawRoundedBox(c, laneX(l) - 38, 0, 76, H, 0, '#334155', '#64748b');
          for (const b of bags) drawBadgeText(c, '🧳', laneX(b.lane), b.y, '#fff', 32);
          drawBadgeText(c, '🏃', laneX(lane), 520, '#fff', 36);
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
    controlsHint: 'Sleep terug op je botsauto om rivalen van het krimpende ijsplatform te rammen!',
    desc: 'Slingshot-arenagevecht op glad ijs: wie als laatste blijft staan wint.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = 380;
      let pvx = 0;
      let pvy = 0;
      let radius = 180;
      let score = 0;
      let bots = [
        { x: W / 2 - 70, y: 260, vx: 30, vy: 20 },
        { x: W / 2 + 70, y: 260, vx: -30, vy: 25 },
      ];
      return {
        update(dt, inp) {
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
              rt.sfx.hit();
            }
            if (Math.hypot(b.x - W / 2, b.y - 330) > radius) {
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
            rt.endGame(score, `Van het ijs gegleden! Score: ${score}`);
            return;
          }
          rt.setStatus(`Sleep & lanceer · Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#090d16');
          drawCircle(c, W / 2, 330, radius, '#bae6fd', '#fff');
          for (const b of bots) drawBadgeText(c, '🚙', b.x, b.y, '#fff', 32);
          drawBadgeText(c, '🚗', px, py, '#fff', 34);
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
    controlsHint: 'Tik op de wissel om het spoor naar LINKS (Rood) of RECHTS (Blauw) te schakelen!',
    desc: 'Leid gekleurde treinen veilig naar het bijpassende perron zonder botsingen.',
    create(rt): MiniGameInstance {
      let switchRight = false;
      let score = 0;
      let lives = 3;
      const trains: { y: number; targetRight: boolean }[] = [{ y: 60, targetRight: false }];
      let spawnT = 1.6;
      return {
        update(dt, inp) {
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
              if (t.targetRight === switchRight) {
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
              } else {
                lives--;
                rt.sfx.hit();
                if (lives <= 0) {
                  rt.endGame(score, `Verkeerd spoor! Score: ${score}`);
                  return;
                }
              }
            }
          }
          rt.setStatus(`Wissel staat op: ${switchRight ? 'RECHTS 🔵' : 'LINKS 🔴'}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#064e3b');
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 8;
          c.beginPath();
          c.moveTo(W / 2, 0);
          c.lineTo(W / 2, 300);
          c.lineTo(110, 460);
          c.moveTo(W / 2, 300);
          c.lineTo(310, 460);
          c.stroke();

          c.strokeStyle = '#facc15';
          c.lineWidth = 10;
          c.beginPath();
          c.moveTo(W / 2, 300);
          c.lineTo(switchRight ? 310 : 110, 460);
          c.stroke();

          drawBadgeText(c, '🔴 Station', 110, 495, '#ef4444', 18);
          drawBadgeText(c, '🔵 Station', 310, 495, '#38bdf8', 18);
          for (const t of trains) {
            const x = t.y < 300 ? W / 2 : W / 2 + ((t.y - 300) / 160) * (switchRight ? 100 : -100);
            drawBadgeText(c, t.targetRight ? '🚆🔵' : '🚂🔴', x, t.y, '#fff', 28);
          }
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
    controlsHint: 'Sleep de skiër snel om dennenbomen heen en blijf voor de lawine uit!',
    desc: 'Slalom naar beneden door poedersneeuw terwijl achter je een lawine dreigt.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let score = 0;
      const trees = Array.from({ length: 7 }, (_, i) => ({ x: rand(35, W - 35), y: 200 + i * 90 }));
      return {
        update(dt, inp) {
          if (inp.down) px = clamp(inp.x, 22, W - 22);
          const spd = 230 + score * 0.5;
          score += Math.round(dt * 18);
          rt.setScore(score);
          for (const tr of trees) {
            tr.y -= spd * dt;
            if (Math.hypot(tr.x - px, tr.y - 220) < 26) {
              rt.sfx.explode();
              rt.endGame(score, `Tegen een dennenboom gebotst (${score} pt)!`);
              return;
            }
            if (tr.y < -30) {
              tr.y = H + rand(20, 120);
              tr.x = rand(30, W - 30);
            }
          }
          rt.setStatus(`Afdaling: ${score}m`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#f8fafc', '#bae6fd');
          drawRoundedBox(c, 0, 0, W, 90, 0, '#e2e8f0');
          drawBadgeText(c, '❄️ LAWINE ❄️', W / 2, 55, '#0369a1', 18);
          drawBadgeText(c, '⛷️', px, 220, '#fff', 34);
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
    controlsHint: 'Sleep terug om een ketting ballen te richten op de genummerde blokken!',
    desc: 'Verslavende blokkenbreker: verzamel extra ballen om rijen van 10+ stenen weg te knallen.',
    create(rt): MiniGameInstance {
      let shootX = W / 2;
      let ballCount = 5;
      let score = 0;
      let aimAng = -Math.PI / 2;
      const activeBalls: { x: number; y: number; vx: number; vy: number }[] = [];
      let queue = 0;
      let queueT = 0;
      const blocks: { x: number; y: number; hp: number }[] = [];
      const addRow = () => {
        for (const b of blocks) b.y += 52;
        if (blocks.some((b) => b.y > 515)) {
          rt.sfx.explode();
          rt.endGame(score, `Blokken bereikten de bodem! Score: ${score}`);
          return;
        }
        const lvl = Math.max(2, Math.floor(score / 40) + 2);
        for (let c = 0; c < 6; c++) {
          if (Math.random() < 0.65) blocks.push({ x: 35 + c * 62, y: 95, hp: rand(lvl, lvl + 4) | 0 });
        }
      };
      addRow();
      return {
        update(dt, inp) {
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
              b.vy *= -1;
              b.y = 60;
            }
            for (let j = blocks.length - 1; j >= 0; j--) {
              const bl = blocks[j];
              if (b.x > bl.x - 6 && b.x < bl.x + 56 && b.y > bl.y - 6 && b.y < bl.y + 42) {
                b.vy *= -1;
                bl.hp--;
                score += 5;
                rt.setScore(score);
                rt.sfx.score();
                if (bl.hp <= 0) {
                  blocks.splice(j, 1);
                  ballCount = Math.min(24, ballCount + 1);
                }
                break;
              }
            }
            if (b.y > 585) {
              shootX = clamp(b.x, 30, W - 30);
              activeBalls.splice(i, 1);
              if (activeBalls.length === 0 && queue === 0) addRow();
            }
          }
          rt.setStatus(`Ballen: ${ballCount} · Mik omhoog!`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#090d16', '#1e293b');
          for (const bl of blocks) {
            drawRoundedBox(c, bl.x, bl.y, 50, 36, 7, '#ec4899', '#fff');
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
          for (const b of activeBalls) drawCircle(c, b.x, b.y, 7, '#fde047');
          drawCircle(c, shootX, 575, 9, '#38bdf8', '#fff');
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
    controlsHint: 'Tik LINKS voor linker flipper, RECHTS voor rechter flipper!',
    desc: 'Flipperkast vol verlichte bumpers, bonus-targets en turbo-stuiters.',
    create(rt): MiniGameInstance {
      let bx = 180;
      let by = 140;
      let vx = 140;
      let vy = 100;
      let leftUp = 0;
      let rightUp = 0;
      let score = 0;
      let balls = 3;
      const bumpers = [
        { x: 130, y: 210, r: 26 },
        { x: 290, y: 210, r: 26 },
        { x: 210, y: 310, r: 24 },
      ];
      return {
        update(dt, inp) {
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
            const dx = bx - bm.x;
            const dy = by - bm.y;
            const d = Math.hypot(dx, dy);
            if (d < bm.r + 12) {
              const nx = dx / Math.max(1, d);
              const ny = dy / Math.max(1, d);
              vx = nx * 360;
              vy = ny * 360;
              score += 50;
              rt.setScore(score);
              rt.sfx.score();
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
              rt.endGame(score, `Pinball eindscore: ${score}`);
              return;
            }
            bx = rand(140, 280);
            by = 120;
            vx = rand(-150, 150);
            vy = 60;
          }
          rt.setStatus(`Ballen over: ${balls}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#31102f', '#090d16');
          for (const bm of bumpers) drawCircle(c, bm.x, bm.y, bm.r, '#ec4899', '#fde047');
          c.strokeStyle = '#38bdf8';
          c.lineWidth = 12;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(85, 540);
          c.lineTo(185, leftUp > 0.2 ? 505 : 560);
          c.moveTo(335, 540);
          c.lineTo(235, rightUp > 0.2 ? 505 : 560);
          c.stroke();
          drawCircle(c, bx, by, 11, '#f8fafc', '#fde047');
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
    controlsHint: 'Sleep vanaf de golfbal en laat los om hem richting de vlag te putten!',
    desc: 'Stuitere langs houten balken en sink de bal in zo min mogelijk slagen.',
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
            if (bx > wall.x - 8 && bx < wall.x + wall.w + 8 && by > wall.y - 8 && by < wall.y + wall.h + 8) {
              vy *= -0.9;
              by = vy > 0 ? wall.y + wall.h + 10 : wall.y - 10;
              rt.sfx.tap();
            }
            if (Math.hypot(bx - hole.x, by - hole.y) < 18 && Math.hypot(vx, vy) < 280) {
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
          drawGradientBg(c, '#15803d', '#14532d');
          drawRoundedBox(c, 20, 60, W - 40, H - 80, 16, '#22c55e', '#bef264');
          drawCircle(c, hole.x, hole.y, 16, '#090d16', '#fde047');
          drawBadgeText(c, '🚩', hole.x + 8, hole.y - 16, '#fff', 22);
          drawRoundedBox(c, wall.x, wall.y, wall.w, wall.h, 6, '#92400e', '#fde68a');
          if (drag) {
            c.strokeStyle = '#fde047';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(bx, by);
            c.lineTo(bx + (bx - aim.x), by + (by - aim.y));
            c.stroke();
          }
          drawCircle(c, bx, by, 10, '#fff', '#cbd5e1');
        },
      };
    },
  },
];
