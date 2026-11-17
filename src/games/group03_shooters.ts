import { H, MiniGameDef, MiniGameInstance, W } from '../types';
import {
  Burst,
  clamp,
  drawBadgeText,
  drawCircle,
  drawGradientBg,
  drawGridLines,
  drawLives,
  drawRoundedBox,
  rand,
  spawnBurst,
  updateAndDrawBursts,
} from '../game/engineHelpers';

export const GROUP_03_SHOOTERS: MiniGameDef[] = [
  {
    id: 'tank-ricochet',
    num: 21,
    title: 'Tank Ricochet',
    icon: '🪖',
    category: 'shooters',
    color: '#22c55e',
    controlsHint: 'Aim and release to fire ricocheting tank shells!',
    desc: 'Shells bounce off walls! Destroy enemy tanks with bank shots.',
    create(rt): MiniGameInstance {
      let aim = { x: W / 2, y: 200 };
      const shells: { x: number; y: number; vx: number; vy: number; b: number }[] = [];
      let enemies = Array.from({ length: 3 }, (_, i) => ({ x: 90 + i * 115, y: 120 + (i % 2) * 70, vx: (i % 2 ? 1 : -1) * 55 }));
      let score = 0;
      let ammo = 10;
      const bursts: Burst[] = [];
      return {
        update(dt, inp) {
          if (inp.down) aim = { x: inp.x, y: inp.y };
          if (inp.justReleased && ammo > 0) {
            const ang = Math.atan2(inp.y - 540, inp.x - W / 2);
            shells.push({ x: W / 2, y: 530, vx: Math.cos(ang) * 390, vy: Math.sin(ang) * 390, b: 3 });
            ammo--;
            rt.sfx.tap();
          }
          for (const e of enemies) {
            e.x += e.vx * dt;
            if (e.x < 40 || e.x > W - 40) e.vx *= -1;
          }
          for (let i = shells.length - 1; i >= 0; i--) {
            const s = shells[i];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (s.x < 24 || s.x > W - 24) {
              s.vx *= -1;
              s.x = clamp(s.x, 24, W - 24);
              s.b--;
              rt.sfx.tap();
            }
            if (s.y < 70 || s.y > H - 20) {
              s.vy *= -1;
              s.y = clamp(s.y, 70, H - 20);
              s.b--;
              rt.sfx.tap();
            }
            for (let j = enemies.length - 1; j >= 0; j--) {
              const e = enemies[j];
              if (Math.hypot(s.x - e.x, s.y - e.y) < 28) {
                spawnBurst(bursts, e.x, e.y, '#facc15', 14);
                score += (4 - s.b) * 50;
                ammo += 2;
                rt.setScore(score);
                rt.sfx.explode();
                enemies[j] = { x: rand(50, W - 50), y: rand(95, 320), vx: rand(-85, 85) };
                s.b = -1;
                break;
              }
            }
            if (s.b < 0) shells.splice(i, 1);
          }
          if (ammo <= 0 && shells.length === 0) {
            rt.endGame(score, `Out of ammo! Final score: ${score}`);
            return;
          }
          rt.setStatus(`Shells left: ${ammo}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#0f172a');
          drawGridLines(c);
          drawRoundedBox(c, 16, 64, W - 32, H - 80, 12, 'rgba(0,0,0,0)', '#475569');
          c.strokeStyle = 'rgba(250,204,21,0.4)';
          c.setLineDash([5, 5]);
          c.beginPath();
          c.moveTo(W / 2, 540);
          c.lineTo(aim.x, aim.y);
          c.stroke();
          c.setLineDash([]);
          for (const e of enemies) drawBadgeText(c, '🚜', e.x, e.y, '#fff', 32);
          for (const s of shells) drawCircle(c, s.x, s.y, 6, '#fde047', '#fff');
          drawBadgeText(c, '🛡️', W / 2, 540, '#fff', 36);
          updateAndDrawBursts(c, bursts, 0.016);
        },
      };
    },
  },
  {
    id: 'retro-space-invaders',
    num: 22,
    title: 'Retro Space Invaders+',
    icon: '👾',
    category: 'shooters',
    color: '#38bdf8',
    controlsHint: 'Drag ship left/right — auto-fire lasers at incoming aliens!',
    desc: 'Classic alien waves descending faster every level.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let fireT = 0;
      let wave = 1;
      let score = 0;
      let dir = 1;
      const bullets: { x: number; y: number }[] = [];
      const eBullets: { x: number; y: number }[] = [];
      let aliens: { x: number; y: number }[] = [];
      const spawnWave = () => {
        aliens = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 6; c++) {
            aliens.push({ x: 55 + c * 58, y: 100 + r * 44 });
          }
        }
      };
      spawnWave();
      return {
        update(dt, inp) {
          if (inp.down) px = clamp(inp.x, 26, W - 26);
          fireT -= dt;
          if (fireT <= 0) {
            bullets.push({ x: px, y: 545 });
            fireT = 0.24;
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].y -= 470 * dt;
            if (bullets[i].y < 40) {
              bullets.splice(i, 1);
              continue;
            }
            for (let j = aliens.length - 1; j >= 0; j--) {
              if (Math.hypot(bullets[i].x - aliens[j].x, bullets[i].y - aliens[j].y) < 22) {
                aliens.splice(j, 1);
                bullets.splice(i, 1);
                score += 20;
                rt.setScore(score);
                rt.sfx.score();
                break;
              }
            }
          }
          let edge = false;
          const spd = (36 + wave * 12) * dir;
          for (const a of aliens) {
            a.x += spd * dt;
            if (a.x < 28 || a.x > W - 28) edge = true;
            if (Math.random() < 0.003 * wave) eBullets.push({ x: a.x, y: a.y + 12 });
            if (a.y > 530) {
              rt.sfx.explode();
              rt.endGame(score, `Aliens landed on wave ${wave}!`);
              return;
            }
          }
          if (edge) {
            dir *= -1;
            for (const a of aliens) a.y += 22;
          }
          for (let i = eBullets.length - 1; i >= 0; i--) {
            eBullets[i].y += 250 * dt;
            if (Math.hypot(eBullets[i].x - px, eBullets[i].y - 565) < 22) {
              rt.sfx.explode();
              rt.endGame(score, `Shot down on wave ${wave}!`);
              return;
            }
            if (eBullets[i].y > H) eBullets.splice(i, 1);
          }
          if (aliens.length === 0) {
            wave++;
            score += 100;
            rt.setScore(score);
            rt.sfx.win();
            spawnWave();
          }
          rt.setStatus(`Wave ${wave} · Aliens: ${aliens.length}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#090d16');
          for (const a of aliens) drawBadgeText(c, '👾', a.x, a.y, '#fff', 26);
          for (const b of bullets) drawRoundedBox(c, b.x - 2, b.y - 10, 4, 16, 2, '#38bdf8');
          for (const eb of eBullets) drawRoundedBox(c, eb.x - 3, eb.y - 8, 6, 14, 3, '#ef4444');
          drawBadgeText(c, '🚀', px, 565, '#fff', 34);
        },
      };
    },
  },
  {
    id: 'bullet-hell-dodge',
    num: 23,
    title: 'Bullet Hell Dodge',
    icon: '🎆',
    category: 'shooters',
    color: '#c084fc',
    controlsHint: 'Drag your neon core and survive spinning bullet spirals!',
    desc: 'Pure bullet-hell dodging: grab stars amid hypnotic bullet patterns.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = 490;
      let ang = 0;
      let spawnT = 0;
      let score = 0;
      let star = { x: 100, y: 300 };
      const shots: { x: number; y: number; vx: number; vy: number }[] = [];
      return {
        update(dt, inp) {
          if (inp.down) {
            px = clamp(inp.x, 18, W - 18);
            py = clamp(inp.y, 85, H - 18);
          }
          score += Math.round(dt * 20);
          rt.setScore(score);
          ang += dt * 2.8;
          spawnT -= dt;
          if (spawnT <= 0) {
            for (let k = 0; k < 4; k++) {
              const a = ang + (k * Math.PI) / 2;
              shots.push({ x: W / 2, y: 120, vx: Math.cos(a) * 145, vy: Math.sin(a) * 145 });
            }
            spawnT = 0.24;
          }
          if (Math.hypot(px - star.x, py - star.y) < 26) {
            score += 80;
            rt.setScore(score);
            rt.sfx.score();
            star = { x: rand(40, W - 40), y: rand(180, 560) };
          }
          for (let i = shots.length - 1; i >= 0; i--) {
            const s = shots[i];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            if (Math.hypot(s.x - px, s.y - py) < 13) {
              rt.sfx.explode();
              rt.endGame(score, `Hit in the bullet storm! (${score} pt)`);
              return;
            }
            if (s.x < -20 || s.x > W + 20 || s.y < -20 || s.y > H + 20) shots.splice(i, 1);
          }
          rt.setStatus(`Score: ${score} · Grab ⭐ for +80`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e1b4b', '#020617');
          drawBadgeText(c, '🧿', W / 2, 120, '#fff', 40);
          drawBadgeText(c, '⭐', star.x, star.y, '#fff', 26);
          for (const s of shots) drawCircle(c, s.x, s.y, 6, '#f472b6', '#fff');
          drawCircle(c, px, py, 10, '#22d3ee', '#fff');
        },
      };
    },
  },
  {
    id: 'sky-ace-1945',
    num: 24,
    title: 'Sky Ace 1945',
    icon: '✈️',
    category: 'shooters',
    color: '#60a5fa',
    controlsHint: 'Drag your fighter jet & blast enemy squadrons out of the sky!',
    desc: 'Vertical arcade dogfights with twin cannons and enemy bombers.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = 540;
      let fireT = 0;
      let spawnT = 0;
      let score = 0;
      let lives = 3;
      const bullets: { x: number; y: number }[] = [];
      const planes: { x: number; y: number; hp: number; vy: number }[] = [];
      return {
        update(dt, inp) {
          if (inp.down) {
            px = clamp(inp.x, 28, W - 28);
            py = clamp(inp.y, 160, H - 30);
          }
          fireT -= dt;
          if (fireT <= 0) {
            bullets.push({ x: px - 10, y: py - 18 }, { x: px + 10, y: py - 18 });
            fireT = 0.18;
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            planes.push({ x: rand(35, W - 35), y: -30, hp: 2, vy: rand(120, 210) });
            spawnT = Math.max(0.4, 0.95 - score * 0.001);
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].y -= 520 * dt;
            if (bullets[i].y < -20) {
              bullets.splice(i, 1);
              continue;
            }
            for (let j = planes.length - 1; j >= 0; j--) {
              if (Math.hypot(bullets[i].x - planes[j].x, bullets[i].y - planes[j].y) < 22) {
                bullets.splice(i, 1);
                planes[j].hp--;
                if (planes[j].hp <= 0) {
                  planes.splice(j, 1);
                  score += 30;
                  rt.setScore(score);
                  rt.sfx.score();
                }
                break;
              }
            }
          }
          for (let i = planes.length - 1; i >= 0; i--) {
            const p = planes[i];
            p.y += p.vy * dt;
            if (Math.hypot(p.x - px, p.y - py) < 28) {
              planes.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Dogfight over: ${score} pt!`);
                return;
              }
            } else if (p.y > H + 30) planes.splice(i, 1);
          }
          rt.setStatus(`Aerial kills: ${Math.floor(score / 30)}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#0c4a6e');
          for (const b of bullets) drawRoundedBox(c, b.x - 2, b.y - 8, 4, 14, 2, '#facc15');
          for (const p of planes) drawBadgeText(c, '🛩️', p.x, p.y, '#fff', 32);
          drawBadgeText(c, '✈️', px, py, '#fff', 38);
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'asteroid-drift',
    num: 25,
    title: 'Asteroid Drift',
    icon: '☄️',
    category: 'shooters',
    color: '#94a3b8',
    controlsHint: 'Hold left/right to steer your ship — auto-thrust & fire!',
    desc: '360° asteroid belt flight. Split boulders and avoid impacts.',
    create(rt): MiniGameInstance {
      let px = W / 2;
      let py = H / 2;
      let ang = -Math.PI / 2;
      let fireT = 0;
      let score = 0;
      let lives = 3;
      const bullets: { x: number; y: number; vx: number; vy: number }[] = [];
      const rocks = Array.from({ length: 6 }, () => ({
        x: rand(20, W - 20),
        y: Math.random() < 0.5 ? 60 : H - 60,
        vx: rand(-90, 90),
        vy: rand(-90, 90),
        r: 22,
      }));
      return {
        update(dt, inp) {
          if (inp.down) {
            ang += (inp.x < W / 2 ? -3.4 : 3.4) * dt;
          }
          px = (px + Math.cos(ang) * 115 * dt + W) % W;
          py = (py + Math.sin(ang) * 115 * dt + H) % H;
          fireT -= dt;
          if (fireT <= 0) {
            bullets.push({ x: px, y: py, vx: Math.cos(ang) * 380, vy: Math.sin(ang) * 380 });
            fireT = 0.25;
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
              bullets.splice(i, 1);
              continue;
            }
            for (let j = rocks.length - 1; j >= 0; j--) {
              const rk = rocks[j];
              if (Math.hypot(b.x - rk.x, b.y - rk.y) < rk.r + 6) {
                bullets.splice(i, 1);
                score += 25;
                rt.setScore(score);
                rt.sfx.score();
                if (rk.r > 16) {
                  rk.r = 12;
                  rocks.push({ x: rk.x, y: rk.y, vx: -rk.vx * 1.3, vy: -rk.vy * 1.3, r: 12 });
                } else {
                  rocks[j] = { x: rand(20, W - 20), y: 20, vx: rand(-100, 100), vy: rand(40, 110), r: 22 };
                }
                break;
              }
            }
          }
          for (const rk of rocks) {
            rk.x = (rk.x + rk.vx * dt + W) % W;
            rk.y = (rk.y + rk.vy * dt + H) % H;
            if (Math.hypot(rk.x - px, rk.y - py) < rk.r + 12) {
              lives--;
              rt.sfx.hit();
              rk.y = 30;
              if (lives <= 0) {
                rt.endGame(score, `Asteroid impact at ${score} pt!`);
                return;
              }
            }
          }
          rt.setStatus(`Steer: hold left/right`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#020617', '#0f172a');
          for (const rk of rocks) drawCircle(c, rk.x, rk.y, rk.r, '#64748b', '#94a3b8');
          for (const b of bullets) drawCircle(c, b.x, b.y, 4, '#facc15');
          c.save();
          c.translate(px, py);
          c.rotate(ang + Math.PI / 2);
          drawBadgeText(c, '🚀', 0, 0, '#fff', 32);
          c.restore();
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'turret-bunker-defense',
    num: 26,
    title: 'Turret Bunker Defense',
    icon: '🛰️',
    category: 'shooters',
    color: '#ef4444',
    controlsHint: 'Tap anywhere in the sky to fire your bunker turret!',
    desc: 'Defend your ground bunker from dropping paratroopers.',
    create(rt): MiniGameInstance {
      let barrelAng = -Math.PI / 2;
      let score = 0;
      let lives = 3;
      const bullets: { x: number; y: number; vx: number; vy: number }[] = [];
      const drops: { x: number; y: number; vy: number }[] = [];
      let spawnT = 0.6;
      return {
        update(dt, inp) {
          if (inp.justPressed) {
            barrelAng = Math.atan2(inp.y - 570, inp.x - W / 2);
            bullets.push({ x: W / 2, y: 565, vx: Math.cos(barrelAng) * 520, vy: Math.sin(barrelAng) * 520 });
            rt.sfx.tap();
          }
          spawnT -= dt;
          if (spawnT <= 0) {
            drops.push({ x: rand(35, W - 35), y: -20, vy: rand(85, 145) + score * 0.25 });
            spawnT = Math.max(0.35, 1.0 - score * 0.002);
          }
          for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            if (b.x < 0 || b.x > W || b.y < 0) {
              bullets.splice(i, 1);
              continue;
            }
            for (let j = drops.length - 1; j >= 0; j--) {
              if (Math.hypot(b.x - drops[j].x, b.y - drops[j].y) < 25) {
                bullets.splice(i, 1);
                drops.splice(j, 1);
                score += 20;
                rt.setScore(score);
                rt.sfx.score();
                break;
              }
            }
          }
          for (let i = drops.length - 1; i >= 0; i--) {
            drops[i].y += drops[i].vy * dt;
            if (drops[i].y > 575) {
              drops.splice(i, 1);
              lives--;
              rt.sfx.hit();
              if (lives <= 0) {
                rt.endGame(score, `Bunker breached at ${score} pt!`);
                return;
              }
            }
          }
          rt.setStatus(`Defended: ${score} pt`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#1e293b', '#090d16');
          drawRoundedBox(c, 0, 580, W, 60, 0, '#3f6212');
          c.strokeStyle = '#94a3b8';
          c.lineWidth = 8;
          c.beginPath();
          c.moveTo(W / 2, 575);
          c.lineTo(W / 2 + Math.cos(barrelAng) * 34, 575 + Math.sin(barrelAng) * 34);
          c.stroke();
          drawCircle(c, W / 2, 580, 22, '#475569', '#cbd5e1');
          for (const d of drops) drawBadgeText(c, '🪂', d.x, d.y, '#fff', 28);
          for (const b of bullets) drawCircle(c, b.x, b.y, 5, '#fde047');
          drawLives(c, lives);
        },
      };
    },
  },
  {
    id: 'submarine-sonar-hunt',
    num: 27,
    title: 'Submarine Sonar Hunt',
    icon: '🚤',
    category: 'shooters',
    color: '#0284c7',
    controlsHint: 'Hold to ascend your sub while firing auto-torpedoes!',
    desc: 'Navigate deep trenches, blast sea mines, and grab gems.',
    create(rt): MiniGameInstance {
      let py = 320;
      let vy = 0;
      let fireT = 0;
      let score = 0;
      const torps: { x: number; y: number }[] = [];
      const mines = Array.from({ length: 6 }, (_, i) => ({ x: W + i * 110, y: rand(120, 540), bad: i % 3 !== 0 }));
      return {
        update(dt, inp) {
          vy += (inp.down ? -740 : 620) * dt;
          vy = clamp(vy, -300, 320);
          py = clamp(py + vy * dt, 90, 590);
          fireT -= dt;
          if (fireT <= 0) {
            torps.push({ x: 105, y: py });
            fireT = 0.35;
          }
          for (let i = torps.length - 1; i >= 0; i--) {
            torps[i].x += 410 * dt;
            if (torps[i].x > W + 20) torps.splice(i, 1);
          }
          for (const m of mines) {
            m.x -= (155 + score * 0.3) * dt;
            if (m.bad) {
              for (let i = torps.length - 1; i >= 0; i--) {
                if (Math.hypot(torps[i].x - m.x, torps[i].y - m.y) < 26) {
                  torps.splice(i, 1);
                  score += 20;
                  rt.setScore(score);
                  rt.sfx.score();
                  m.x = W + rand(60, 220);
                  m.y = rand(110, 540);
                  break;
                }
              }
            }
            if (Math.hypot(85 - m.x, py - m.y) < 28) {
              if (m.bad) {
                rt.sfx.explode();
                rt.endGame(score, `Hit a sea mine at ${score} pt!`);
                return;
              } else {
                score += 45;
                rt.setScore(score);
                rt.sfx.win();
                m.x = W + rand(60, 220);
                m.y = rand(110, 540);
              }
            }
            if (m.x < -40) {
              m.x = W + rand(40, 180);
              m.y = rand(110, 540);
            }
          }
          rt.setStatus(`Deep Sea Score: ${score}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0369a1', '#042f2e');
          for (const t of torps) drawRoundedBox(c, t.x - 10, t.y - 3, 20, 6, 3, '#fde047');
          for (const m of mines) drawBadgeText(c, m.bad ? '💣' : '💎', m.x, m.y, '#fff', 30);
          drawBadgeText(c, '🚤', 85, py, '#fff', 36);
        },
      };
    },
  },
  {
    id: 'sniper-wind-challenge',
    num: 28,
    title: 'Sniper Wind Challenge',
    icon: '🎯',
    category: 'shooters',
    color: '#10b981',
    controlsHint: 'Drag scope onto the target and release to fire!',
    desc: 'Precision sniper range with moving targets and breathing sway.',
    create(rt): MiniGameInstance {
      let sx = W / 2;
      let sy = 320;
      let tx = 210;
      let ty = 260;
      let tvx = 80;
      let time = 0;
      let ammo = 8;
      let score = 0;
      return {
        update(dt, inp) {
          time += dt;
          tx += tvx * dt;
          if (tx < 60 || tx > W - 60) tvx *= -1;
          if (inp.down) {
            sx = clamp(inp.x, 30, W - 30);
            sy = clamp(inp.y, 90, 540);
          }
          const realX = sx + Math.sin(time * 4.5) * 14;
          const realY = sy + Math.cos(time * 3.8) * 14;
          if (inp.justReleased && ammo > 0) {
            ammo--;
            const d = Math.hypot(realX - tx, realY - ty);
            if (d < 36) {
              const pts = d < 12 ? 150 : 80;
              score += pts;
              rt.setScore(score);
              rt.sfx.win();
              tx = rand(70, W - 70);
              ty = rand(140, 440);
              tvx = (Math.random() < 0.5 ? -1 : 1) * rand(80, 165);
            } else {
              rt.sfx.hit();
            }
            if (ammo <= 0) {
              rt.endGame(score, `Sniper score: ${score} pt!`);
              return;
            }
          }
          rt.setStatus(`Rounds left: ${ammo}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#064e3b', '#090d16');
          drawCircle(c, tx, ty, 32, '#ef4444', '#fff');
          drawCircle(c, tx, ty, 18, '#fff');
          drawCircle(c, tx, ty, 7, '#ef4444');
          const rx = sx + Math.sin(time * 4.5) * 14;
          const ry = sy + Math.cos(time * 3.8) * 14;
          c.strokeStyle = '#a3e635';
          c.lineWidth = 2;
          c.beginPath();
          c.arc(rx, ry, 28, 0, Math.PI * 2);
          c.moveTo(rx - 36, ry);
          c.lineTo(rx + 36, ry);
          c.moveTo(rx, ry - 36);
          c.lineTo(rx, ry + 36);
          c.stroke();
        },
      };
    },
  },
  {
    id: 'laser-mirror-bounce',
    num: 29,
    title: 'Laser Mirror Bounce',
    icon: '🪞',
    category: 'shooters',
    color: '#2dd4bf',
    controlsHint: 'Tap mirrors to bounce the laser beam into the crystal!',
    desc: 'Puzzle shooter: angle mirrors to bounce one laser onto gems.',
    create(rt): MiniGameInstance {
      let score = 0;
      let level = 1;
      const mirrors = [
        { x: 210, y: 180, tilt: 0 }, // tilt 0 => reflect right, 1 => reflect left
        { x: 330, y: 180, tilt: 1 },
      ];
      let target = { x: 330, y: 390 };
      const computeHits = () => {
        const path = [{ x: 210, y: 540 }, { x: 210, y: 180 }];
        const m0 = mirrors[0];
        if (m0.tilt % 2 === 0) {
          path.push({ x: 330, y: 180 });
          const m1 = mirrors[1];
          path.push(m1.tilt % 2 === 0 ? { x: 330, y: 60 } : { x: 330, y: 500 });
        } else {
          path.push({ x: 70, y: 180 });
        }
        const hit = path.some((p, idx) => idx > 0 && Math.abs(p.x - target.x) < 20 && Math.max(path[idx - 1].y, p.y) >= target.y && Math.min(path[idx - 1].y, p.y) <= target.y);
        return { path, hit };
      };
      return {
        update(_dt, inp) {
          if (inp.justPressed) {
            for (const m of mirrors) {
              if (Math.hypot(inp.x - m.x, inp.y - m.y) < 48) {
                m.tilt = (m.tilt + 1) % 2;
                rt.sfx.tap();
              }
            }
            if (computeHits().hit) {
              score += 100;
              level++;
              rt.setScore(score);
              rt.sfx.win();
              mirrors[0].tilt = Math.random() < 0.5 ? 1 : 0;
              mirrors[1].tilt = Math.random() < 0.5 ? 0 : 1;
              target = { x: 330, y: Math.random() < 0.5 ? 95 : 430 };
            }
          }
          rt.setStatus(`Level ${level} · Tap mirrors`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0f172a', '#042f2e');
          const { path } = computeHits();
          c.strokeStyle = '#2dd4bf';
          c.lineWidth = 4;
          c.beginPath();
          path.forEach((p, i) => (i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
          c.stroke();
          drawBadgeText(c, '💎', target.x, target.y, '#fff', 34);
          for (const m of mirrors) {
            drawRoundedBox(c, m.x - 24, m.y - 24, 48, 48, 12, '#1e293b', '#38bdf8');
            c.strokeStyle = '#f8fafc';
            c.lineWidth = 5;
            c.beginPath();
            if (m.tilt % 2 === 0) {
              c.moveTo(m.x - 14, m.y + 14);
              c.lineTo(m.x + 14, m.y - 14);
            } else {
              c.moveTo(m.x - 14, m.y - 14);
              c.lineTo(m.x + 14, m.y + 14);
            }
            c.stroke();
          }
          drawBadgeText(c, '🔦', 210, 545, '#fff', 34);
        },
      };
    },
  },
  {
    id: 'cannon-castle-siege',
    num: 30,
    title: 'Cannon Castle Siege',
    icon: '🏰',
    category: 'shooters',
    color: '#fb923c',
    controlsHint: 'Drag back from the cannon and release to topple castle towers!',
    desc: 'Siege artillery: smash castle blocks with limited cannonballs.',
    create(rt): MiniGameInstance {
      let drag: { x: number; y: number } | null = null;
      let balls: { x: number; y: number; vx: number; vy: number }[] = [];
      let ammo = 7;
      let score = 0;
      let blocks = Array.from({ length: 6 }, (_, i) => ({
        x: 280 + (i % 2) * 52,
        y: 470 - Math.floor(i / 2) * 44,
        alive: true,
      }));
      return {
        update(dt, inp) {
          if (inp.down) drag = { x: inp.x, y: inp.y };
          if (inp.justReleased && drag && ammo > 0) {
            const dx = clamp(75 - drag.x, 30, 220);
            const dy = clamp(470 - drag.y, -260, 260);
            balls.push({ x: 75, y: 470, vx: dx * 3.4, vy: dy * 3.4 });
            ammo--;
            drag = null;
            rt.sfx.tap();
          }
          for (let i = balls.length - 1; i >= 0; i--) {
            const b = balls[i];
            b.vy += 650 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            for (const bl of blocks) {
              if (bl.alive && Math.hypot(b.x - bl.x, b.y - bl.y) < 30) {
                bl.alive = false;
                score += 60;
                rt.setScore(score);
                rt.sfx.explode();
              }
            }
            if (b.x > W + 30 || b.y > 530) balls.splice(i, 1);
          }
          if (blocks.every((b) => !b.alive)) {
            score += 150;
            ammo += 4;
            rt.setScore(score);
            rt.sfx.win();
            blocks = Array.from({ length: 6 }, (_, i) => ({
              x: rand(240, 290) + (i % 2) * 54,
              y: 470 - Math.floor(i / 2) * 44,
              alive: true,
            }));
          }
          if (ammo <= 0 && balls.length === 0) {
            rt.endGame(score, `Siege ended! Score: ${score}`);
            return;
          }
          rt.setStatus(`Cannonballs left: ${ammo}`);
        },
        render(r) {
          const c = r.ctx;
          drawGradientBg(c, '#0284c7', '#1e293b');
          drawRoundedBox(c, 0, 500, W, 140, 0, '#3f6212');
          drawBadgeText(c, '💣', 75, 475, '#fff', 36);
          if (drag) {
            c.strokeStyle = '#fde047';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(75, 470);
            c.lineTo(75 + (75 - drag.x), 470 + (470 - drag.y));
            c.stroke();
          }
          for (const bl of blocks) {
            if (bl.alive) {
              drawRoundedBox(c, bl.x - 20, bl.y - 20, 40, 40, 6, '#94a3b8', '#e2e8f0');
              drawBadgeText(c, '💂', bl.x, bl.y, '#fff', 22);
            }
          }
          for (const b of balls) drawCircle(c, b.x, b.y, 9, '#0f172a', '#fde047');
        },
      };
    },
  },
];
