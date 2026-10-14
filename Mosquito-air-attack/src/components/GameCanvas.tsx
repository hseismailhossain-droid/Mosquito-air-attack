import React, { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../gameEngine';
import { renderTerrain, renderTrees, getTerrainY } from '../terrain';
import { 
  drawPlayer, drawMosquito, drawMosquitoEgg,
  drawBattleTank, drawAutoTurret, drawFriendlyDrone, drawEnemyBullet,
  drawRocket, drawBomb, drawAirdropCrate,
  drawEnemyParatrooper, drawCruiseMissile, drawFallingWreckage,
  drawHimarsTruck, drawFlakCannon, drawRadarStation, drawBioAcidBlob
} from '../sprites';

interface GameCanvasProps {
  engine: GameEngine;
  onGameOver: () => void;
  screenShakeEnabled: boolean;
  isInGame: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = React.memo(({
  engine,
  onGameOver,
  screenShakeEnabled,
  isInGame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isDraggingPlayer = useRef(false);
  const isPointerDownRef = useRef(false);

  const BASE_WIDTH = 1200;
  const BASE_HEIGHT = 640;

  // Stable references to prevent tearing down the requestAnimationFrame loop
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;
  const screenShakeEnabledRef = useRef(screenShakeEnabled);
  screenShakeEnabledRef.current = screenShakeEnabled;
  const isInGameRef = useRef(isInGame);
  isInGameRef.current = isInGame;

  // Pre-rendered offscreen background cache (Sky, Sun, Sun Rays, Mountains, Ridge Trees)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgBossRef = useRef<boolean | null>(null);

  const getCachedBackground = useCallback((width: number, height: number, isBoss: boolean) => {
    if (bgCanvasRef.current && bgBossRef.current === isBoss) {
      return bgCanvasRef.current;
    }

    if (!bgCanvasRef.current) {
      bgCanvasRef.current = document.createElement('canvas');
      bgCanvasRef.current.width = width;
      bgCanvasRef.current.height = height;
    }

    const bCtx = bgCanvasRef.current.getContext('2d');
    if (!bCtx) return null;
    bgBossRef.current = isBoss;

    // 1. Vibrant Daytime Sky Gradient (দিনের উজ্জ্বল আলো ও নীল আকাশ)
    const skyGrad = bCtx.createLinearGradient(0, 0, 0, height * 0.76);
    if (isBoss) {
      skyGrad.addColorStop(0, '#f97316');
      skyGrad.addColorStop(0.35, '#fb923c');
      skyGrad.addColorStop(0.7, '#fdba74');
      skyGrad.addColorStop(1, '#fed7aa');
    } else {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.25, '#38bdf8');
      skyGrad.addColorStop(0.55, '#7dd3fc');
      skyGrad.addColorStop(0.82, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
    }
    bCtx.fillStyle = skyGrad;
    bCtx.fillRect(0, 0, width, height);

    // 2. Radiant Golden Daytime Sun (সূর্য ও দিনের উজ্জ্বল আলো)
    const sunX = width * 0.78;
    const sunY = height * 0.18;

    // Atmospheric sunflare corona
    const outerHalo = bCtx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 140);
    outerHalo.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    outerHalo.addColorStop(0.4, 'rgba(253, 224, 71, 0.22)');
    outerHalo.addColorStop(0.8, 'rgba(250, 204, 21, 0.08)');
    outerHalo.addColorStop(1, 'rgba(250, 204, 21, 0)');
    bCtx.fillStyle = outerHalo;
    bCtx.beginPath();
    bCtx.arc(sunX, sunY, 140, 0, Math.PI * 2);
    bCtx.fill();

    // Golden sun rays radiating across the daytime sky
    bCtx.save();
    for (let r = 0; r < 8; r++) {
      const ang = (r * Math.PI) / 4;
      bCtx.strokeStyle = 'rgba(254, 240, 138, 0.16)';
      bCtx.lineWidth = 14;
      bCtx.beginPath();
      bCtx.moveTo(sunX, sunY);
      bCtx.lineTo(sunX + Math.cos(ang) * 220, sunY + Math.sin(ang) * 220);
      bCtx.stroke();
    }
    bCtx.restore();

    // Inner bright sun glow
    const innerSunGlow = bCtx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 36);
    innerSunGlow.addColorStop(0, '#ffffff');
    innerSunGlow.addColorStop(0.4, '#fef08a');
    innerSunGlow.addColorStop(0.8, '#fde047');
    innerSunGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
    bCtx.fillStyle = innerSunGlow;
    bCtx.beginPath();
    bCtx.arc(sunX, sunY, 36, 0, Math.PI * 2);
    bCtx.fill();

    // Golden Sun Core disc
    bCtx.fillStyle = '#fef08a';
    bCtx.beginPath();
    bCtx.arc(sunX, sunY, 20, 0, Math.PI * 2);
    bCtx.fill();

    bCtx.fillStyle = '#ffffff';
    bCtx.beginPath();
    bCtx.arc(sunX, sunY, 12, 0, Math.PI * 2);
    bCtx.fill();

    // 4. Distant Lush Green Mountain Ridge
    bCtx.fillStyle = '#3b82a6';
    bCtx.beginPath();
    bCtx.moveTo(0, height * 0.74);
    bCtx.lineTo(width * 0.14, height * 0.54);
    bCtx.lineTo(width * 0.32, height * 0.64);
    bCtx.lineTo(width * 0.48, height * 0.52);
    bCtx.lineTo(width * 0.66, height * 0.65);
    bCtx.lineTo(width * 0.84, height * 0.55);
    bCtx.lineTo(width, height * 0.68);
    bCtx.lineTo(width, height);
    bCtx.lineTo(0, height);
    bCtx.closePath();
    bCtx.fill();

    // 5. Mid-Range Rolling Green Hills
    bCtx.fillStyle = '#4d7c0f';
    bCtx.beginPath();
    bCtx.moveTo(0, height * 0.74);
    bCtx.lineTo(width * 0.22, height * 0.62);
    bCtx.lineTo(width * 0.44, height * 0.68);
    bCtx.lineTo(width * 0.72, height * 0.61);
    bCtx.lineTo(width * 0.92, height * 0.70);
    bCtx.lineTo(width, height * 0.74);
    bCtx.lineTo(width, height);
    bCtx.lineTo(0, height);
    bCtx.closePath();
    bCtx.fill();

    // Pine trees along mid-mountain ridges
    bCtx.fillStyle = '#365314';
    for (let px = 40; px < width - 40; px += 34) {
      const my = height * 0.63 + Math.sin(px / 120) * 16;
      bCtx.beginPath();
      bCtx.moveTo(px, my);
      bCtx.lineTo(px - 5, my + 14);
      bCtx.lineTo(px + 5, my + 14);
      bCtx.closePath();
      bCtx.fill();
    }

    // 6. Warm Sunlit Daylight Atmosphere & Ground Warmth
    const daylightHaze = bCtx.createLinearGradient(0, height * 0.60, 0, height * 0.76);
    daylightHaze.addColorStop(0, 'rgba(254, 240, 138, 0)');
    daylightHaze.addColorStop(0.5, 'rgba(254, 240, 138, 0.12)');
    daylightHaze.addColorStop(1, 'rgba(254, 240, 138, 0)');
    bCtx.fillStyle = daylightHaze;
    bCtx.fillRect(0, height * 0.60, width, height * 0.16);

    return bgCanvasRef.current;
  }, []);

  // Main game loop (never gets canceled or interrupted during gameplay)
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let ctxCache: CanvasRenderingContext2D | null = null;

    const loop = (currentTime: number) => {
      // 1. ALWAYS schedule the next frame first so the loop NEVER freezes or halts
      animationFrameId = requestAnimationFrame(loop);

      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!ctxCache) {
        ctxCache = canvas.getContext('2d', { alpha: false });
      }
      const ctx = ctxCache;
      if (!ctx) return;

      const rawDt = (currentTime - lastTime) / 1000;
      // Ultra-smooth clamped frame delta for buttery 60-120fps gameplay
      const dt = Math.min(0.033, Math.max(0.001, rawDt));
      lastTime = currentTime;

      try {
        const inGame = isInGameRef.current;

        if (inGame) {
          let dir = 0;
          if (keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft']) dir -= 1;
          if (keysPressed.current['KeyD'] || keysPressed.current['ArrowRight']) dir += 1;
          engine.setKeyMovement(dir);

          // Continuous fluid stream of rockets while pointer is held and dragged
          if (isPointerDownRef.current && !isDraggingPlayer.current) {
            engine.shootRocket();
          }

          engine.update(dt);

          if (engine.isGameOver) {
            onGameOverRef.current();
          }
        }

        ctx.save();

        // Screen shake translation
        if (screenShakeEnabledRef.current && engine.screenShake > 0) {
          const shakeMag = engine.screenShake;
          const offsetX = (Math.random() - 0.5) * shakeMag * 2;
          const offsetY = (Math.random() - 0.5) * shakeMag * 2;
          ctx.translate(offsetX, offsetY);
        }

        // 1. High-speed pre-rendered scenic background
        const isBoss = engine.currentWave % 3 === 0;
        const bgImg = getCachedBackground(BASE_WIDTH, BASE_HEIGHT, isBoss);
        if (bgImg) {
          ctx.drawImage(bgImg, 0, 0);
        }

      // Parallax Fluffy White Clouds in Daylight
      for (let ci = 0; ci < engine.clouds.length; ci++) {
        const cloud = engine.clouds[ci];
        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.scale(cloud.scale, cloud.scale);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(0, 0, 28, 0, Math.PI * 2);
        ctx.arc(26, -9, 24, 0, Math.PI * 2);
        ctx.arc(52, 0, 26, 0, Math.PI * 2);
        ctx.arc(78, 4, 20, 0, Math.PI * 2);
        ctx.arc(-24, 4, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
        ctx.beginPath();
        ctx.arc(0, 10, 20, 0, Math.PI * 2);
        ctx.arc(32, 10, 22, 0, Math.PI * 2);
        ctx.arc(60, 10, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 2. Trees and vegetation
      renderTrees(ctx, engine.terrain, BASE_WIDTH);

      // 3. Terrain with grass & soil
      renderTerrain(ctx, engine.terrain, BASE_WIDTH, BASE_HEIGHT);

      // Colorful wildflowers on the hillsides (batched for speed)
      const flowerScale = BASE_WIDTH / engine.terrain.width;
      ctx.fillStyle = '#fde047';
      for (let fx = 20; fx < engine.terrain.width - 20; fx += 64) {
        const sx = fx * flowerScale;
        const gy = engine.terrain.heights[fx];
        ctx.fillRect(sx, gy - 2, 2.5, 2.5);
      }
      ctx.fillStyle = '#ffffff';
      for (let fx = 52; fx < engine.terrain.width - 20; fx += 64) {
        const sx = fx * flowerScale;
        const gy = engine.terrain.heights[fx];
        ctx.fillRect(sx, gy - 2, 2.5, 2.5);
      }

      // Dynamic entities during play
      if (isInGame) {
        // 4. Airdrop crates
        engine.crates.forEach((crate) => {
          drawAirdropCrate(ctx, crate);
        });

        // 5. Mosquitos (বিভিন্ন প্রজাতির মশা: এডিস, কিউলেক্স, অ্যানোফিলিস, রক্তচোষা, মিউট্যান্ট, ঝাঁক ও রানী মশা)
        engine.aircrafts.forEach((aircraft) => {
          drawMosquito(ctx, aircraft);
        });

        // 5b. Falling Burning Aircraft Wreckage
        engine.fallingWreckage.forEach((w) => {
          drawFallingWreckage(ctx, w);
        });

        // 5c. Cruise Missiles
        engine.cruiseMissiles.forEach((cm) => {
          drawCruiseMissile(ctx, cm);
        });

        // 5d. Enemy Airborne Paratroopers
        engine.enemyParatroopers.forEach((tp) => {
          drawEnemyParatrooper(ctx, tp);
        });

        // 6. Ground Combat Vehicles (Enemy & Friendly Tanks)
        engine.groundTanks.forEach((tank) => {
          drawBattleTank(ctx, tank);
        });

        // 6a. Allied Main Battle Tank (1790870270967.jpg top-center)
        if (engine.friendlyTank) {
          drawBattleTank(ctx, engine.friendlyTank);
        }

        // 6b. HIMARS / MLRS Multi-Launch Rocket Artillery Truck (1790870270967.jpg top-left)
        if (engine.himarsTruck) {
          drawHimarsTruck(ctx, engine.himarsTruck);
        }

        // 7a. Patriot SAM Long-Range Missile Battery Truck (1790870270967.jpg top-right)
        if (engine.autoTurret) {
          drawAutoTurret(ctx, engine.autoTurret);
        }

        // 7b. Dual Flak Autocannon Mobile AA Platform (1790870270967.jpg bottom-left)
        if (engine.flakCannon) {
          drawFlakCannon(ctx, engine.flakCannon);
        }

        // 8a. MQ-9 Reaper / Predator Strike Combat Drone (1790870270967.jpg bottom-center)
        if (engine.friendlyDrone) {
          drawFriendlyDrone(ctx, engine.friendlyDrone);
        }

        // 8b. 3D Phased-Array Air Defense Radar Truck (1790870270967.jpg bottom-right)
        if (engine.radarStation) {
          drawRadarStation(ctx, engine.radarStation);

          // Render expanding microwave radar pulse waves across the sky!
          engine.radarStation.pulseWaves.forEach((w) => {
            ctx.save();
            ctx.strokeStyle = `rgba(16, 185, 129, ${w.alpha * 0.75})`;
            ctx.lineWidth = 2.5;
            ctx.setLineDash([8, 6]);
            ctx.beginPath();
            ctx.arc(engine.radarStation!.x, engine.radarStation!.y - 20, w.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          });
        }

        // 9. Enemy tracer bullets
        engine.enemyBullets.forEach((bullet) => {
          drawEnemyBullet(ctx, bullet);
        });

        // 9b. Corrosive Bio-Acid Blobs (যুদ্ধাস্ত্র ধ্বংসকারী ক্ষতিকর ভাইরাস এসিড গোলা)
        engine.acidBlobs.forEach((blob) => {
          drawBioAcidBlob(ctx, blob);
        });

        // 10. Mosquito Egg Pods (মশার ডিম - Falling insect eggs dropped from above)
        engine.bombs.forEach((bomb) => {
          drawMosquitoEgg(ctx, bomb);
        });

        // 11. Enlarged player soldier
        drawPlayer(ctx, engine.player);

        // Lifeline Health Gauge directly above enlarged player soldier
        ctx.save();
        const pX = engine.player.x;
        const pY = engine.player.y - 58;
        const hpRatio = Math.max(0, engine.player.health / engine.player.maxHealth);
        ctx.fillStyle = '#020617';
        ctx.fillRect(pX - 25, pY, 50, 8);
        ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.25 ? '#eab308' : '#ef4444';
        ctx.fillRect(pX - 23, pY + 1.5, 46 * hpRatio, 5);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(pX - 25, pY, 50, 8);

        // Ammo icons below health bar
        const ammoMax = engine.player.maxAmmo;
        const ammoCurr = engine.player.ammo;
        const bulletWidth = Math.min(6, 42 / ammoMax);
        for (let b = 0; b < ammoMax; b++) {
          ctx.fillStyle = b < ammoCurr ? '#38bdf8' : '#334155';
          ctx.fillRect(pX - 21 + b * (bulletWidth + 1.5), pY + 10, bulletWidth, 3.5);
        }
        ctx.restore();

        // 12. Crosshair Target Indicator & Tunnel Periscope Sight
        ctx.save();
        if (engine.player.isInTunnel) {
          // Subtle tracer line from bunker firing hatch up to crosshair
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(engine.player.x, getTerrainY(engine.player.x, engine.terrain) - 8);
          ctx.lineTo(engine.crosshairX, engine.crosshairY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.strokeStyle = engine.player.isInTunnel ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(engine.crosshairX, engine.crosshairY, 8, 0, Math.PI * 2);
        ctx.moveTo(engine.crosshairX - 12, engine.crosshairY);
        ctx.lineTo(engine.crosshairX + 12, engine.crosshairY);
        ctx.moveTo(engine.crosshairX, engine.crosshairY - 12);
        ctx.lineTo(engine.crosshairX, engine.crosshairY + 12);
        ctx.stroke();
        ctx.restore();

        // 12b. Tunnel Subterranean Active Banner (placed underground inside the bunker)
        if (engine.player.isInTunnel) {
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(BASE_WIDTH * 0.5 - 240, 532, 480, 22, 6);
          ctx.fill();
          ctx.stroke();

          ctx.font = '700 7.5px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('🛡️ EXPANDED BUNKER ACTIVE • সুবিশাল টানেল কমপ্লেক্স 💥', BASE_WIDTH * 0.5, 543);
          ctx.restore();
        }

        // 13. Rockets
        engine.rockets.forEach((rocket) => {
          drawRocket(ctx, rocket);
        });

        // 13b. Ion Bug-Zapper Laser Beams
        engine.laserBeams.forEach((beam) => {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, beam.alpha));
          
          // Outer neon glow
          ctx.strokeStyle = beam.color;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(beam.x1, beam.y1);
          ctx.lineTo(beam.x2, beam.y2);
          ctx.stroke();

          // Intense core white laser beam
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(beam.x1, beam.y1);
          ctx.lineTo(beam.x2, beam.y2);
          ctx.stroke();

          ctx.restore();
        });

        // 13c. Extermination Frenzy Aura
        if (engine.player.isFrenzyActive) {
          ctx.save();
          const fPhase = (Date.now() / 120) % (Math.PI * 2);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(engine.player.x, engine.player.y - 18, 30 + Math.sin(fPhase) * 4, 0, Math.PI * 2);
          ctx.stroke();

          ctx.font = '700 8px "Press Start 2P", monospace';
          ctx.fillStyle = '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText('🔥 FRENZY OVERDRIVE', engine.player.x, engine.player.y - 48);
          ctx.restore();
        }

        // 13d. Queen Stinger Dive Hazard Indicator
        if (engine.activeBoss && (engine.activeBoss.isDivingToBite || (engine.activeBoss.biteAttackPrepTimer && engine.activeBoss.biteAttackPrepTimer > 0))) {
          ctx.save();
          const p = engine.player;
          const flash = Math.floor(Date.now() / 140) % 2 === 0;
          ctx.strokeStyle = flash ? '#ef4444' : '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y - 18, 38, 0, Math.PI * 2);
          ctx.stroke();

          ctx.font = '700 8.5px "Press Start 2P", monospace';
          ctx.fillStyle = flash ? '#ef4444' : '#fbbf24';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ QUEEN DIVE! DODGE 💨', p.x, p.y - 58);
          ctx.restore();
        }

        // 14. Particles (Explosion black smoke rings & sparks) - Zero save/restore overhead
        for (let pi = 0; pi < engine.particles.length; pi++) {
          const p = engine.particles[pi];
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
          ctx.fillStyle = p.color;

          if (p.isRingSmoke) {
            ctx.fillRect(p.x - p.size * 0.5, p.y - p.size * 0.5, p.size, p.size);
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // 15. Touch ripples
        for (let ri = 0; ri < engine.touchRipples.length; ri++) {
          const ripple = engine.touchRipples[ri];
          ctx.globalAlpha = Math.max(0, Math.min(1, ripple.alpha));
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // 16. Large "WAVE X" banner
        if (engine.waveAnnounceTimer > 0) {
          ctx.save();
          ctx.font = '700 34px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillText(`WAVE ${engine.currentWave}`, BASE_WIDTH * 0.5 + 2, BASE_HEIGHT * 0.16 + 2);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`WAVE ${engine.currentWave}`, BASE_WIDTH * 0.5, BASE_HEIGHT * 0.16);
          ctx.restore();
        }

        // 17. Boss Warning Alert Banner
        if (engine.bossWarningBanner) {
          ctx.save();
          const flashPhase = Math.floor(Date.now() / 200) % 2 === 0;
          ctx.fillStyle = flashPhase ? 'rgba(220, 38, 38, 0.88)' : 'rgba(153, 27, 27, 0.88)';
          ctx.fillRect(0, BASE_HEIGHT * 0.10, BASE_WIDTH, 44);
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, BASE_HEIGHT * 0.10, BASE_WIDTH, 44);

          ctx.font = '700 13px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fef08a';
          ctx.fillText(engine.bossWarningBanner.text, BASE_WIDTH * 0.5, BASE_HEIGHT * 0.10 + 22);
          ctx.restore();
        }

        // 18. Combo Streak Badge
        if (engine.comboStreak >= 2) {
          ctx.save();
          ctx.font = '700 12px "Press Start 2P", monospace';
          ctx.textAlign = 'right';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`🔥 COMBO x${engine.comboStreak}`, BASE_WIDTH - 24, 68);
          ctx.restore();
        }

        // 19. Screen Flash (EMP Nuke Shockwave)
        if (engine.screenFlash) {
          ctx.save();
          ctx.fillStyle = engine.screenFlash.color;
          ctx.globalAlpha = Math.min(1, engine.screenFlash.alpha);
          ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
          ctx.restore();
        }
      }

      ctx.restore();
    } catch (err) {
      console.error('Frame loop error:', err);
    }
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, getCachedBackground]);

  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 600, y: 300 };
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return { x: 600, y: 300 };

    const canvasAspect = BASE_WIDTH / BASE_HEIGHT; // 1200 / 600 = 2.0
    const rectAspect = rect.width / rect.height;

    let renderWidth = rect.width;
    let renderHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;

    if (rectAspect > canvasAspect) {
      // Container is wider than 2:1 -> pillarboxed (black bars left and right)
      renderHeight = rect.height;
      renderWidth = rect.height * canvasAspect;
      offsetX = (rect.width - renderWidth) / 2;
    } else {
      // Container is taller than 2:1 -> letterboxed (black bars top and bottom)
      renderWidth = rect.width;
      renderHeight = rect.width / canvasAspect;
      offsetY = (rect.height - renderHeight) / 2;
    }

    const relX = clientX - rect.left - offsetX;
    const relY = clientY - rect.top - offsetY;

    const x = Math.max(0, Math.min(BASE_WIDTH, (relX / renderWidth) * BASE_WIDTH));
    const y = Math.max(0, Math.min(BASE_HEIGHT, (relY / renderHeight) * BASE_HEIGHT));
    return { x, y };
  };

  // Keyboard controls
  useEffect(() => {
    if (!isInGame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyW' || e.code === 'Space' || e.code === 'ArrowUp') {
        engine.jump();
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'KeyB') {
        engine.toggleTunnelCover();
      }
      if (e.code === 'KeyE' || e.code === 'KeyR') {
        engine.toggleWeaponMode();
      }
      if (e.code === 'KeyC' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        engine.performTacticalDash();
      }
      if (e.code === 'KeyF' || e.code === 'KeyX') {
        engine.triggerSuperNuke();
      }
      keysPressed.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [engine, isInGame]);

  // Pointer interactions (hand touch / mouse)
  // Direct fire exactly where touched!
  const handlePointerDown = (clientX: number, clientY: number) => {
    if (!isInGame) return;
    isPointerDownRef.current = true;
    const { x, y } = getCanvasCoords(clientX, clientY);

    // If tapped directly on the soldier sprite (within 28px) when on ground, allow drag movement
    const distToPlayer = Math.hypot(x - engine.player.x, y - (engine.player.y - 18));
    if (distToPlayer < 28) {
      isDraggingPlayer.current = true;
      return;
    }

    // Every tap anywhere on the battlefield or sky attacks directly at that exact touched point!
    engine.registerTap(x, y);
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isInGame) return;
    const { x, y } = getCanvasCoords(clientX, clientY);

    if (isDraggingPlayer.current) {
      const diffX = x - engine.player.x;
      if (Math.abs(diffX) > 2) {
        engine.player.facing = diffX > 0 ? 1 : -1;
        engine.player.walkTimer += 0.05;
        engine.player.walkFrame = engine.player.walkTimer * 10;
        engine.player.x += Math.sign(diffX) * Math.min(Math.abs(diffX), 14);
        engine.player.x = Math.max(20, Math.min(BASE_WIDTH - 20, engine.player.x));
        engine.player.y = getTerrainY(engine.player.x, engine.terrain);
        engine.player.isGrounded = true;
        engine.player.vy = 0;
      }
      engine.setCrosshair(x, y);
    } else {
      engine.setCrosshair(x, y);
    }
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    isDraggingPlayer.current = false;
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={BASE_WIDTH}
        height={BASE_HEIGHT}
        className="w-full h-full object-contain cursor-crosshair max-w-[100vw] max-h-[100vh] touch-none select-none"
        onPointerDown={(e) => {
          e.preventDefault();
          try {
            e.currentTarget.setPointerCapture?.(e.pointerId);
          } catch {}
          handlePointerDown(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          e.preventDefault();
          handlePointerMove(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          e.preventDefault();
          try {
            e.currentTarget.releasePointerCapture?.(e.pointerId);
          } catch {}
          handlePointerUp();
        }}
        onPointerCancel={(e) => {
          e.preventDefault();
          handlePointerUp();
        }}
      />
    </div>
  );
});
