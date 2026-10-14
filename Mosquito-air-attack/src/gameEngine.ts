import { 
  Aircraft, Bomb, Rocket, AirdropCrate, Particle, FloatingText, 
  Player, GameMode, GameStats, PowerupType, Cloud, GroundTank, AutoTurret, EnemyBullet, FriendlyDrone,
  EnemyParatrooper, FallingWreckage, CruiseMissile, EggType, MosquitoType,
  HimarsTruck, FlakCannonVehicle, RadarStationTruck, BioAcidBlob,
  TimeOfDay, BadgePopup, ElectricArc, ChemicalSmoke, Raindrop
} from './types';
import { TerrainData, getTerrainY, applyCrater, getTunnelFloorY, isCoveredByBunkerRoof } from './terrain';
import { sound } from './audio';

let _idCounter = 0;
const nextId = () => (++_idCounter).toString();

function distToSegment(p: { x: number; y: number }, v: { x: number; y: number }, w: { x: number; y: number }): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

export interface TouchRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

export class GameEngine {
  public player: Player;
  public terrain: TerrainData;
  public aircrafts: Aircraft[] = [];
  public groundTanks: GroundTank[] = [];
  public friendlyTank: GroundTank | null = null;
  public friendlyDrone: FriendlyDrone | null = null;
  public autoTurret: AutoTurret | null = null;
  public himarsTruck: HimarsTruck | null = null;
  public flakCannon: FlakCannonVehicle | null = null;
  public radarStation: RadarStationTruck | null = null;
  public enemyBullets: EnemyBullet[] = [];
  public rockets: Rocket[] = [];
  public bombs: Bomb[] = [];
  public crates: AirdropCrate[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public clouds: Cloud[] = [];
  public touchRipples: TouchRipple[] = [];
  public laserBeams: { id: string; x1: number; y1: number; x2: number; y2: number; color: string; alpha: number; life: number }[] = [];
  public acidBlobs: BioAcidBlob[] = [];

  // New intense battlefield forces & combat dynamics
  public enemyParatroopers: EnemyParatrooper[] = [];
  public fallingWreckage: FallingWreckage[] = [];
  public cruiseMissiles: CruiseMissile[] = [];
  public activeBoss: Aircraft | null = null;
  public bossWarningBanner: { text: string; timer: number; alpha: number } | null = null;
  public comboStreak = 0;
  public comboTimer = 0;
  public screenFlash: { color: string; alpha: number } | null = null;

  // Dynamic Atmospheric Weather Cycle (দিন, গোধূলি, রাত ও বৃষ্টির আবহাওয়া)
  public timeOfDay: TimeOfDay = 'DAY';
  public rainDrops: Raindrop[] = [];
  public lightningFlashTimer = 0;

  // High-Voltage Electric Tesla Zapper & Aerosol Chemical Fogger Systems
  public electricArcs: ElectricArc[] = [];
  public chemicalSmokes: ChemicalSmoke[] = [];
  public activeBadges: BadgePopup[] = [];
  public unlockedBadges = new Set<string>();

  public mode: GameMode = 'EASY';
  public currentWave = 1;
  public waveAnnounceTimer = 0; // displays "WAVE X"
  public waveTotalEnemies = 0;
  public waveSpawnQueue: { type: Aircraft['type'] | 'TANK'; delay: number }[] = [];
  public waveClearTimer = 0;
  public waveStuckSafetyTimer = 0;

  public isWaveActive = false;
  public isGameOver = false;
  public screenShake = 0;

  public stats: GameStats = {
    score: 0,
    highScore: 0,
    currentWave: 1,
    planesDestroyed: 0,
    bombsShotDown: 0,
    mosquitoesDestroyed: 0,
    eggsDestroyed: 0,
    cratesCollected: 0,
    shotsFired: 0,
    shotsHit: 0,
    combo: 0,
    maxCombo: 0,
    bossesDefeated: 0,
  };

  public crosshairX = 600;
  public crosshairY = 300;
  private easyRegenTimer = 0; // passive health regeneration in Easy Mode

  public keyDirection = 0;
  public touchDirection = 0;

  constructor(terrain: TerrainData, mode: GameMode = 'EASY') {
    this.terrain = terrain;
    this.mode = mode;

    const saved = localStorage.getItem('air_attack_highscore');
    if (saved) {
      this.stats.highScore = parseInt(saved, 10) || 0;
    }

    const isEasy = mode === 'EASY';
    const isHard = mode === 'HARD';
    const isBottomless = mode === 'BOTTOMLESS';

    // Easy mode is relaxed & forgiving; Hard mode is intense & punishing!
    const maxHp = isEasy ? 200 : (isHard ? 85 : 120);
    const startCredits = isEasy ? 450 : (isHard ? 100 : 250);
    const ammoCap = isBottomless ? 999 : (isEasy ? 8 : (isHard ? 5 : 6));
    const ammoRecovery = isEasy ? 0.70 : (isHard ? 1.45 : 1.10);
    const starterShields = isEasy ? 2 : (isHard ? 0 : 1);

    const startX = terrain.width * 0.52;
    this.player = {
      x: startX,
      y: 30, // drops from top of sky!
      vx: 0,
      vy: 160,
      facing: 1,
      aimAngle: -Math.PI / 3,
      isGrounded: false,
      health: maxHp,
      maxHealth: maxHp,
      ammo: ammoCap,
      maxAmmo: ammoCap,
      ammoRecoverTimer: 0,
      ammoRecoverRate: ammoRecovery,
      jumpsRemaining: 1,
      maxJumps: 1,
      isParachuting: false,
      reloadProgress: 1,
      shieldHits: starterShields, // Easy mode gets 2 starter shields!
      credits: startCredits,
      hasAutoLauncher: false,
      autoLauncherCooldown: 0,
      autoLauncherTimeRemaining: 0,
      hasFriendlyTank: false,
      friendlyTankTimeRemaining: 0,
      hasFriendlyDrone: false,
      friendlyDroneTimeRemaining: 0,
      hasHimarsTruck: false,
      himarsTruckTimeRemaining: 0,
      hasFlakCannon: false,
      flakCannonTimeRemaining: 0,
      hasRadarStation: false,
      radarStationTimeRemaining: 0,
      activePowerup: null,
      walkFrame: 0,
      walkTimer: 0,
      scale: 1.45,
      rageMeter: 0,
      maxRage: 100,
      weaponMode: 'ROCKET',
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      isInTunnel: false,
    };

    this.initClouds();
    this.startWave(1);
  }

  private initClouds() {
    this.clouds = [
      { x: 80, y: 80, speed: 5, scale: 1.3, opacity: 0.8 },
      { x: 420, y: 110, speed: 4, scale: 1.5, opacity: 0.75 },
      { x: 780, y: 65, speed: 6, scale: 1.2, opacity: 0.85 },
      { x: 1080, y: 95, speed: 4.5, scale: 1.4, opacity: 0.7 },
    ];
  }

  public registerTap(targetX: number, targetY: number) {
    this.crosshairX = targetX;
    this.crosshairY = targetY;

    this.touchRipples.push({
      x: targetX,
      y: targetY,
      radius: 16,
      alpha: 0.9,
    });

    const shoulderY = this.player.y - 19;
    const dx = targetX - this.player.x;
    const dy = targetY - shoulderY;
    const exactAngle = Math.atan2(dy, dx);

    this.player.aimAngle = exactAngle;
    this.player.facing = dx >= 0 ? 1 : -1;

    // 1. Direct Tap on Mosquito Egg: Immediate interception pop!
    let tappedBomb: Bomb | null = null;
    let minBDist = 36;
    for (let b = 0; b < this.bombs.length; b++) {
      const bomb = this.bombs[b];
      const d = Math.hypot(targetX - bomb.x, targetY - bomb.y);
      if (d < minBDist) {
        minBDist = d;
        tappedBomb = bomb;
      }
    }

    if (tappedBomb) {
      const bIdx = this.bombs.indexOf(tappedBomb);
      if (bIdx !== -1) {
        this.bombs.splice(bIdx, 1);
        this.createEggSplatter(tappedBomb.x, tappedBomb.y, tappedBomb.eggType);
        sound.playEggPop();
        this.stats.shotsHit++;
        this.stats.eggsDestroyed = (this.stats.eggsDestroyed || 0) + 1;
        this.stats.bombsShotDown++;
        this.player.credits += 30;
        this.registerHitCombo('BOMB', 50, tappedBomb.x, tappedBomb.y);
        this.addFloatingText('ডিম ধ্বংস! 🥚💥 +$30', tappedBomb.x, tappedBomb.y - 15, '#fef08a');
      }
      this.shootRocket(exactAngle);
      return;
    }

    // 2. Direct Tap on Mosquito: Precision homing lock-on!
    let tappedAc: Aircraft | null = null;
    let minAcDist = 52;
    for (let i = 0; i < this.aircrafts.length; i++) {
      const ac = this.aircrafts[i];
      const d = Math.hypot(targetX - ac.x, targetY - ac.y);
      if (d < minAcDist) {
        minAcDist = d;
        tappedAc = ac;
      }
    }

    // Fire directly with the exact calculated touch angle (and lock target if tapped on mosquito)
    this.shootRocket(exactAngle, tappedAc?.id);
  }

  public setCrosshair(x: number, y: number) {
    this.crosshairX = x;
    this.crosshairY = y;
    const dx = x - this.player.x;
    const dy = y - (this.player.y - 18);
    this.player.aimAngle = Math.atan2(dy, dx);
    this.player.facing = dx >= 0 ? 1 : -1;
  }

  public startWave(waveNumber: number) {
    this.currentWave = waveNumber;
    this.stats.currentWave = waveNumber;
    this.waveAnnounceTimer = 2.4; // "WAVE X" banner
    this.aircrafts = [];
    // Only clear hostile ground tanks; do not erase active friendly tanks
    this.groundTanks = this.groundTanks.filter((t) => t.isFriendly);
    this.enemyBullets = [];
    this.enemyParatroopers = [];
    this.cruiseMissiles = [];
    this.waveClearTimer = 0;
    this.waveStuckSafetyTimer = 0;
    sound.playWaveStart();

    // Reward player with bonus war funds every wave to maintain defenses
    const bonusCredits = 180 + waveNumber * 35;
    this.player.credits += bonusCredits;
    this.addFloatingText(`WAVE ${waveNumber} START! +$${bonusCredits}`, this.player.x, this.player.y - 45, '#38bdf8');

    // Atmospheric Day/Dusk/Night/Rain Weather Progression (দিন, গোধূলি, রাত ও বৃষ্টির আবহাওয়া)
    const cycle = (waveNumber - 1) % 4;
    if (cycle === 0) {
      this.timeOfDay = 'DAY';
      this.rainDrops = [];
      this.addFloatingText('☀️ DAYTIME PATROL (উজ্জ্বল দিন)', this.player.x, this.player.y - 60, '#fef08a');
    } else if (cycle === 1) {
      this.timeOfDay = 'DUSK';
      this.rainDrops = [];
      this.addFloatingText('🌅 CRIMSON TWILIGHT (রক্তিম গোধূলি)', this.player.x, this.player.y - 60, '#fb923c');
    } else if (cycle === 2) {
      this.timeOfDay = 'NIGHT';
      this.rainDrops = [];
      this.addFloatingText('🌙 STARRY MIDNIGHT (অন্ধকার রাত)', this.player.x, this.player.y - 60, '#818cf8');
    } else {
      this.timeOfDay = 'RAIN';
      sound.playThunder();
      this.rainDrops = [];
      for (let r = 0; r < 60; r++) {
        this.rainDrops.push({
          x: Math.random() * this.terrain.width,
          y: Math.random() * 640,
          speed: 460 + Math.random() * 240,
          len: 12 + Math.random() * 10,
        });
      }
      this.addFloatingText('🌧️ MONSOON STORM (ঝড়-বৃষ্টি ও বজ্রপাত)', this.player.x, this.player.y - 60, '#38bdf8');
    }

    // Milestone unlocks (automatic free reinforcement call on reaching level)
    if (waveNumber === 2 && !this.player.hasAutoLauncher) {
      this.buyAutoLauncher(true);
      setTimeout(() => this.addFloatingText('LEVEL 2: AUTO SAM DEPLOYED!', this.player.x, this.player.y - 45, '#22c55e'), 600);
    } else if (waveNumber === 3 && !this.player.hasFriendlyTank) {
      this.buyFriendlyTank(true);
      setTimeout(() => this.addFloatingText('LEVEL 3: ALLIED TANK ARRIVED!', this.player.x, this.player.y - 45, '#38bdf8'), 600);
    } else if (waveNumber === 4 && !this.player.hasFriendlyDrone) {
      this.buyFriendlyDrone(true);
      setTimeout(() => this.addFloatingText('LEVEL 4: GUARDIAN DRONE AIRBORNE!', this.player.x, this.player.y - 45, '#a855f7'), 600);
    } else if (waveNumber === 5 && !this.player.hasHimarsTruck) {
      this.buyHimarsTruck(true);
      setTimeout(() => this.addFloatingText('LEVEL 5: HIMARS SALVO DEPLOYED!', this.player.x, this.player.y - 45, '#eab308'), 600);
    } else if (waveNumber === 6 && !this.player.hasFlakCannon) {
      this.buyFlakCannon(true);
      setTimeout(() => this.addFloatingText('LEVEL 6: DUAL FLAK AA ACTIVE!', this.player.x, this.player.y - 45, '#38bdf8'), 600);
    } else if (waveNumber === 7 && !this.player.hasRadarStation) {
      this.buyRadarStation(true);
      setTimeout(() => this.addFloatingText('LEVEL 7: 3D RADAR STATION ONLINE!', this.player.x, this.player.y - 45, '#10b981'), 600);
    }

    const queue: { type: Aircraft['type'] | 'TANK'; delay: number }[] = [];

    // Boss Wave check
    const isHardMode = this.mode === 'HARD' || this.mode === 'BOTTOMLESS';
    const isBossWave = waveNumber % 3 === 0;

    if (isHardMode) {
      // =========================================================================
      // EXTREME HARD MODE: REAL WARFARE ZONE (হার্ড মুড মহাযুদ্ধ)
      // Multiple Queen Mosquitos, Virus Bio-Titans, Zika Acid Spitters & Kamikazes!
      // =========================================================================
      if (waveNumber === 1) {
        sound.playBossWarning();
        this.bossWarningBanner = {
          text: '⚔️ হার্ড মুড রিয়েল যুদ্ধ শুরু! দ্রুত যুদ্ধাস্ত্র মোতায়েন করুন! ⚔️',
          timer: 3.5,
          alpha: 1,
        };
        queue.push({ type: 'CULEX_MOSQUITO', delay: 0.5 });
        queue.push({ type: 'AEDES_MOSQUITO', delay: 1.4 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 2.4 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 3.5 }); // Virus Kamikaze targeting vehicles!
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 4.8 });   // Virus Acid Spitter!
        queue.push({ type: 'ANOPHELES_MOSQUITO', delay: 6.0 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 7.2 });
      } else if (waveNumber === 2) {
        // QUEEN SCOUT ARRIVES EARLY IN HARD MODE!
        sound.playAirRaidSiren();
        this.screenShake = 10;
        this.bossWarningBanner = {
          text: '⚠️ এয়ার রেইড সতর্কতা: কুইন স্কাউট ও কামিকাজে ভাইরাস আক্রমণ! 👑🦟 ⚠️',
          timer: 4.0,
          alpha: 1,
        };
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 0.8 });
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 1.8 });       // FIRST QUEEN IN WAVE 2!
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 3.2 });
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 4.5 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 5.8 });
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 7.2 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 8.5 });
      } else if (waveNumber === 3) {
        // WAVE 3: TWIN QUEEN BOSSES (জোড়া রানী মশা!)
        sound.playAirRaidSiren();
        sound.playQueenRoar();
        this.screenShake = 16;
        this.bossWarningBanner = {
          text: '🚨 চরম লাল সতর্কতা: জোড়া রানী মশার যৌথ আক্রমণ! (TWIN QUEEN ASSAULT) 👑👑 🚨',
          timer: 5.0,
          alpha: 1,
        };
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 1.0 });       // QUEEN 1!
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 2.2 });       // QUEEN 2!
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 3.5 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 4.8 });
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 6.2 });
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 7.6 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 9.0 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 10.5 });
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 12.0 });
      } else if (waveNumber === 4) {
        // WAVE 4: VIRUS BIO-WARFARE SWARM
        sound.playAirRaidSiren();
        this.screenShake = 12;
        this.bossWarningBanner = {
          text: '☣️ বায়ো-টাইটান ভাইরাস ও এসিড ড্রপ আক্রমণ! যুদ্ধাস্ত্র রক্ষা করুন! ☣️',
          timer: 4.5,
          alpha: 1,
        };
        queue.push({ type: 'VIRUS_BIO_TITAN', delay: 1.2 });      // Giant Acid Virus Titan!
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 2.6 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 3.8 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 4.9 });
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 6.2 });       // Queen mosquito strikes alongside titan!
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 7.8 });
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 9.2 });
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 10.6 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 12.0 });
      } else if (waveNumber === 5) {
        // WAVE 5: DUAL QUEEN + VIRUS BIO-TITAN
        sound.playAirRaidSiren();
        sound.playQueenRoar();
        this.screenShake = 16;
        this.bossWarningBanner = {
          text: '🚨 দ্বৈত কুইন ও বায়ো-টাইটান ধ্বংসযজ্ঞ! (DUAL QUEEN + TITAN) 👑👑☣️ 🚨',
          timer: 5.0,
          alpha: 1,
        };
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 1.0 });
        queue.push({ type: 'VIRUS_BIO_TITAN', delay: 2.0 });
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 3.2 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 4.5 });
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 5.8 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 7.0 });
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 8.5 });
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 10.0 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 11.5 });
      } else if (waveNumber === 6) {
        // WAVE 6: TRIPLE QUEEN ARMADA! (৩টি রানী মশা!)
        sound.playAirRaidSiren();
        sound.playQueenRoar();
        this.screenShake = 20;
        this.bossWarningBanner = {
          text: '🔥 ট্রিপল রানী মশার আর্মাডা ও ভাইরাস সুনামি! (TRIPLE QUEEN ARMADA) 👑👑👑 🔥',
          timer: 5.5,
          alpha: 1,
        };
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 1.0 });       // QUEEN 1
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 2.2 });       // QUEEN 2
        queue.push({ type: 'QUEEN_MOSQUITO', delay: 3.5 });       // QUEEN 3
        queue.push({ type: 'VIRUS_BIO_TITAN', delay: 4.8 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 6.0 });
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 7.2 });
        queue.push({ type: 'CHIKUNGUNYA_MOSQUITO', delay: 8.4 });
        queue.push({ type: 'ZIKA_VIRUS_MOSQUITO', delay: 9.6 });
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 11.0 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 12.2 });
      } else {
        // ENDLESS HARD MODE TOTAL WAR: Continuous Multi-Queen & Virus Swarms!
        sound.playAirRaidSiren();
        this.screenShake = 16;
        const queenCount = Math.min(4, 2 + Math.floor((waveNumber - 6) * 0.4));
        this.bossWarningBanner = {
          text: `🚨 হার্ড মহাযুদ্ধ লেভেল ${waveNumber}: ${queenCount}টি রানী মশা ও ভাইরাস বাহিনী! 👑 🚨`,
          timer: 5.0,
          alpha: 1,
        };

        // Spawn multiple Queens
        let d = 0.8;
        for (let q = 0; q < queenCount; q++) {
          queue.push({ type: 'QUEEN_MOSQUITO', delay: d });
          d += 1.2;
        }

        // Spawn Virus Titans
        queue.push({ type: 'VIRUS_BIO_TITAN', delay: d });
        d += 1.2;

        const enemyCount = Math.min(28, 12 + Math.floor((waveNumber - 6) * 1.5));
        const hardPool: Aircraft['type'][] = [
          'CHIKUNGUNYA_MOSQUITO', 'ZIKA_VIRUS_MOSQUITO', 'BLOODSUCKER_MOSQUITO',
          'TOXIC_MUTANT_MOSQUITO', 'SPEED_MOSQUITO', 'AEDES_MOSQUITO'
        ];

        for (let i = 0; i < enemyCount; i++) {
          const pick = hardPool[Math.floor(Math.random() * hardPool.length)];
          queue.push({ type: pick, delay: d });
          d += Math.max(0.45, 0.95 - (waveNumber * 0.02));
        }
      }
    } else if (isBossWave) {
      // EASY / REGULAR BOSS WAVE (Wave 3, 6, 9... in EASY mode)
      sound.playBossWarning();
      sound.playQueenRoar();
      const bossTier = Math.floor(waveNumber / 3);
      this.bossWarningBanner = {
        text: `⚠️ RED ALERT: TITAN QUEEN MOSQUITO (দৈত্য রানী মশা) TIER ${bossTier} (WAVE ${waveNumber}) ⚠️`,
        timer: 4.5,
        alpha: 1,
      };
      this.screenShake = 12;

      queue.push({ type: 'QUEEN_MOSQUITO', delay: 1.8 });
      queue.push({ type: 'AEDES_MOSQUITO', delay: 3.2 });
      queue.push({ type: 'SPEED_MOSQUITO', delay: 5.2 });
      queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 7.4 });
      queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 9.6 });
      queue.push({ type: 'SPEED_MOSQUITO', delay: 11.5 });
      if (waveNumber >= 6) {
        queue.push({ type: 'AEDES_MOSQUITO', delay: 13.5 });
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 15.0 });
      }
      if (waveNumber >= 9) {
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 16.8 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 18.5 });
      }
    } else {
      // EASY MODE: Relaxed, fun, accessible waves with manageable mosquito pacing
      if (waveNumber === 1) {
        queue.push({ type: 'CULEX_MOSQUITO', delay: 1.2 });
        queue.push({ type: 'AEDES_MOSQUITO', delay: 4.5 });
        queue.push({ type: 'CULEX_MOSQUITO', delay: 8.0 });
      } else if (waveNumber === 2) {
        queue.push({ type: 'ANOPHELES_MOSQUITO', delay: 1.2 });
        queue.push({ type: 'AEDES_MOSQUITO', delay: 4.5 });
        queue.push({ type: 'CULEX_MOSQUITO', delay: 8.0 });
      } else if (waveNumber === 4) {
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 1.5 });
        queue.push({ type: 'AEDES_MOSQUITO', delay: 5.2 });
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 9.0 });
      } else if (waveNumber === 5) {
        queue.push({ type: 'TOXIC_MUTANT_MOSQUITO', delay: 1.5 });
        queue.push({ type: 'BLOODSUCKER_MOSQUITO', delay: 5.5 });
        queue.push({ type: 'SPEED_MOSQUITO', delay: 9.2 });
      } else {
        // Endless Easy Escalation
        const enemyCount = Math.min(12, 4 + Math.floor((waveNumber - 5) * 0.65));
        const pool: Aircraft['type'][] = [
          'CULEX_MOSQUITO', 'AEDES_MOSQUITO', 'ANOPHELES_MOSQUITO', 'BLOODSUCKER_MOSQUITO', 'TOXIC_MUTANT_MOSQUITO'
        ];
        let d = 1.5;
        for (let i = 0; i < enemyCount; i++) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          queue.push({ type: pick, delay: d });
          d += 2.5;
        }
      }
    }

    queue.sort((a, b) => a.delay - b.delay);
    this.waveSpawnQueue = queue;
    this.waveTotalEnemies = queue.length;
    this.isWaveActive = true;
  }

  public shootRocket(overrideAngle?: number, lockedTargetId?: string): boolean {
    if (this.isGameOver) return false;

    const isFrenzy = !!this.player.isFrenzyActive;

    // Check ammo capacity (frenzy grants unlimited ammo)
    if (!isFrenzy && this.player.ammo <= 0) {
      sound.playEmptyAmmo();
      this.addFloatingText('RELOADING!', this.player.x, this.player.y - 30, '#ef4444');
      return false;
    }

    if (!isFrenzy && this.player.reloadProgress < 1) return false;

    const inTunnel = this.player.isInTunnel;
    let aimAng = overrideAngle !== undefined ? overrideAngle : this.player.aimAngle;
    if (inTunnel) {
      // Direct firing upwards through the bunker gun hatch / periscope slits into the sky!
      if (aimAng > -0.25) aimAng = -0.38;
      if (aimAng < -Math.PI + 0.25) aimAng = -Math.PI + 0.38;
    }

    // Always keep player aimAngle and facing strictly aligned with shot
    this.player.aimAngle = aimAng;
    if (Math.cos(aimAng) !== 0) {
      this.player.facing = Math.cos(aimAng) >= 0 ? 1 : -1;
    }

    const spawnX = this.player.x + Math.cos(aimAng) * 22;
    const spawnY = this.player.y - 19 + Math.sin(aimAng) * 22;

    // ----------------------------------------------------
    // WEAPON MODE: ION BUG-ZAPPER CONTINUOUS LASER BEAM
    // ----------------------------------------------------
    if (this.player.weaponMode === 'LASER') {
      sound.playLaserBeam();
      const beamLen = 950;
      const targetX = spawnX + Math.cos(aimAng) * beamLen;
      const targetY = spawnY + Math.sin(aimAng) * beamLen;

      this.laserBeams.push({
        id: nextId(),
        x1: spawnX,
        y1: spawnY,
        x2: targetX,
        y2: targetY,
        color: isFrenzy ? '#facc15' : '#38bdf8',
        alpha: 1,
        life: 0.16,
      });

      // Muzzle sparks
      for (let s = 0; s < 4; s++) {
        this.particles.push({
          id: nextId(),
          x: spawnX,
          y: spawnY,
          vx: Math.cos(aimAng) * 120 + (Math.random() - 0.5) * 60,
          vy: Math.sin(aimAng) * 120 + (Math.random() - 0.5) * 60,
          size: 2.5,
          color: isFrenzy ? '#facc15' : '#38bdf8',
          alpha: 1,
          life: 0.2,
          maxLife: 0.2,
        });
      }

      // 1. Zaps mosquito egg bombs along the beam
      for (let bi = this.bombs.length - 1; bi >= 0; bi--) {
        const bomb = this.bombs[bi];
        const dist = distToSegment({ x: bomb.x, y: bomb.y }, { x: spawnX, y: spawnY }, { x: targetX, y: targetY });
        if (dist < 28) {
          this.bombs.splice(bi, 1);
          this.createEggSplatter(bomb.x, bomb.y, bomb.eggType);
          sound.playEggPop();
          this.stats.eggsDestroyed = (this.stats.eggsDestroyed || 0) + 1;
          this.stats.bombsShotDown++;
          this.player.credits += 25;
          this.addFloatingText('LASER ZAPPED! ⚡', bomb.x, bomb.y - 12, '#38bdf8');
        }
      }

      // 2. Slices through mosquitoes along the beam
      const laserDmg = isFrenzy ? 4.0 : 2.2;
      for (let ai = this.aircrafts.length - 1; ai >= 0; ai--) {
        const ac = this.aircrafts[ai];
        const dist = distToSegment({ x: ac.x, y: ac.y }, { x: spawnX, y: spawnY }, { x: targetX, y: targetY });
        if (dist < 44) {
          ac.health -= laserDmg;
          this.stats.shotsHit++;
          this.particles.push({
            id: nextId(),
            x: ac.x + (Math.random() - 0.5) * 12,
            y: ac.y + (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 90,
            vy: (Math.random() - 0.5) * 90,
            size: 3,
            color: '#38bdf8',
            alpha: 0.9,
            life: 0.25,
            maxLife: 0.25,
          });
          if (ac.health <= 0) {
            this.destroyAircraft(ac, ai);
          } else {
            this.addFloatingText(`-${laserDmg.toFixed(0)}`, ac.x, ac.y - 20, '#38bdf8');
          }
        }
      }

      this.stats.shotsFired++;
      if (!isFrenzy) {
        this.player.ammo--;
        this.player.reloadProgress = 0.35;
      } else {
        this.player.reloadProgress = 0.8;
      }
      return true;
    }

    // ----------------------------------------------------
    // WEAPON MODE: ROCKET OR FLAK
    // ----------------------------------------------------
    if (!isFrenzy) {
      this.player.ammo--;
      this.player.reloadProgress = 0;
    } else {
      this.player.reloadProgress = 0.7; // ultra-fast frenzy burst rate
    }
    this.stats.shotsFired++;

    const isFlak = this.player.weaponMode === 'FLAK';
    if (isFlak) {
      sound.playFlakShot();
    } else {
      sound.playRocketLaunch();
    }

    const isTriple = this.player.activePowerup?.type === 'TRIPLE_ROCKET' || isFrenzy;
    const isHoming = this.player.activePowerup?.type === 'HOMING_MISSILES' || !!lockedTargetId;

    const angles = isTriple 
      ? [aimAng - 0.22, aimAng, aimAng + 0.22] 
      : [aimAng];

    angles.forEach((ang) => {
      const speed = isFlak ? 1000 : 860;
      this.rockets.push({
        id: Math.random().toString(),
        x: spawnX,
        y: spawnY,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        angle: ang,
        speed,
        isHoming,
        targetId: lockedTargetId,
        fromTunnel: inTunnel,
        life: isFlak ? 1.8 : 2.6,
      });
    });

    if (inTunnel) {
      this.addFloatingText('BUNKER SALVO! 💥', this.player.x, this.player.y - 32, '#38bdf8');
      // Bunker muzzle flash & smoke through hatch
      this.particles.push({
        id: Math.random().toString(),
        x: this.player.x,
        y: getTerrainY(this.player.x, this.terrain) - 6,
        vx: 0,
        vy: -45,
        size: 9,
        color: '#fbbf24',
        alpha: 0.9,
        life: 0.3,
        maxLife: 0.3,
      });
    }

    return true;
  }

  // Toggle between Heavy Rocket Launcher, AA Rapid Flak Cannon, and High-Tech Ion Laser
  public toggleWeaponMode(): 'ROCKET' | 'FLAK' | 'LASER' {
    if (this.player.weaponMode === 'ROCKET') {
      this.player.weaponMode = 'FLAK';
    } else if (this.player.weaponMode === 'FLAK') {
      this.player.weaponMode = 'LASER';
    } else {
      this.player.weaponMode = 'ROCKET';
    }
    sound.playEmptyAmmo();
    const modeName = this.player.weaponMode === 'FLAK'
      ? 'AA FLAK CANNON 💥'
      : this.player.weaponMode === 'LASER'
      ? 'ION LASER BEAM ⚡'
      : 'HEAVY ROCKET 🚀';
    this.addFloatingText(modeName, this.player.x, this.player.y - 36, '#38bdf8');
    return this.player.weaponMode;
  }

  // Set weapon mode directly from UI weapon switch
  public setWeaponMode(mode: 'ROCKET' | 'FLAK' | 'LASER'): 'ROCKET' | 'FLAK' | 'LASER' {
    if (this.player.weaponMode === mode) return mode;
    this.player.weaponMode = mode;
    sound.playEmptyAmmo();
    const modeName = mode === 'FLAK'
      ? 'AA FLAK CANNON 💥'
      : mode === 'LASER'
      ? 'ION LASER BEAM ⚡'
      : 'HEAVY ROCKET 🚀';
    this.addFloatingText(modeName, this.player.x, this.player.y - 36, '#38bdf8');
    return mode;
  }

  // Mosquito Extermination Frenzy Mode (মশক নিধন উন্মাদনা / FRENZY OVERDRIVE)
  public triggerFrenzyMode(): boolean {
    if (this.isGameOver) return false;
    this.player.isFrenzyActive = true;
    this.player.frenzyTimer = 7.5; // 7.5 seconds of unlimited rapid fire
    this.player.ammo = this.player.maxAmmo;
    this.player.reloadProgress = 1;
    this.screenShake = 10;
    this.screenFlash = { color: '#fbbf24', alpha: 0.8 };
    sound.playFrenzyActivation();
    this.addFloatingText('🔥 FRENZY OVERDRIVE! (মশক নিধন উন্মাদনা) 🔥', this.player.x, this.player.y - 45, '#fbbf24');
    return true;
  }

  // Instant Boss Summon (রানী মশার সাথে সরাসরি মহাযুদ্ধ)
  public summonQueenBoss(): boolean {
    if (this.isGameOver) return false;
    sound.playBossWarning();
    sound.playQueenRoar();
    this.screenShake = 16;
    this.bossWarningBanner = {
      text: '⚠️ TITAN QUEEN MOSQUITO (দৈত্য রানী মশা) SUMMONED! 👑🩸 ⚠️',
      timer: 4.5,
      alpha: 1,
    };
    this.spawnAircraft('QUEEN_MOSQUITO');
    this.spawnAircraft('SPEED_MOSQUITO');
    this.spawnAircraft('BLOODSUCKER_MOSQUITO');
    this.addFloatingText('👑 QUEEN MOSQUITO ARRIVED! 👑', this.player.x, this.player.y - 50, '#ef4444');
    return true;
  }

  // Extreme Real War Armada Summon (বহু-রানী ও ভাইরাস চরম মহাযুদ্ধ)
  public summonHardWarArmada(): boolean {
    if (this.isGameOver) return false;
    sound.playAirRaidSiren();
    sound.playQueenRoar();
    this.screenShake = 22;
    this.screenFlash = { color: '#ef4444', alpha: 0.9 };
    this.bossWarningBanner = {
      text: '🚨 লাল সতর্কতা: বহু-রানী মশা ও ক্ষতিকর ভাইরাস বায়ো-টাইটানের মহাযুদ্ধ শুরু! 👑👑☣️ 🚨',
      timer: 5.5,
      alpha: 1,
    };
    // Spawn 2 Queen Mosquitos
    this.spawnAircraft('QUEEN_MOSQUITO');
    this.spawnAircraft('QUEEN_MOSQUITO');
    // Spawn Virus Bio-Titan
    this.spawnAircraft('VIRUS_BIO_TITAN');
    // Spawn Zika Acid Spitters
    this.spawnAircraft('ZIKA_VIRUS_MOSQUITO');
    this.spawnAircraft('ZIKA_VIRUS_MOSQUITO');
    // Spawn Chikungunya Kamikaze Viruses
    this.spawnAircraft('CHIKUNGUNYA_MOSQUITO');
    this.spawnAircraft('CHIKUNGUNYA_MOSQUITO');
    this.spawnAircraft('BLOODSUCKER_MOSQUITO');

    this.addFloatingText('🔥 MULTI-QUEEN & VIRUS ARMADA ACTIVE! 🔥', this.player.x, this.player.y - 50, '#ef4444');
    return true;
  }

  // Tactical Dash / Invulnerable Evade Roll
  public performTacticalDash(): boolean {
    if (this.isGameOver || this.player.dashCooldown > 0) return false;

    this.player.isDashing = true;
    this.player.dashTimer = 0.25;
    this.player.dashCooldown = 1.0;
    this.player.vx = this.player.facing * 520;
    sound.playDashSound();
    this.addFloatingText('DODGE ROLL! 💨', this.player.x, this.player.y - 30, '#38bdf8');
    return true;
  }

  // Super Overdrive EMP Orbital Shockwave
  public triggerSuperNuke(): boolean {
    if (this.isGameOver || this.player.rageMeter < 100) return false;

    this.player.rageMeter = 0;
    this.screenShake = 16;
    this.screenFlash = { color: '#38bdf8', alpha: 0.9 };
    sound.playNukeShockwave();

    // 1. Destroy all airborne bombs & cruise missiles
    this.bombs.forEach((b) => this.createExplosion(b.x, b.y, 'medium'));
    this.bombs = [];

    this.cruiseMissiles.forEach((m) => this.createExplosion(m.x, m.y, 'big'));
    this.cruiseMissiles = [];

    // 2. Eliminate hostile paratroopers
    this.enemyParatroopers.forEach((tp) => {
      this.createExplosion(tp.x, tp.y, 'small');
      this.addScore(150, tp.x, tp.y);
    });
    this.enemyParatroopers = [];

    // 3. Heavy damage to all aircraft
    for (let i = this.aircrafts.length - 1; i >= 0; i--) {
      const ac = this.aircrafts[i];
      ac.health -= 8;
      if (ac.health <= 0) {
        this.destroyAircraft(ac, i);
      } else {
        this.createExplosion(ac.x, ac.y, 'big');
      }
    }

    // 4. Heavy damage to hostile ground tanks
    for (let t = this.groundTanks.length - 1; t >= 0; t--) {
      const tank = this.groundTanks[t];
      if (!tank.isFriendly) {
        tank.health -= 4;
        if (tank.health <= 0) {
          this.destroyTank(tank, t);
        } else {
          this.createExplosion(tank.x, tank.y - 10, 'big');
        }
      }
    }

    this.addFloatingText('⚡ EMP ORBITAL BLAST! ⚡', this.player.x, this.player.y - 48, '#38bdf8');
    return true;
  }

  // Combos & Adrenaline Rage building
  public registerHitCombo(type: 'BOMB' | 'AIRCRAFT' | 'PARATROOPER', scoreBase: number, x: number, y: number) {
    this.comboStreak++;
    this.comboTimer = 3.5;
    if (this.comboStreak > this.stats.maxCombo) {
      this.stats.maxCombo = this.comboStreak;
    }
    this.stats.combo = this.comboStreak;

    // Charge Super Rage meter!
    const rageGain = type === 'AIRCRAFT' ? 15 : 8;
    this.player.rageMeter = Math.min(this.player.maxRage, this.player.rageMeter + rageGain);

    let multiplier = 1;
    let badge = '';
    if (this.comboStreak === 2) {
      multiplier = 1.25;
      badge = 'DOUBLE KILL! x2 🔥';
      sound.playComboSting(2);
    } else if (this.comboStreak === 3) {
      multiplier = 1.5;
      badge = 'AIR ACE! x3 ⚡';
      sound.playComboSting(3);
    } else if (this.comboStreak === 4) {
      multiplier = 2.0;
      badge = 'RAMPAGE! x4 💥';
      sound.playComboSting(4);
    } else if (this.comboStreak === 5) {
      multiplier = 2.5;
      badge = 'DOMINATING! x5 👑';
      sound.playComboSting(5);
    } else if (this.comboStreak >= 6) {
      multiplier = 3.0;
      badge = `UNSTOPPABLE! x${this.comboStreak} 🏆`;
      sound.playComboSting(6);
    }

    const earned = Math.floor(scoreBase * multiplier);
    this.addScore(earned, x, y);

    if (badge) {
      this.addFloatingText(badge, x, y - 24, '#fbbf24');
      this.player.credits += this.comboStreak * 15;
    }
  }

  public toggleTunnelCover(): boolean {
    if (this.isGameOver) return false;
    const p = this.player;
    const t = this.terrain.tunnel;
    const startX = t?.startX ?? 280;
    const endX = t?.endX ?? 920;

    if (!p.isInTunnel) {
      // Enter the subterranean bunker!
      if (p.x >= startX - 60 && p.x <= endX + 60) {
        p.isInTunnel = true;
        p.x = Math.max(startX + 18, Math.min(endX - 18, p.x));
        p.y = getTunnelFloorY(p.x, this.terrain);
        p.vy = 0;
        sound.playJump();
        this.screenShake = 2;
        this.addFloatingText('IN BUNKER COVER! 🛡️ (সুবিশাল বাঙ্কারে আশ্রয়)', p.x, p.y - 30, '#38bdf8');
        return true;
      } else {
        // Vault player into closest entrance ladder!
        const targetX = p.x < startX ? (t?.leftEntranceX ?? 310) : (t?.rightEntranceX ?? 890);
        p.x = targetX;
        p.isInTunnel = true;
        p.y = getTunnelFloorY(p.x, this.terrain);
        p.vy = 0;
        sound.playJump();
        this.addFloatingText('VAULTED INTO BUNKER! 🛡️', p.x, p.y - 30, '#38bdf8');
        return true;
      }
    } else {
      // Exit tunnel onto surface hill!
      p.isInTunnel = false;
      p.y = getTerrainY(p.x, this.terrain) - 6;
      p.vy = -320;
      sound.playJump();
      this.addFloatingText('SURFACE DEPLOYED! ⚔️', p.x, p.y - 30, '#22c55e');
      return true;
    }
  }

  public jump() {
    if (this.isGameOver) return;
    if (this.player.isInTunnel) {
      const p = this.player;
      const t = this.terrain.tunnel;
      const nearLeft = Math.abs(p.x - (t?.leftEntranceX ?? 310)) < 36;
      const nearRight = Math.abs(p.x - (t?.rightEntranceX ?? 890)) < 36;
      const nearHatch = Math.abs(p.x - (t?.hatchOpeningX ?? 600)) < 42;

      if (nearLeft || nearRight || nearHatch) {
        p.isInTunnel = false;
        p.y = getTerrainY(p.x, this.terrain) - 6;
        p.vy = -350;
        sound.playJump();
        this.addFloatingText('SURFACE LEAP! 🪜', p.x, p.y - 25, '#22c55e');
        return;
      } else {
        sound.playJump();
        this.addFloatingText('MOVE TO LADDER 🪜 TO CLIMB OUT', p.x, p.y - 25, '#fbbf24');
        return;
      }
    }

    if (this.player.isGrounded || this.player.jumpsRemaining > 0) {
      const jumpPower = this.player.activePowerup?.type === 'MULTI_JUMP' ? -410 : -365;
      this.player.vy = jumpPower;
      this.player.isGrounded = false;
      this.player.jumpsRemaining--;
      sound.playJump();
    }
  }

  public setKeyMovement(direction: number) {
    this.keyDirection = direction;
  }

  public setTouchMovement(direction: number) {
    this.touchDirection = direction;
  }

  public movePlayer(direction: number) {
    this.setKeyMovement(direction);
  }

  // Shop purchase & deployment actions (Each support vehicle operates for 60 seconds)
  public buyAutoLauncher(grantFree = false): boolean {
    const cost = 350;
    if (grantFree || this.player.credits >= cost || this.currentWave >= 2) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;
      
      this.player.hasAutoLauncher = true;
      const turretX = this.terrain.width * 0.28;
      
      if (this.autoTurret) {
        // Extend duration and repair if already active
        this.autoTurret.duration += 60;
        this.autoTurret.health = this.autoTurret.maxHealth;
        this.autoTurret.ammo = this.autoTurret.maxAmmo;
        this.player.autoLauncherTimeRemaining = this.autoTurret.duration;
        this.addFloatingText('+60s SAM EXTENDED & REPAIRED!', turretX, this.autoTurret.y - 35, '#22c55e');
      } else {
        this.autoTurret = {
          x: turretX,
          y: getTerrainY(turretX, this.terrain),
          angle: -Math.PI / 4,
          cooldown: 0,
          ammo: 6,
          maxAmmo: 6,
          reloadTimer: 0,
          targetId: null,
          level: 1,
          duration: 60, // 1 minute active battlefield combat
          maxDuration: 60,
          health: 8,
          maxHealth: 8,
        };
        this.player.autoLauncherTimeRemaining = 60;
        sound.playCratePickup();
        this.addFloatingText('AUTO SAM DEPLOYED (60s)!', this.player.x, this.player.y - 35, '#22c55e');
      }
      return true;
    }
    return false;
  }

  public buyFriendlyTank(grantFree = false): boolean {
    const cost = 450;
    if (grantFree || this.player.credits >= cost || this.currentWave >= 3) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;
      
      this.player.hasFriendlyTank = true;
      const tankX = Math.max(80, this.player.x - 120);

      if (this.friendlyTank) {
        this.friendlyTank.duration = (this.friendlyTank.duration || 60) + 60;
        this.friendlyTank.health = this.friendlyTank.maxHealth ?? 12;
        this.player.friendlyTankTimeRemaining = this.friendlyTank.duration;
        this.addFloatingText('+60s TANK EXTENDED & REPAIRED!', this.friendlyTank.x, this.friendlyTank.y - 35, '#38bdf8');
      } else {
        this.friendlyTank = {
          id: 'friendly-tank-1',
          x: tankX,
          y: getTerrainY(tankX, this.terrain),
          vx: 40,
          direction: 1,
          health: 12,
          maxHealth: 12,
          cannonCooldown: 1.5,
          turretAngle: -Math.PI / 4,
          width: 72,
          height: 26,
          isFriendly: true,
          duration: 60, // 1 minute active battlefield combat
          maxDuration: 60,
        };
        this.player.friendlyTankTimeRemaining = 60;
        sound.playCratePickup();
        this.addFloatingText('ALLIED TANK DEPLOYED (60s)!', this.player.x, this.player.y - 35, '#38bdf8');
      }
      return true;
    }
    return false;
  }

  public buyFriendlyDrone(grantFree = false): boolean {
    const cost = 400;
    if (grantFree || this.player.credits >= cost || this.currentWave >= 4) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;
      
      this.player.hasFriendlyDrone = true;

      if (this.friendlyDrone) {
        this.friendlyDrone.duration = (this.friendlyDrone.duration || 60) + 60;
        this.friendlyDrone.health = this.friendlyDrone.maxHealth;
        this.player.friendlyDroneTimeRemaining = this.friendlyDrone.duration;
        this.addFloatingText('+60s DRONE EXTENDED & REPAIRED!', this.friendlyDrone.x, this.friendlyDrone.y - 35, '#a855f7');
      } else {
        this.friendlyDrone = {
          id: 'friendly-drone-1',
          x: this.player.x,
          y: this.player.y - 90,
          vx: 0,
          vy: 0,
          targetAngle: -Math.PI / 4,
          shootCooldown: 0,
          ammo: 15,
          maxAmmo: 15,
          reloadTimer: 0,
          duration: 60, // 1 minute active battlefield combat
          maxDuration: 60,
          health: 6,
          maxHealth: 6,
        };
        this.player.friendlyDroneTimeRemaining = 60;
        sound.playCratePickup();
        this.addFloatingText('GUARDIAN DRONE DEPLOYED (60s)!', this.player.x, this.player.y - 35, '#a855f7');
      }
      return true;
    }
    return false;
  }

  public buyHimarsTruck(grantFree = false): boolean {
    const cost = 300;
    if (grantFree || this.player.credits >= cost || this.currentWave >= 5) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;

      this.player.hasHimarsTruck = true;
      const himarsX = this.terrain.width * 0.72;

      if (this.himarsTruck) {
        this.himarsTruck.duration = (this.himarsTruck.duration || 60) + 60;
        this.himarsTruck.health = this.himarsTruck.maxHealth;
        this.player.himarsTruckTimeRemaining = this.himarsTruck.duration;
        this.himarsTruck.ammo = this.himarsTruck.maxAmmo;
        this.addFloatingText('+60s HIMARS EXTENDED & REPAIRED!', this.himarsTruck.x, this.himarsTruck.y - 35, '#eab308');
      } else {
        this.himarsTruck = {
          id: 'himars-1',
          x: himarsX,
          y: getTerrainY(himarsX, this.terrain),
          angle: -Math.PI / 3,
          ammo: 6,
          maxAmmo: 6,
          salvoCooldown: 0.5,
          burstCount: 0,
          burstTimer: 0,
          targetId: null,
          duration: 60,
          maxDuration: 60,
          health: 8,
          maxHealth: 8,
        };
        this.player.himarsTruckTimeRemaining = 60;
        sound.playCratePickup();
        this.addFloatingText('HIMARS SALVO TRUCK DEPLOYED (60s)! 🚀', this.player.x, this.player.y - 35, '#eab308');
      }
      return true;
    }
    return false;
  }

  public buyFlakCannon(grantFree = false): boolean {
    const cost = 250;
    if (grantFree || this.player.credits >= cost || this.currentWave >= 6) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;

      this.player.hasFlakCannon = true;
      const flakX = this.terrain.width * 0.40;

      if (this.flakCannon) {
        this.flakCannon.duration = (this.flakCannon.duration || 60) + 60;
        this.flakCannon.health = this.flakCannon.maxHealth;
        this.player.flakCannonTimeRemaining = this.flakCannon.duration;
        this.addFloatingText('+60s DUAL FLAK EXTENDED & REPAIRED!', this.flakCannon.x, this.flakCannon.y - 35, '#38bdf8');
      } else {
        this.flakCannon = {
          id: 'flak-cannon-1',
          x: flakX,
          y: getTerrainY(flakX, this.terrain),
          vx: 40,
          direction: 1,
          angle: -Math.PI / 4,
          cooldown: 0,
          barrelIndex: 0,
          duration: 60,
          maxDuration: 60,
          health: 8,
          maxHealth: 8,
        };
        this.player.flakCannonTimeRemaining = 60;
        sound.playCratePickup();
        this.addFloatingText('DUAL FLAK AA DEPLOYED (60s)! 💥', this.player.x, this.player.y - 35, '#38bdf8');
      }
      return true;
    }
    return false;
  }

  public buyRadarStation(grantFree = false): boolean {
    const cost = 200;
    if (grantFree || this.player.credits >= cost || this.currentWave >= 7) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;

      this.player.hasRadarStation = true;
      const radarX = this.terrain.width * 0.15;

      if (this.radarStation) {
        this.radarStation.duration = (this.radarStation.duration || 60) + 60;
        this.radarStation.health = this.radarStation.maxHealth;
        this.player.radarStationTimeRemaining = this.radarStation.duration;
        this.addFloatingText('+60s RADAR EXTENDED & REPAIRED!', this.radarStation.x, this.radarStation.y - 35, '#10b981');
      } else {
        this.radarStation = {
          id: 'radar-1',
          x: radarX,
          y: getTerrainY(radarX, this.terrain),
          dishAngle: 0,
          pulseTimer: 1.0,
          pulseWaves: [],
          duration: 60,
          maxDuration: 60,
          health: 8,
          maxHealth: 8,
        };
        this.player.radarStationTimeRemaining = 60;
        sound.playCratePickup();
        this.addFloatingText('3D RADAR STATION ONLINE (60s)! 📡', this.player.x, this.player.y - 35, '#10b981');
      }
      return true;
    }
    return false;
  }

  public deployAllArsenal(grantFree = false): boolean {
    const cost = 500;
    if (grantFree || this.player.credits >= cost) {
      if (!grantFree && this.player.credits >= cost) this.player.credits -= cost;

      this.buyAutoLauncher(true);
      this.buyFriendlyTank(true);
      this.buyFriendlyDrone(true);
      this.buyHimarsTruck(true);
      this.buyFlakCannon(true);
      this.buyRadarStation(true);

      sound.playCratePickup();
      this.screenShake = 8;
      this.addFloatingText('💥 ALL 6 WAR MACHINES DEPLOYED! (সব যুদ্ধাস্ত্র মোতায়েন) 🚀', this.player.x, this.player.y - 48, '#fbbf24');
      return true;
    }
    return false;
  }

  // High-Voltage Electric Tesla Zapper Arc ($180) - ইলেকট্রিক ব্যাট ও টেসলা শক
  public triggerElectricZapper(): boolean {
    const cost = 180;
    if (this.player.credits < cost) return false;
    this.player.credits -= cost;

    sound.playElectricZapper();
    this.screenShake = 7;
    this.screenFlash = { color: '#38bdf8', alpha: 0.7 };

    let prevX = this.player.x;
    let prevY = this.player.y - 20;
    let hitCount = 0;

    for (let i = this.aircrafts.length - 1; i >= 0; i--) {
      const ac = this.aircrafts[i];
      const d = Math.hypot(ac.x - prevX, ac.y - prevY);
      if (d < 580 && hitCount < 8) {
        this.electricArcs.push({
          x1: prevX,
          y1: prevY,
          x2: ac.x,
          y2: ac.y,
          alpha: 1,
          life: 0.35,
        });

        // Electric explosion sparks
        for (let p = 0; p < 8; p++) {
          this.particles.push({
            id: nextId(),
            x: ac.x,
            y: ac.y,
            vx: (Math.random() - 0.5) * 160,
            vy: (Math.random() - 0.5) * 160,
            size: 3,
            color: '#38bdf8',
            alpha: 1,
            life: 0.3,
            maxLife: 0.3,
          });
        }

        ac.health -= 6;
        hitCount++;
        this.stats.shotsHit++;
        if (ac.health <= 0) {
          this.destroyAircraft(ac, i);
        }

        prevX = ac.x;
        prevY = ac.y;
      }
    }

    this.addFloatingText('⚡ TESLA ZAPPER! ⚡', this.player.x, this.player.y - 35, '#38bdf8');
    return true;
  }

  // Municipal Aerosol Fogger Chemical Smoke Truck ($200) - মশক নিধন ফগার স্প্রে ধোঁয়া
  public triggerChemicalFogger(): boolean {
    const cost = 200;
    if (this.player.credits < cost) return false;
    this.player.credits -= cost;

    sound.playFoggerSpray();
    sound.playCratePickup();
    this.addFloatingText('💨 MUNICIPAL FOGGER CHEMICAL MIST! 💨', this.player.x, this.player.y - 38, '#22c55e');

    // Deploy dense clouds of white insecticide fog along the hills
    for (let c = 0; c < 14; c++) {
      const sx = (c / 13) * this.terrain.width;
      this.chemicalSmokes.push({
        id: nextId(),
        x: sx,
        y: getTerrainY(sx, this.terrain) - 25,
        vx: (Math.random() - 0.5) * 30,
        vy: -15 - Math.random() * 20,
        radius: 40,
        maxRadius: 85,
        alpha: 0.85,
        life: 14,
        maxLife: 14,
      });
    }
    return true;
  }

  // Arcade Achievements & Battle Trophy Badges
  public unlockBadge(id: string, title: string, subtitle: string, icon: string, reward: number) {
    if (this.unlockedBadges.has(id)) return;
    this.unlockedBadges.add(id);

    this.player.credits += reward;
    sound.playBadgeUnlock();

    this.activeBadges.push({
      id,
      title,
      subtitle,
      icon,
      reward,
      timer: 3.5,
      alpha: 1,
    });
  }

  public checkAchievements() {
    if (this.stats.mosquitoesDestroyed >= 1 && !this.unlockedBadges.has('FIRST_BLOOD')) {
      this.unlockBadge('FIRST_BLOOD', 'FIRST BLOOD! 🩸', 'প্রথম মশা ধ্বংস!', '🦟', 100);
    }
    if (this.stats.mosquitoesDestroyed >= 10 && !this.unlockedBadges.has('SLAYER_10')) {
      this.unlockBadge('SLAYER_10', 'MOSQUITO SLAYER! ⚔️', '১০টি মশা নির্মূল!', '🦟', 200);
    }
    if (this.stats.eggsDestroyed >= 8 && !this.unlockedBadges.has('EGG_HUNTER')) {
      this.unlockBadge('EGG_HUNTER', 'EGG CRUSHER! 🥚', '৮টি ডিম বোমা ধ্বংস!', '💥', 250);
    }
    if (this.stats.bossesDefeated >= 1 && !this.unlockedBadges.has('QUEEN_SLAYER')) {
      this.unlockBadge('QUEEN_SLAYER', 'QUEEN SLAYER! 👑', 'দৈত্য রানী মশা পরাস্ত!', '🏆', 500);
    }
    if (this.comboStreak >= 5 && !this.unlockedBadges.has('COMBO_5')) {
      this.unlockBadge('COMBO_5', 'COMBO ACE x5! 🔥', 'ধারাবাহিক ৫টি নিখুঁত নিশানা!', '⭐', 300);
    }
    if (this.player.isInTunnel && !this.unlockedBadges.has('BUNKER_DEFENDER')) {
      this.unlockBadge('BUNKER_DEFENDER', 'BUNKER DEFENDER! 🛡️', 'টানেল বাঙ্কার সুরক্ষা সক্রিয়!', '🏰', 150);
    }
  }

  public triggerAirStrike() {
    sound.playExplosion('big');
    this.screenShake = 16;
    this.addFloatingText('AIR STRIKE INCOMING! 💥', this.player.x, this.player.y - 40, '#ef4444');

    // Destroy all airborne aircraft on screen
    for (let i = this.aircrafts.length - 1; i >= 0; i--) {
      const a = this.aircrafts[i];
      this.destroyAircraft(a, i);
    }
    // Intercept all falling bombs
    for (let b = this.bombs.length - 1; b >= 0; b--) {
      const bomb = this.bombs[b];
      this.createExplosion(bomb.x, bomb.y, 'medium');
      this.bombs.splice(b, 1);
    }
    // Intercept cruise missiles
    this.cruiseMissiles.forEach((m) => this.createExplosion(m.x, m.y, 'big'));
    this.cruiseMissiles = [];
    // Wipe enemy paratroopers
    this.enemyParatroopers.forEach((tp) => this.createExplosion(tp.x, tp.y, 'small'));
    this.enemyParatroopers = [];
    // Wipe hostile ground tanks
    for (let t = this.groundTanks.length - 1; t >= 0; t--) {
      if (!this.groundTanks[t].isFriendly) {
        this.destroyTank(this.groundTanks[t], t);
      }
    }
  }

  public buyAmmoUpgrade(): boolean {
    const cost = 250;
    if (this.player.credits >= cost && this.player.maxAmmo < 12) {
      this.player.credits -= cost;
      this.player.maxAmmo += 2;
      this.player.ammo = this.player.maxAmmo;
      sound.playCratePickup();
      this.addFloatingText('+2 MAX AMMO!', this.player.x, this.player.y - 35, '#38bdf8');
      return true;
    }
    return false;
  }

  public buyFastReload(): boolean {
    const cost = 200;
    if (this.player.credits >= cost && this.player.ammoRecoverRate > 0.6) {
      this.player.credits -= cost;
      this.player.ammoRecoverRate = Math.max(0.5, this.player.ammoRecoverRate - 0.25);
      sound.playCratePickup();
      this.addFloatingText('FAST RECOVERY!', this.player.x, this.player.y - 35, '#f59e0b');
      return true;
    }
    return false;
  }

  public buyHealthRepair(): boolean {
    const cost = 120;
    if (this.player.credits >= cost && this.player.health < this.player.maxHealth) {
      this.player.credits -= cost;
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
      sound.playCratePickup();
      this.addFloatingText('+50 HP REPAIRED!', this.player.x, this.player.y - 35, '#22c55e');
      return true;
    }
    return false;
  }

  public update(dt: number) {
    if (this.isGameOver) return;

    // Buttery smooth clamped delta-time to eliminate frame jitter
    const clampedDt = Math.min(0.033, Math.max(0.001, dt));

    // 1. Water-like silky continuous movement with fluid inertia and exponential smoothing
    const moveDir = this.touchDirection !== 0 ? this.touchDirection : this.keyDirection;
    const targetVx = moveDir * 235;
    const smoothRate = moveDir !== 0 ? 16 : 14;
    const factor = 1 - Math.exp(-smoothRate * clampedDt);
    this.player.vx += (targetVx - this.player.vx) * factor;
    if (Math.abs(this.player.vx) < 0.5 && moveDir === 0) {
      this.player.vx = 0;
    }

    if (Math.abs(this.player.vx) > 5) {
      this.player.walkTimer += clampedDt;
      this.player.walkFrame = this.player.walkTimer * 10;
      this.player.facing = this.player.vx > 0 ? 1 : -1;
    } else {
      this.player.walkTimer = 0;
    }

    // 2. Automatic Ammo Recovery Loop (Rockets recover one by one, 60% faster inside tunnel bunker!)
    if (this.player.ammo < this.player.maxAmmo) {
      const tunnelBonus = this.player.isInTunnel ? 1.6 : 1.0;
      this.player.ammoRecoverTimer += clampedDt * tunnelBonus;
      if (this.player.ammoRecoverTimer >= this.player.ammoRecoverRate) {
        this.player.ammo++;
        this.player.ammoRecoverTimer = 0;
      }
    } else {
      this.player.ammoRecoverTimer = 0;
    }

    // Easy Mode passive health regeneration loop (ইজি মুড সহজ ও আনন্দদায়ক)
    if (this.mode === 'EASY' && this.player.health < this.player.maxHealth) {
      this.easyRegenTimer += clampedDt;
      if (this.easyRegenTimer >= 2.5) {
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 2);
        this.easyRegenTimer = 0;
      }
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - clampedDt * 16);
    }

    if (this.waveAnnounceTimer > 0) {
      this.waveAnnounceTimer -= clampedDt;
    }

    // Update touch ripples
    for (let i = this.touchRipples.length - 1; i >= 0; i--) {
      const r = this.touchRipples[i];
      r.radius += clampedDt * 45;
      r.alpha -= clampedDt * 1.8;
      if (r.alpha <= 0) {
        this.touchRipples.splice(i, 1);
      }
    }

    // Update Ion Laser Beams
    for (let li = this.laserBeams.length - 1; li >= 0; li--) {
      const beam = this.laserBeams[li];
      beam.life -= clampedDt;
      beam.alpha = Math.max(0, beam.life / 0.16);
      if (beam.life <= 0) {
        this.laserBeams.splice(li, 1);
      }
    }

    // Update Extermination Frenzy Mode
    if (this.player.isFrenzyActive) {
      this.player.frenzyTimer = (this.player.frenzyTimer || 0) - clampedDt;
      if (this.player.frenzyTimer <= 0) {
        this.player.isFrenzyActive = false;
        this.addFloatingText('FRENZY OVERDRIVE ENDED! 💨', this.player.x, this.player.y - 30, '#94a3b8');
      }
    }

    // Update clouds
    this.clouds.forEach((cloud) => {
      cloud.x += cloud.speed * clampedDt;
      if (cloud.x > this.terrain.width + 120) {
        cloud.x = -120;
      }
    });

    // Update Powerup Duration
    if (this.player.activePowerup) {
      this.player.activePowerup.duration -= clampedDt;
      if (this.player.activePowerup.duration <= 0) {
        if (this.player.activePowerup.type === 'MULTI_JUMP') {
          this.player.maxJumps = 1;
        }
        this.player.activePowerup = null;
      }
    }

    // Update Reload Progress (shot delay)
    const reloadSpeed = this.player.activePowerup?.type === 'RAPID_FIRE' ? 6.0 : 3.0;
    if (this.player.reloadProgress < 1) {
      this.player.reloadProgress = Math.min(1, this.player.reloadProgress + clampedDt * reloadSpeed);
    }

    // Update Dash timers & ghost trails
    if (this.player.isDashing) {
      this.player.dashTimer -= clampedDt;
      this.particles.push({
        id: Math.random().toString(),
        x: this.player.x - this.player.facing * 8,
        y: this.player.y - 12,
        vx: 0,
        vy: 0,
        size: 14,
        color: '#38bdf8',
        alpha: 0.45,
        life: 0.2,
        maxLife: 0.2,
      });
      if (this.player.dashTimer <= 0) {
        this.player.isDashing = false;
      }
    }
    if (this.player.dashCooldown > 0) {
      this.player.dashCooldown -= clampedDt;
    }

    // Update Combo streak timer
    if (this.comboTimer > 0) {
      this.comboTimer -= clampedDt;
      if (this.comboTimer <= 0) {
        this.comboStreak = 0;
        this.stats.combo = 0;
      }
    }

    // Update Screen Flash
    if (this.screenFlash) {
      this.screenFlash.alpha -= clampedDt * 2.2;
      if (this.screenFlash.alpha <= 0) {
        this.screenFlash = null;
      }
    }

    // Update Boss Warning Banner
    if (this.bossWarningBanner) {
      this.bossWarningBanner.timer -= clampedDt;
      if (this.bossWarningBanner.timer <= 0) {
        this.bossWarningBanner = null;
      }
    }

    // Update Player Physics
    this.updatePlayerPhysics(clampedDt);

    // Wave spawning (Planes, Drones, Tanks)
    this.updateWaveSpawning(clampedDt);

    // Update Aircrafts (Targeting bombs and machine gun bullets!)
    this.updateAircrafts(clampedDt);

    // Update Enemy Paratroopers
    this.updateEnemyParatroopers(clampedDt);

    // Update Cruise Missiles
    this.updateCruiseMissiles(clampedDt);

    // Update Falling Wreckages
    this.updateFallingWreckage(clampedDt);

    // Update Ground Tanks (Enemy & Friendly)
    this.updateGroundTanks(clampedDt);

    // Update Friendly Tank Support
    this.updateFriendlyTank(clampedDt);

    // Update Automated SAM Turret
    this.updateAutoTurret(clampedDt);

    // Update Friendly Drone Support
    this.updateFriendlyDrone(clampedDt);

    // Update HIMARS Rocket Artillery Truck
    this.updateHimarsTruck(clampedDt);

    // Update Dual Flak Autocannon Mobile Platform
    this.updateFlakCannon(clampedDt);

    // Update 3D Phased-Array Radar Truck
    this.updateRadarStation(clampedDt);

    // Update Enemy Bullets
    this.updateEnemyBullets(clampedDt);

    // Update Corrosive Bio-Acid Blobs
    this.updateAcidBlobs(clampedDt);

    // Update Rockets
    this.updateRockets(clampedDt);

    // Update Bombs
    this.updateBombs(clampedDt);

    // Update Crates
    this.updateCrates(clampedDt);

    // Update Particles
    this.updateParticles(clampedDt);

    // Update floating texts
    this.updateFloatingTexts(clampedDt);

    // Update Rain in Monsoon Weather (ঝড়-বৃষ্টির আবহাওয়া)
    if (this.timeOfDay === 'RAIN') {
      for (let ri = 0; ri < this.rainDrops.length; ri++) {
        const drop = this.rainDrops[ri];
        drop.y += drop.speed * clampedDt;
        drop.x -= 85 * clampedDt;
        if (drop.y > 640) {
          drop.y = -15;
          drop.x = Math.random() * this.terrain.width;
        }
      }

      if (Math.random() < 0.002) {
        this.screenFlash = { color: '#ffffff', alpha: 0.6 };
        sound.playThunder();
        this.screenShake = 5;
      }
    }

    // Update Electric Tesla Zapper Arcs (ইলেকট্রিক ব্যাট ডিসচার্জ)
    for (let ai = this.electricArcs.length - 1; ai >= 0; ai--) {
      const arc = this.electricArcs[ai];
      arc.life -= clampedDt;
      arc.alpha = Math.max(0, arc.life / 0.35);
      if (arc.life <= 0) {
        this.electricArcs.splice(ai, 1);
      }
    }

    // Update Municipal Chemical Fogger Smoke Clouds (মশক নিধন রাসায়নিক ধোঁয়া)
    for (let si = this.chemicalSmokes.length - 1; si >= 0; si--) {
      const fog = this.chemicalSmokes[si];
      fog.life -= clampedDt;
      fog.x += fog.vx * clampedDt;
      fog.y += fog.vy * clampedDt;
      fog.radius = Math.min(fog.maxRadius, fog.radius + clampedDt * 8);
      fog.alpha = Math.max(0, fog.life / fog.maxLife) * 0.75;

      // Chemical smoke dissolves falling eggs and damages diving mosquitoes
      for (let bIdx = this.bombs.length - 1; bIdx >= 0; bIdx--) {
        const b = this.bombs[bIdx];
        if (Math.hypot(b.x - fog.x, b.y - fog.y) < fog.radius) {
          this.bombs.splice(bIdx, 1);
          this.createEggSplatter(b.x, b.y, b.eggType);
          this.stats.eggsDestroyed = (this.stats.eggsDestroyed || 0) + 1;
          this.player.credits += 25;
          this.addFloatingText('FOG DISSOLVED EGG! 💨', b.x, b.y - 12, '#22c55e');
        }
      }

      this.aircrafts.forEach((ac) => {
        if (ac.y > 180 && Math.hypot(ac.x - fog.x, ac.y - fog.y) < fog.radius) {
          ac.health -= clampedDt * 3.5;
        }
      });

      if (fog.life <= 0) {
        this.chemicalSmokes.splice(si, 1);
      }
    }

    // Update Arcade Achievements Badges (অর্জন ও মেডেল)
    for (let bi = this.activeBadges.length - 1; bi >= 0; bi--) {
      const badge = this.activeBadges[bi];
      badge.timer -= clampedDt;
      badge.alpha = Math.min(1, badge.timer / 0.6);
      if (badge.timer <= 0) {
        this.activeBadges.splice(bi, 1);
      }
    }

    this.checkAchievements();

    // Check Wave Completion (Considers only hostile enemies so friendly tanks don't block progression)
    const hasHostileEnemies =
      this.aircrafts.length > 0 ||
      this.groundTanks.some((t) => !t.isFriendly) ||
      this.enemyParatroopers.length > 0 ||
      this.cruiseMissiles.length > 0;

    if (this.isWaveActive && this.waveSpawnQueue.length === 0 && !hasHostileEnemies) {
      this.waveClearTimer += clampedDt;
      if (this.waveClearTimer > 1.6) {
        this.waveClearTimer = 0;
        this.startWave(this.currentWave + 1);
      }
    } else {
      this.waveClearTimer = 0;
    }

    // Safety watchdog: If wave queue is empty, all aircraft are destroyed, but some hostile ground enemy is alive for >18s,
    // auto-destroy lingering hostile ground enemies so the game is ALWAYS unlimited and never freezes!
    if (this.isWaveActive && this.waveSpawnQueue.length === 0 && this.aircrafts.length === 0 && hasHostileEnemies) {
      this.waveStuckSafetyTimer += clampedDt;
      if (this.waveStuckSafetyTimer > 18) {
        for (let t = this.groundTanks.length - 1; t >= 0; t--) {
          if (!this.groundTanks[t].isFriendly) {
            this.destroyTank(this.groundTanks[t], t);
          }
        }
        this.enemyParatroopers = [];
        this.cruiseMissiles = [];
        this.waveStuckSafetyTimer = 0;
      }
    } else {
      this.waveStuckSafetyTimer = 0;
    }

    // Gift/airdrop crates removed per user request ("গিফট বাদ দাও")
  }

  private updatePlayerPhysics(dt: number) {
    const p = this.player;

    if (p.isInTunnel) {
      // Confined underground within expanded bunker tunnel corridor (280 to 920)
      const t = this.terrain.tunnel;
      const minX = (t?.startX ?? 280) + 14;
      const maxX = (t?.endX ?? 920) - 14;

      p.x += p.vx * dt;
      p.x = Math.max(minX, Math.min(maxX, p.x));

      const tunnelFloorY = getTunnelFloorY(p.x, this.terrain);
      p.y = tunnelFloorY;
      p.vy = 0;
      p.isGrounded = true;
      p.jumpsRemaining = p.maxJumps;
      return;
    }

    p.x += p.vx * dt;
    p.x = Math.max(20, Math.min(this.terrain.width - 20, p.x));

    p.vy += 650 * dt;
    p.y += p.vy * dt;

    const groundY = getTerrainY(p.x, this.terrain);
    if (p.isGrounded && Math.abs(p.y - groundY) < 18 && p.vy >= 0) {
      // Water-like smooth terrain slope adhesion
      p.y += (groundY - p.y) * Math.min(1, dt * 32);
      p.vy = 0;
    } else if (p.y >= groundY) {
      p.y = groundY;
      p.vy = 0;
      p.isGrounded = true;
      p.jumpsRemaining = p.maxJumps;
    } else {
      p.isGrounded = false;
    }
  }

  private updateWaveSpawning(dt: number) {
    if (this.waveSpawnQueue.length === 0) return;

    for (let i = this.waveSpawnQueue.length - 1; i >= 0; i--) {
      const item = this.waveSpawnQueue[i];
      item.delay -= dt;
      if (item.delay <= 0) {
        if (item.type === 'TANK') {
          this.spawnGroundTank();
        } else {
          this.spawnAircraft(item.type);
        }
        this.waveSpawnQueue.splice(i, 1);
      }
    }
  }

  private spawnGroundTank() {
    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -60 : this.terrain.width + 60;
    const direction = fromLeft ? 1 : -1;
    const hp = Math.min(6, 3 + Math.floor(this.currentWave * 0.25));

    this.groundTanks.push({
      id: Math.random().toString(),
      x: startX,
      y: getTerrainY(startX, this.terrain),
      vx: direction * 50,
      direction,
      health: hp,
      maxHealth: hp,
      cannonCooldown: 2.2,
      turretAngle: -Math.PI / 4,
      width: 105,
      height: 38,
      isFriendly: false, // HOSTILE ENEMY PANZER TANK!
    });
    sound.playBossWarning();
    this.addFloatingText('⚠️ ENEMY PANZER INCOMING!', startX + direction * 50, getTerrainY(startX, this.terrain) - 30, '#ef4444');
  }

  private spawnAircraft(type: Aircraft['type']) {
    const fromLeft = Math.random() > 0.5;
    const direction = fromLeft ? 1 : -1;
    const startX = fromLeft ? -100 : this.terrain.width + 100;

    let y = 80;
    let speed = 90;
    let health = 1;
    let width = 75;
    let height = 45;
    let scoreValue = 100;
    let dropCooldown = 2.2;
    let gunCooldown = 99;
    let wingFlapSpeed = 32;
    let mosquitoNameBn = 'মশা';

    if (type === 'AEDES_MOSQUITO') {
      y = 75 + Math.random() * 65;
      speed = 105;
      health = 1;
      scoreValue = 150;
      width = 75;
      height = 45;
      dropCooldown = 2.0 + Math.random() * 1.2;
      wingFlapSpeed = 36;
      mosquitoNameBn = 'এডিস মশা (ডেঙ্গু)';
    } else if (type === 'CULEX_MOSQUITO') {
      y = 90 + Math.random() * 55;
      speed = 80;
      health = 1;
      scoreValue = 100;
      width = 70;
      height = 42;
      dropCooldown = 2.5 + Math.random() * 1.4;
      wingFlapSpeed = 28;
      mosquitoNameBn = 'কিউলেক্স মশা';
    } else if (type === 'ANOPHELES_MOSQUITO') {
      y = 80 + Math.random() * 60;
      speed = 95;
      health = 1;
      scoreValue = 160;
      width = 76;
      height = 46;
      dropCooldown = 2.2 + Math.random() * 1.2;
      wingFlapSpeed = 32;
      mosquitoNameBn = 'অ্যানোফিলিস মশা (ম্যালেরিয়া)';
    } else if (type === 'BLOODSUCKER_MOSQUITO') {
      y = 65 + Math.random() * 55;
      speed = 125;
      health = 2;
      scoreValue = 280;
      width = 85;
      height = 52;
      dropCooldown = 1.7 + Math.random() * 1.0;
      wingFlapSpeed = 38;
      mosquitoNameBn = 'রক্তচোষা মশা';
    } else if (type === 'TOXIC_MUTANT_MOSQUITO') {
      y = 70 + Math.random() * 50;
      speed = 85;
      health = 3;
      scoreValue = 350;
      width = 88;
      height = 54;
      dropCooldown = 1.5 + Math.random() * 1.0;
      wingFlapSpeed = 30;
      mosquitoNameBn = 'বিষাক্ত মিউট্যান্ট মশা';
    } else if (type === 'SPEED_MOSQUITO') {
      y = 55 + Math.random() * 55;
      speed = 165;
      health = 1;
      scoreValue = 200;
      width = 65;
      height = 36;
      dropCooldown = 1.4 + Math.random() * 0.8;
      wingFlapSpeed = 50;
      mosquitoNameBn = 'ঝাঁক মশা';
    } else if (type === 'QUEEN_MOSQUITO') {
      y = 75;
      speed = 110; // Energetic, dynamic boss cruising speed
      health = 18 + this.currentWave * 2;
      scoreValue = 1200;
      width = 155;
      height = 92;
      dropCooldown = 1.6;
      gunCooldown = 2.0;
      wingFlapSpeed = 28;
      mosquitoNameBn = 'দৈত্য রানী মশা (কুইন)';
    } else if (type === 'ZIKA_VIRUS_MOSQUITO') {
      y = 70 + Math.random() * 50;
      speed = 120;
      health = 3;
      scoreValue = 350;
      width = 82;
      height = 50;
      dropCooldown = 1.8;
      gunCooldown = 1.8; // fires corrosive bio-acid blobs!
      wingFlapSpeed = 36;
      mosquitoNameBn = 'জিকা ভাইরাস মলা (এসিড স্পিটার)';
    } else if (type === 'CHIKUNGUNYA_MOSQUITO') {
      y = 60 + Math.random() * 60;
      speed = 175; // Fast kamikaze virus dive-bomber!
      health = 2;
      scoreValue = 320;
      width = 78;
      height = 46;
      dropCooldown = 2.0;
      gunCooldown = 99;
      wingFlapSpeed = 46;
      mosquitoNameBn = 'চিকুনগুনিয়া ভাইরাস (কামিকাজে)';
    } else if (type === 'VIRUS_BIO_TITAN') {
      y = 75;
      speed = 85;
      health = 24 + this.currentWave * 3;
      scoreValue = 1600;
      width = 165;
      height = 98;
      dropCooldown = 1.4;
      gunCooldown = 2.2;
      wingFlapSpeed = 26;
      mosquitoNameBn = 'বায়ো-টাইটান ভাইরাস মলা (টাইটান)';
    }

    // Difficulty mode scaling
    if (this.mode === 'EASY') {
      if (type !== 'QUEEN_MOSQUITO' && type !== 'VIRUS_BIO_TITAN') speed *= 0.72;
      else speed *= 0.88;
      dropCooldown *= 1.45;
      if (health > 1 && type !== 'QUEEN_MOSQUITO' && type !== 'VIRUS_BIO_TITAN') health -= 1;
    } else if (this.mode === 'HARD' || this.mode === 'BOTTOMLESS') {
      speed *= 1.3;
      dropCooldown *= 0.7;
      if (type === 'QUEEN_MOSQUITO' || type === 'VIRUS_BIO_TITAN') {
        health = Math.floor(health * 1.4);
      }
    }

    const ac: Aircraft = {
      id: Math.random().toString(),
      type,
      x: startX,
      y,
      vx: direction * speed,
      vy: 0,
      direction,
      health,
      maxHealth: health,
      width,
      height,
      dropBombCooldown: dropCooldown,
      gunCooldown,
      rotorAngle: 0,
      scoreValue,
      scale: 1.8,
      wingFlapPhase: Math.random() * Math.PI * 2,
      wingFlapSpeed,
      bobPhase: Math.random() * Math.PI * 2,
      mosquitoNameBn,
    };

    if (type === 'QUEEN_MOSQUITO') {
      this.activeBoss = ac;
    }

    this.aircrafts.push(ac);
  }

  private updateAircrafts(dt: number) {
    for (let i = this.aircrafts.length - 1; i >= 0; i--) {
      const a = this.aircrafts[i];
      a.wingFlapPhase = (a.wingFlapPhase || 0) + dt * (a.wingFlapSpeed || 32);
      a.bobPhase = (a.bobPhase || 0) + dt * 4.5;

      // Handle slow timer (from radar station EMP microwave pulses)
      if (a.slowTimer && a.slowTimer > 0) {
        a.slowTimer -= dt;
      }
      const slowMultiplier = (a.slowTimer && a.slowTimer > 0) ? 0.6 : 1.0;

      const dxToPlayer = this.player.x - a.x;
      const dyToPlayer = (this.player.y - 18) - a.y;
      const distToPlayer = Math.hypot(dxToPlayer, dyToPlayer);

      if (a.biteCooldown === undefined) {
        a.biteCooldown = a.type === 'QUEEN_MOSQUITO' ? 2.5 : (1.5 + Math.random() * 2.5);
      }
      if (a.originalAltitude === undefined) {
        a.originalAltitude = a.y;
      }
      a.biteCooldown -= dt;

      if (a.type === 'QUEEN_MOSQUITO') {
        this.activeBoss = a;

        // 1. Handle Ground/Roof Stun Recovery State
        if (a.stunTimer && a.stunTimer > 0) {
          a.stunTimer -= dt;
          a.x += (Math.random() - 0.5) * 3;
          if (Math.random() < 0.25) {
            this.particles.push({
              id: nextId(),
              x: a.x + (Math.random() - 0.5) * 40,
              y: a.y - 25,
              vx: (Math.random() - 0.5) * 25,
              vy: -35,
              size: 3,
              color: '#facc15',
              alpha: 1,
              life: 0.3,
              maxLife: 0.3,
            });
          }
          if (a.stunTimer <= 0) {
            a.stunTimer = 0;
            a.y -= 25;
            a.isDivingToBite = false;
            a.biteCooldown = a.isEnraged ? 1.6 : 2.4;
            sound.playQueenRoar();
          }
          continue;
        }

        // 2. Boss Enraged State (HP < 50%)
        if (a.health < a.maxHealth * 0.5 && !a.isEnraged) {
          a.isEnraged = true;
          sound.playQueenRoar();
          this.screenShake = 12;
          this.screenFlash = { color: '#ef4444', alpha: 0.7 };
          this.addFloatingText('⚠️ QUEEN ENRAGED! (রানীর চরম রোষ!) 👑🔥', a.x, a.y - 45, '#ef4444');
          this.spawnAircraft('SPEED_MOSQUITO');
          this.spawnAircraft('SPEED_MOSQUITO');
        }

        // 3. Periodic Summon Swarm Escort
        a.swoopTimer = (a.swoopTimer || 0) + dt;
        const summonInterval = a.isEnraged ? 4.5 : 6.2;
        if (a.swoopTimer > summonInterval) {
          a.swoopTimer = 0;
          if (this.aircrafts.length < 8) {
            this.spawnAircraft('SPEED_MOSQUITO');
            this.addFloatingText('QUEEN SUMMONED ESCORT! 🦟', a.x, a.y - 25, '#c084fc');
          }
        }

        // 4. Drop Targeted Cluster Egg Bombs while Airborne (উড়তে উড়তে ডিম বোমা আক্রমণ)
        a.dropBombCooldown -= dt;
        const eggInterval = a.isEnraged ? 1.2 : 1.8;
        if (a.dropBombCooldown <= 0 && a.x > 50 && a.x < this.terrain.width - 50) {
          this.dropTargetedBomb(a, -24);
          this.dropTargetedBomb(a, 0);
          this.dropTargetedBomb(a, 24);
          a.dropBombCooldown = eggInterval;
        }

        // 5. Dive-to-Bite Attack Preparation & Telegraph (সতর্কবার্তা ও নিশানা)
        if (!a.isDivingToBite && a.biteCooldown <= 0) {
          if (a.biteAttackPrepTimer === undefined || a.biteAttackPrepTimer <= 0) {
            a.biteAttackPrepTimer = 0.45;
            sound.playQueenRoar();
            sound.playBossWarning();
            this.addFloatingText('⚠️ রানী মশা কামড়াতে আসছে! (DIVING TO BITE!) 👑🩸', a.x, a.y - 30, '#ef4444');
          }

          a.biteAttackPrepTimer -= dt;
          a.direction = dxToPlayer >= 0 ? 1 : -1;
          // Telegraph red sparks
          this.particles.push({
            id: nextId(),
            x: a.x + a.direction * 35,
            y: a.y + 10,
            vx: (Math.random() - 0.5) * 30,
            vy: (Math.random() - 0.5) * 30,
            size: 2.5,
            color: '#ef4444',
            alpha: 1,
            life: 0.2,
            maxLife: 0.2,
          });

          if (a.biteAttackPrepTimer <= 0) {
            a.isDivingToBite = true;
            a.biteAttackPrepTimer = 0;
          }
        }

        // 6. Fast Menacing Stinger Dive-To-Bite (মারাত্মক কামড়ের আক্রমণ)
        if (a.isDivingToBite) {
          const diveSpeed = (a.isEnraged ? 370 : 310) * slowMultiplier;
          const diveAngle = Math.atan2(dyToPlayer, dxToPlayer);
          a.vx = Math.cos(diveAngle) * diveSpeed;
          a.vy = Math.sin(diveAngle) * diveSpeed;
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          a.direction = dxToPlayer >= 0 ? 1 : -1;

          // Trailing stinger aura
          this.particles.push({
            id: nextId(),
            x: a.x - a.direction * 15,
            y: a.y,
            vx: -a.vx * 0.1,
            vy: (Math.random() - 0.5) * 20,
            size: 3,
            color: a.isEnraged ? '#ef4444' : '#c084fc',
            alpha: 0.8,
            life: 0.2,
            maxLife: 0.2,
          });

          // Bite collision check with player
          if (distToPlayer < 45) {
            if (this.player.isInTunnel && isCoveredByBunkerRoof(this.player.x, this.terrain)) {
              // Bunker roof stops the Queen's bite strike!
              a.isDivingToBite = false;
              a.stunTimer = 1.3;
              a.biteCooldown = 3.2;
              sound.playMosquitoSquash();
              this.screenShake = 10;
              this.addFloatingText('টানেলের ছাদে রানীর ধাক্কা লাগল! 🛡️ -3HP', a.x, a.y - 25, '#38bdf8');
              this.createMosquitoSplatter(a.x, a.y, 'QUEEN_MOSQUITO');
              a.health -= 3;
              if (a.health <= 0) {
                this.destroyAircraft(a, i);
                continue;
              }
            } else if (this.player.isDashing) {
              // Player rolled away!
              a.isDivingToBite = false;
              a.biteCooldown = a.isEnraged ? 1.6 : 2.2;
              this.addFloatingText('DODGED QUEEN BITE! 💨 (কামড় এড়িয়েছেন)', this.player.x, this.player.y - 30, '#22c55e');
            } else {
              // SUCCESSFUL QUEEN BITE! (মারাত্মক কামড়!)
              const biteDmg = a.isEnraged ? 36 : 28;
              this.damagePlayer(biteDmg);
              sound.playMosquitoBite();
              this.screenShake = 14;
              this.screenFlash = { color: '#ef4444', alpha: 0.65 };
              this.createMosquitoSplatter(a.x, a.y, 'QUEEN_MOSQUITO');
              // Queen sucks blood to heal!
              a.health = Math.min(a.maxHealth, a.health + 3);
              this.addFloatingText('রানী মশার মারাত্মক কামড়! 👑🩸 -' + biteDmg + 'HP (+3HP HEAL)', this.player.x, this.player.y - 35, '#ef4444');
              a.isDivingToBite = false;
              a.biteCooldown = a.isEnraged ? 1.8 : 2.6;
              this.dropTargetedBomb(a, -18);
              this.dropTargetedBomb(a, 18);
            }
          }

          // Also check bite collision with Friendly War Vehicles!
          let hitVehicle = false;
          if (this.friendlyTank && this.player.hasFriendlyTank && Math.hypot(a.x - this.friendlyTank.x, a.y - (this.friendlyTank.y - 12)) < 45) {
            this.damageFriendlyVehicle('TANK', 4.0);
            hitVehicle = true;
          } else if (this.autoTurret && this.player.hasAutoLauncher && Math.hypot(a.x - this.autoTurret.x, a.y - (this.autoTurret.y - 12)) < 40) {
            this.damageFriendlyVehicle('SAM', 4.0);
            hitVehicle = true;
          } else if (this.himarsTruck && this.player.hasHimarsTruck && Math.hypot(a.x - this.himarsTruck.x, a.y - (this.himarsTruck.y - 12)) < 42) {
            this.damageFriendlyVehicle('HIMARS', 4.0);
            hitVehicle = true;
          } else if (this.flakCannon && this.player.hasFlakCannon && Math.hypot(a.x - this.flakCannon.x, a.y - (this.flakCannon.y - 12)) < 40) {
            this.damageFriendlyVehicle('FLAK', 4.0);
            hitVehicle = true;
          } else if (this.radarStation && this.player.hasRadarStation && Math.hypot(a.x - this.radarStation.x, a.y - (this.radarStation.y - 15)) < 42) {
            this.damageFriendlyVehicle('RADAR', 4.0);
            hitVehicle = true;
          } else if (this.friendlyDrone && this.player.hasFriendlyDrone && Math.hypot(a.x - this.friendlyDrone.x, a.y - this.friendlyDrone.y) < 36) {
            this.damageFriendlyVehicle('DRONE', 3.0);
            hitVehicle = true;
          }

          if (hitVehicle) {
            sound.playMosquitoBite();
            this.screenShake = 10;
            a.isDivingToBite = false;
            a.biteCooldown = a.isEnraged ? 1.6 : 2.4;
            a.health = Math.min(a.maxHealth, a.health + 2);
            this.addFloatingText('রানী মশা যুদ্ধাস্ত্রে দংশন করেছে! 👑🩸', a.x, a.y - 30, '#ef4444');
          }

          // Abort dive if touched ground or passed below player
          const groundY = getTerrainY(a.x, this.terrain);
          if (a.y >= groundY - 14 || a.y > this.player.y + 24) {
            a.isDivingToBite = false;
            a.stunTimer = 0.5;
            a.biteCooldown = a.isEnraged ? 1.8 : 2.5;
            sound.playMosquitoSquash();
            this.addFloatingText('রানী মাটিতে ধাক্কা খেল! 💥', a.x, a.y - 20, '#f59e0b');
          }
        } else {
          // 7. Active Dynamic Cruising Flight: Energetic undulating sweep
          const queenSpeed = (a.isEnraged ? 150 : 125) * slowMultiplier;
          if (a.direction === 1 && a.x > this.terrain.width - 110) {
            a.direction = -1;
            a.vx = -queenSpeed;
          } else if (a.direction === -1 && a.x < 110) {
            a.direction = 1;
            a.vx = queenSpeed;
          } else {
            a.vx = a.direction * queenSpeed;
          }

          a.x += a.vx * dt;

          // If recovering from dive, ascend smoothly back to flight altitude
          if (a.y > (a.originalAltitude || 85)) {
            a.y -= (a.isEnraged ? 175 : 140) * dt;
          } else {
            // Majestic sweeping undulating flight path across skies
            a.flightPhase = (a.flightPhase || 0) + dt * 2.2;
            const targetQueenY = (a.originalAltitude || 85) + Math.sin(a.flightPhase) * 58 + Math.cos(a.flightPhase * 0.45) * 28;
            a.y += (targetQueenY - a.y) * Math.min(1, dt * 4.2);
          }
        }
      } else if (a.type === 'VIRUS_BIO_TITAN') {
        // =========================================================================
        // VIRUS BIO-TITAN (বায়ো-টাইটান ভাইরাস মলা - জায়ান্ট এসিড বস)
        // =========================================================================
        const titanSpeed = 85 * slowMultiplier;
        if (a.direction === 1 && a.x > this.terrain.width - 120) {
          a.direction = -1;
          a.vx = -titanSpeed;
        } else if (a.direction === -1 && a.x < 120) {
          a.direction = 1;
          a.vx = titanSpeed;
        } else {
          a.vx = a.direction * titanSpeed;
        }
        a.x += a.vx * dt;
        a.flightPhase = (a.flightPhase || 0) + dt * 1.8;
        a.y = (a.originalAltitude || 80) + Math.sin(a.flightPhase) * 35;

        // Discharges dual corrosive bio-acid blobs aimed at military vehicles
        a.gunCooldown = (a.gunCooldown || 2.2) - dt;
        if (a.gunCooldown <= 0) {
          a.gunCooldown = 2.4;
          sound.playAcidSpit();

          // Target 1: player or tank
          const t1X = this.friendlyTank ? this.friendlyTank.x : this.player.x;
          const t1Y = this.friendlyTank ? this.friendlyTank.y : this.player.y;
          const ang1 = Math.atan2(t1Y - a.y, t1X - a.x);

          this.acidBlobs.push({
            id: nextId(),
            x: a.x - 20,
            y: a.y + 15,
            vx: Math.cos(ang1) * 310,
            vy: Math.sin(ang1) * 310,
            damage: 2.0,
            life: 3.5,
            color: '#84cc16',
            radius: 6.5,
          });

          // Target 2: SAM or Flak or random vehicle
          const t2X = this.autoTurret ? this.autoTurret.x : (this.himarsTruck ? this.himarsTruck.x : this.player.x + 80);
          const t2Y = this.autoTurret ? this.autoTurret.y : (this.himarsTruck ? this.himarsTruck.y : this.player.y);
          const ang2 = Math.atan2(t2Y - a.y, t2X - a.x);

          this.acidBlobs.push({
            id: nextId(),
            x: a.x + 20,
            y: a.y + 15,
            vx: Math.cos(ang2) * 290,
            vy: Math.sin(ang2) * 290,
            damage: 2.0,
            life: 3.5,
            color: '#84cc16',
            radius: 6.5,
          });

          this.addFloatingText('☣️ বায়ো-টাইটান এসিড নিক্ষেপ! ☣️', a.x, a.y - 30, '#84cc16');
        }

        // Drop Mutagen Egg Bombs
        a.dropBombCooldown -= dt;
        if (a.dropBombCooldown <= 0 && a.x > 60 && a.x < this.terrain.width - 60) {
          this.dropTargetedBomb(a, -15);
          this.dropTargetedBomb(a, 15);
          a.dropBombCooldown = 2.0;
        }
      } else if (a.type === 'CHIKUNGUNYA_MOSQUITO') {
        // =========================================================================
        // CHIKUNGUNYA VIRUS MOSQUITO (চিকুনগুনিয়া - কামিকাজে আত্মঘাতী ভাইরাস)
        // Aggressively seeks out friendly vehicles (or player) and self-destructs!
        // =========================================================================
        // Find nearest friendly vehicle
        const activeVehicles: { type: 'TANK' | 'SAM' | 'HIMARS' | 'FLAK' | 'RADAR' | 'DRONE'; x: number; y: number }[] = [];
        if (this.friendlyTank && this.player.hasFriendlyTank) activeVehicles.push({ type: 'TANK', x: this.friendlyTank.x, y: this.friendlyTank.y - 12 });
        if (this.autoTurret && this.player.hasAutoLauncher) activeVehicles.push({ type: 'SAM', x: this.autoTurret.x, y: this.autoTurret.y - 12 });
        if (this.himarsTruck && this.player.hasHimarsTruck) activeVehicles.push({ type: 'HIMARS', x: this.himarsTruck.x, y: this.himarsTruck.y - 12 });
        if (this.flakCannon && this.player.hasFlakCannon) activeVehicles.push({ type: 'FLAK', x: this.flakCannon.x, y: this.flakCannon.y - 12 });
        if (this.radarStation && this.player.hasRadarStation) activeVehicles.push({ type: 'RADAR', x: this.radarStation.x, y: this.radarStation.y - 15 });
        if (this.friendlyDrone && this.player.hasFriendlyDrone) activeVehicles.push({ type: 'DRONE', x: this.friendlyDrone.x, y: this.friendlyDrone.y });

        let targetX = this.player.x;
        let targetY = this.player.y - 16;
        let targetVehicleType: 'TANK' | 'SAM' | 'HIMARS' | 'FLAK' | 'RADAR' | 'DRONE' | null = null;

        if (activeVehicles.length > 0) {
          let closestDist = 999999;
          activeVehicles.forEach((v) => {
            const d = Math.hypot(v.x - a.x, v.y - a.y);
            if (d < closestDist) {
              closestDist = d;
              targetX = v.x;
              targetY = v.y;
              targetVehicleType = v.type;
            }
          });
        }

        const kDx = targetX - a.x;
        const kDy = targetY - a.y;
        const kDist = Math.hypot(kDx, kDy);

        const kamikazeSpeed = 270 * slowMultiplier;
        a.vx = (kDx / (kDist || 1)) * kamikazeSpeed;
        a.vy = (kDy / (kDist || 1)) * kamikazeSpeed;
        a.direction = a.vx >= 0 ? 1 : -1;
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Kamikaze fiery red trail particles
        if (Math.random() < 0.4) {
          this.particles.push({
            id: nextId(),
            x: a.x,
            y: a.y,
            vx: -a.vx * 0.1,
            vy: (Math.random() - 0.5) * 15,
            size: 2.8,
            color: '#dc2626',
            alpha: 0.9,
            life: 0.2,
            maxLife: 0.2,
          });
        }

        // Impact detonation!
        if (kDist < 30) {
          sound.playKamikazeScreech();
          this.createExplosion(a.x, a.y, 'medium');

          if (targetVehicleType) {
            this.damageFriendlyVehicle(targetVehicleType, 3.5);
            this.addFloatingText('💥 কামিকাজে ভাইরাস আত্মঘাতী বিস্ফোরণ!', a.x, a.y - 25, '#ef4444');
          } else {
            this.damagePlayer(25);
            this.addFloatingText('💥 কামিকাজে ভাইরাস বিস্ফোরণ! -25HP', a.x, a.y - 25, '#ef4444');
          }

          this.aircrafts.splice(i, 1);
          continue;
        }
      } else if (a.type === 'ZIKA_VIRUS_MOSQUITO') {
        // =========================================================================
        // ZIKA VIRUS MOSQUITO (জিকা ভাইরাস মলা - সায়ান এসিড স্পিটার)
        // Spits cyan bio-acid globules at military vehicles or player
        // =========================================================================
        a.x += a.vx * slowMultiplier * dt;
        a.y += Math.sin(a.bobPhase) * 18 * dt;

        a.gunCooldown = (a.gunCooldown || 1.8) - dt;
        if (a.gunCooldown <= 0) {
          a.gunCooldown = 2.0 + Math.random() * 0.8;

          // Target nearest vehicle or player
          let targetX = this.player.x;
          let targetY = this.player.y - 14;

          const candidates = [
            this.friendlyTank ? { x: this.friendlyTank.x, y: this.friendlyTank.y } : null,
            this.autoTurret ? { x: this.autoTurret.x, y: this.autoTurret.y } : null,
            this.himarsTruck ? { x: this.himarsTruck.x, y: this.himarsTruck.y } : null,
            this.flakCannon ? { x: this.flakCannon.x, y: this.flakCannon.y } : null,
            this.radarStation ? { x: this.radarStation.x, y: this.radarStation.y } : null,
          ].filter(Boolean) as { x: number; y: number }[];

          if (candidates.length > 0) {
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            targetX = chosen.x;
            targetY = chosen.y - 10;
          }

          const ang = Math.atan2(targetY - a.y, targetX - a.x);
          const acidSpeed = 310;
          sound.playAcidSpit();

          this.acidBlobs.push({
            id: nextId(),
            x: a.x + a.direction * 18,
            y: a.y + 4,
            vx: Math.cos(ang) * acidSpeed,
            vy: Math.sin(ang) * acidSpeed,
            damage: 1.5,
            life: 3.5,
            color: '#06b6d4',
            radius: 5.5,
          });

          this.addFloatingText('🧪 জিকা এসিড স্পিট!', a.x, a.y - 20, '#06b6d4');
        }

        // Also drops occasional egg bombs
        a.dropBombCooldown -= dt;
        if (a.dropBombCooldown <= 0 && a.x > 60 && a.x < this.terrain.width - 60) {
          this.dropTargetedBomb(a);
          a.dropBombCooldown = 2.4;
        }
      } else {
        // ==========================================
        // STANDARD MOSQUITOES FLIGHT & BITE
        // ==========================================
        if (!a.isDivingToBite && a.biteCooldown <= 0 && Math.abs(dxToPlayer) < 220) {
          a.isDivingToBite = true;
          sound.playMosquitoBuzz(1.4);
          this.addFloatingText('মশা ডাইভ দিচ্ছে! 🦟⚠️', a.x, a.y - 15, '#ef4444');
        }

        if (a.isDivingToBite) {
          const diveSpeed = a.type === 'SPEED_MOSQUITO' ? 320 : a.type === 'BLOODSUCKER_MOSQUITO' ? 270 : 210;
          const diveAngle = Math.atan2(dyToPlayer, dxToPlayer);
          a.vx = Math.cos(diveAngle) * diveSpeed;
          a.x += a.vx * slowMultiplier * dt;
          a.y += Math.sin(diveAngle) * diveSpeed * dt;
          a.direction = a.vx >= 0 ? 1 : -1;

          if (distToPlayer < 24) {
            if (this.player.isInTunnel && isCoveredByBunkerRoof(this.player.x, this.terrain)) {
              a.isDivingToBite = false;
              a.biteCooldown = 3.5 + Math.random() * 2.0;
              a.y = a.originalAltitude ?? a.y;
              sound.playMosquitoSquash();
              this.addFloatingText('টানেলের ছাদে ধাক্কা খেল! 🛡️', a.x, a.y - 15, '#38bdf8');
              this.createMosquitoSplatter(a.x, a.y, a.type);
              a.health -= 1;
              if (a.health <= 0) {
                this.destroyAircraft(a, i);
                continue;
              }
            } else if (this.player.isDashing) {
              a.isDivingToBite = false;
              a.biteCooldown = 2.5 + Math.random() * 1.5;
              this.addFloatingText('DODGED BITE! 💨 (মশার কামড় এড়িয়েছেন)', this.player.x, this.player.y - 25, '#22c55e');
            } else {
              const biteDamage = a.type === 'BLOODSUCKER_MOSQUITO' ? 24 : a.type === 'TOXIC_MUTANT_MOSQUITO' ? 20 : 14;
              this.damagePlayer(biteDamage);
              sound.playMosquitoBite();
              this.screenShake = 4;
              this.addFloatingText('মশায় কামড় দিয়েছে! 🩸 -' + biteDamage + 'HP', this.player.x, this.player.y - 30, '#ef4444');
              a.isDivingToBite = false;
              a.biteCooldown = 4.0;
              this.createMosquitoSplatter(a.x, a.y, 'BLOODSUCKER_MOSQUITO');
            }
          }

          const groundY = getTerrainY(a.x, this.terrain);
          if (a.y >= groundY - 12 || a.y > this.player.y + 20) {
            a.isDivingToBite = false;
            a.biteCooldown = 2.8 + Math.random() * 2.0;
          }
        } else {
          a.x += a.vx * slowMultiplier * dt;
          a.y += Math.sin(a.bobPhase) * 16 * dt;
          if (a.originalAltitude !== undefined && a.y > a.originalAltitude) {
            a.y -= 75 * dt;
          }
        }

        // Regular mosquitoes drop egg bombs downwards
        const isApproachingPlayer = (a.vx > 0 && dxToPlayer > -40 && dxToPlayer < 140) ||
                                    (a.vx < 0 && dxToPlayer < 40 && dxToPlayer > -140);
        a.dropBombCooldown -= dt;
        if (a.dropBombCooldown <= 0 && (isApproachingPlayer || Math.random() < 0.35) && a.x > 50 && a.x < this.terrain.width - 50) {
          this.dropTargetedBomb(a);
          a.dropBombCooldown = a.type === 'SPEED_MOSQUITO' ? (1.6 + Math.random() * 1.0) : (2.4 + Math.random() * 1.6);
        }
      }

      if (
        (a.direction === 1 && a.x > this.terrain.width + 100) ||
        (a.direction === -1 && a.x < -100)
      ) {
        if (a.type === 'QUEEN_MOSQUITO' || a.type === 'VIRUS_BIO_TITAN') {
          // Bosses wrap around until destroyed
          a.direction = a.direction === 1 ? -1 : 1;
          a.vx = a.direction * 110;
          continue;
        }
        this.aircrafts.splice(i, 1);
      }
    }
  }

  private dropTargetedBomb(mosquito: Aircraft, xOffset = 0) {
    sound.playEggDrop();
    const dx = this.player.x - (mosquito.x + xOffset);
    const leadVx = mosquito.vx * 0.35 + (dx > 0 ? 12 : -12);

    let eggType: EggType = 'REGULAR';
    let eggDamage = 18;
    let eggScale = 1.0;

    if (mosquito.type === 'AEDES_MOSQUITO') {
      eggType = 'AEDES';
      eggDamage = 22;
    } else if (mosquito.type === 'BLOODSUCKER_MOSQUITO') {
      eggType = 'BLOOD';
      eggDamage = 26;
      eggScale = 1.2;
    } else if (mosquito.type === 'TOXIC_MUTANT_MOSQUITO') {
      eggType = 'TOXIC';
      eggDamage = 24;
    } else if (mosquito.type === 'QUEEN_MOSQUITO') {
      eggType = 'QUEEN';
      eggDamage = 35;
      eggScale = 1.6;
    }

    this.bombs.push({
      id: nextId(),
      x: mosquito.x + xOffset,
      y: mosquito.y + 12,
      vx: leadVx,
      vy: 28,
      rotation: 0,
      scale: eggScale,
      damage: eggDamage,
      eggType,
      health: 1,
      wobble: Math.random() * Math.PI,
      wobbleSpeed: 7 + Math.random() * 5,
    });
  }

  private fireEnemyTracerBurst(aircraft: Aircraft) {
    sound.playMachineGun();
    // Fire stream of 2 tracer bullets targeted towards player!
    const targetX = this.player.x + (Math.random() * 30 - 15);
    const targetY = this.player.y - 15;
    const ang = Math.atan2(targetY - aircraft.y, targetX - aircraft.x);
    const bulletSpeed = 480;

    for (let b = 0; b < 2; b++) {
      this.enemyBullets.push({
        id: nextId(),
        x: aircraft.x + Math.cos(ang) * (18 + b * 20),
        y: aircraft.y + 10 + Math.sin(ang) * (b * 20),
        vx: Math.cos(ang) * bulletSpeed,
        vy: Math.sin(ang) * bulletSpeed,
        damage: 8,
        life: 1.4,
        isTracer: true,
      });
    }
  }

  private updateGroundTanks(dt: number) {
    for (let i = this.groundTanks.length - 1; i >= 0; i--) {
      const tank = this.groundTanks[i];
      tank.x += tank.vx * dt;
      tank.y = getTerrainY(tank.x, this.terrain);

      // Patrol terrain and stay within field
      if (tank.x < 50 && tank.vx < 0) {
        tank.vx = 45;
        tank.direction = 1;
      } else if (tank.x > this.terrain.width - 50 && tank.vx > 0) {
        tank.vx = -45;
        tank.direction = -1;
      }

      if (tank.isFriendly) {
        // TARGET AIRBORNE ENEMY PLANES IN THE SKY
        let targetPlane: Aircraft | null = null;
        let minDist = 999999;
        this.aircrafts.forEach((ac) => {
          const d = Math.hypot(ac.x - tank.x, ac.y - tank.y);
          if (d < minDist) {
            minDist = d;
            targetPlane = ac;
          }
        });

        tank.cannonCooldown -= dt;

        if (targetPlane && minDist < 750) {
          const target = targetPlane as Aircraft;
          const dx = target.x - tank.x;
          const dy = target.y - (tank.y - 14);
          tank.turretAngle = Math.atan2(dy, Math.abs(dx));
          tank.direction = dx >= 0 ? 1 : -1;

          if (tank.cannonCooldown <= 0 && tank.x > 40 && tank.x < this.terrain.width - 40) {
            tank.cannonCooldown = 2.4;
            sound.playTankCannon();
            this.screenShake = 3;

            // Fire heavy anti-aircraft flak shell UPWARDS at the airborne enemy plane!
            const shellAngle = Math.atan2(dy, dx);
            this.rockets.push({
              id: nextId(),
              x: tank.x + Math.cos(shellAngle) * 45,
              y: tank.y - 14 + Math.sin(shellAngle) * 45,
              vx: Math.cos(shellAngle) * 750,
              vy: Math.sin(shellAngle) * 750,
              angle: shellAngle,
              speed: 750,
              isHoming: true,
              targetId: target.id,
              life: 2.5,
            });
          }
        }
      } else {
        // HOSTILE ENEMY PANZER TANK: Target Player and fire mortar / cannon shells!
        const dx = this.player.x - tank.x;
        const dy = (this.player.y - 15) - (tank.y - 14);
        tank.direction = dx >= 0 ? 1 : -1;
        tank.turretAngle = Math.atan2(dy, Math.abs(dx));

        tank.cannonCooldown -= dt;
        if (tank.cannonCooldown <= 0 && Math.abs(dx) < 650 && tank.x > 30 && tank.x < this.terrain.width - 30) {
          tank.cannonCooldown = 2.8 + Math.random() * 0.8;
          sound.playTankCannon();
          this.screenShake = 4;

          // Fire heavy explosive mortar bomb towards player!
          const ang = Math.atan2(dy, dx);
          this.bombs.push({
            id: nextId(),
            x: tank.x + Math.cos(ang) * 40,
            y: tank.y - 14 + Math.sin(ang) * 40,
            vx: Math.cos(ang) * 240,
            vy: Math.sin(ang) * 240 - 75, // mortar arc
            rotation: 0,
            scale: 1.15,
            damage: 22,
          });
        }
      }
    }
  }

  private updateAutoTurret(dt: number) {
    if (!this.autoTurret || !this.player.hasAutoLauncher) return;

    const turret = this.autoTurret;

    // 1-minute battlefield active duration countdown
    turret.duration -= dt;
    this.player.autoLauncherTimeRemaining = Math.max(0, turret.duration);
    if (turret.duration <= 0) {
      // Graceful departure after 60s
      this.addFloatingText('SAM RETRACTED (TIME UP) 💨', turret.x, turret.y - 25, '#f59e0b');
      sound.playExplosion('small');
      for (let s = 0; s < 12; s++) {
        this.particles.push({
          id: nextId(),
          x: turret.x + (Math.random() - 0.5) * 40,
          y: turret.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 50,
          vy: -Math.random() * 60 - 20,
          size: 3,
          color: '#94a3b8',
          alpha: 0.9,
          life: 0.6,
          maxLife: 0.6,
        });
      }
      this.player.hasAutoLauncher = false;
      this.autoTurret = null;
      return;
    }

    // Canister reload if ammo depleted
    if (turret.ammo <= 0) {
      turret.reloadTimer += dt;
      if (turret.reloadTimer >= 3.0) {
        turret.ammo = turret.maxAmmo;
        turret.reloadTimer = 0;
        this.addFloatingText('SAM CANISTER RELOADED!', turret.x, turret.y - 28, '#22c55e');
      }
      return;
    }

    turret.cooldown -= dt;

    // Find nearest airborne aircraft or drone
    let nearest: Aircraft | null = null;
    let minDist = 999999;
    this.aircrafts.forEach((ac) => {
      const d = Math.hypot(ac.x - turret.x, ac.y - turret.y);
      if (d < minDist) {
        minDist = d;
        nearest = ac;
      }
    });

    if (nearest) {
      const target = nearest as Aircraft;
      const ang = Math.atan2(target.y - turret.y, target.x - turret.x);
      turret.angle = ang;

      if (turret.cooldown <= 0 && minDist < 700 && turret.ammo > 0) {
        turret.ammo--;
        turret.cooldown = 1.3;
        sound.playTurretLaunch();

        // Launch automated SAM homing interceptor rocket!
        const launchX = turret.x + Math.cos(ang) * 24;
        const launchY = turret.y - 12 + Math.sin(ang) * 24;

        this.rockets.push({
          id: nextId(),
          x: launchX,
          y: launchY,
          vx: Math.cos(ang) * 780,
          vy: Math.sin(ang) * 780,
          angle: ang,
          speed: 780,
          isHoming: true,
          targetId: target.id,
          isAutoTurretRocket: true,
          life: 2.8,
        });
      }
    } else {
      // Secondary target: Hostile Panzer ground tank
      const hostileTank = this.groundTanks.find((t) => !t.isFriendly);
      if (hostileTank && turret.cooldown <= 0 && turret.ammo > 0) {
        turret.ammo--;
        turret.cooldown = 1.6;
        sound.playTurretLaunch();
        const ang = Math.atan2(hostileTank.y - 12 - turret.y, hostileTank.x - turret.x);
        turret.angle = ang;
        const launchX = turret.x + Math.cos(ang) * 24;
        const launchY = turret.y - 12 + Math.sin(ang) * 24;

        this.rockets.push({
          id: nextId(),
          x: launchX,
          y: launchY,
          vx: Math.cos(ang) * 780,
          vy: Math.sin(ang) * 780,
          angle: ang,
          speed: 780,
          isHoming: true,
          targetId: hostileTank.id,
          isAutoTurretRocket: true,
          life: 2.8,
        });
      }
    }
  }

  private updateFriendlyTank(dt: number) {
    if (!this.friendlyTank || !this.player.hasFriendlyTank) return;
    const tank = this.friendlyTank;

    // 1-minute battlefield active duration countdown
    tank.duration = (tank.duration ?? 60) - dt;
    this.player.friendlyTankTimeRemaining = Math.max(0, tank.duration);
    if (tank.duration <= 0) {
      // Graceful departure after 60s
      this.addFloatingText('ALLIED TANK DEPARTED (TIME UP) 💨', tank.x, tank.y - 25, '#f59e0b');
      sound.playExplosion('small');
      for (let s = 0; s < 12; s++) {
        this.particles.push({
          id: nextId(),
          x: tank.x + (Math.random() - 0.5) * 40,
          y: tank.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 50,
          vy: -Math.random() * 60 - 20,
          size: 3,
          color: '#94a3b8',
          alpha: 0.9,
          life: 0.6,
          maxLife: 0.6,
        });
      }
      this.player.hasFriendlyTank = false;
      this.friendlyTank = null;
      return;
    }

    // Patrol smoothly on hills near the player (within 60 to 220px)
    const distToPlayer = tank.x - this.player.x;
    if (distToPlayer > 180) {
      tank.vx = -40;
      tank.direction = -1;
    } else if (distToPlayer < -180) {
      tank.vx = 40;
      tank.direction = 1;
    }

    tank.x += tank.vx * dt;
    tank.x = Math.max(50, Math.min(this.terrain.width - 50, tank.x));
    tank.y = getTerrainY(tank.x, this.terrain);

    // Aim turret at nearest airborne enemy or hostile ground tank
    let targetPlane: Aircraft | null = null;
    let minDist = 999999;
    this.aircrafts.forEach((ac) => {
      const d = Math.hypot(ac.x - tank.x, ac.y - tank.y);
      if (d < minDist) {
        minDist = d;
        targetPlane = ac;
      }
    });

    tank.cannonCooldown -= dt;

    if (targetPlane && minDist < 650) {
      const target = targetPlane as Aircraft;
      const dx = target.x - tank.x;
      const dy = target.y - (tank.y - 12);
      tank.turretAngle = Math.atan2(dy, Math.abs(dx));
      tank.direction = dx >= 0 ? 1 : -1;

      if (tank.cannonCooldown <= 0) {
        tank.cannonCooldown = 2.4;
        sound.playTankCannon();
        this.screenShake = 3;

        // Anti-air flak shell launch
        const shellAngle = Math.atan2(dy, dx);
        this.rockets.push({
          id: nextId(),
          x: tank.x + Math.cos(shellAngle) * 36,
          y: tank.y - 12 + Math.sin(shellAngle) * 36,
          vx: Math.cos(shellAngle) * 720,
          vy: Math.sin(shellAngle) * 720,
          angle: shellAngle,
          speed: 720,
          isHoming: true,
          targetId: target.id,
          life: 2.2,
        });
      }
    } else {
      // Secondary: fire at hostile ground tank
      const hostileTank = this.groundTanks.find((t) => !t.isFriendly);
      if (hostileTank && tank.cannonCooldown <= 0) {
        const dx = hostileTank.x - tank.x;
        const dy = hostileTank.y - tank.y;
        tank.turretAngle = Math.atan2(dy, Math.abs(dx));
        tank.direction = dx >= 0 ? 1 : -1;
        tank.cannonCooldown = 2.6;
        sound.playTankCannon();
        this.screenShake = 3;

        const shellAngle = Math.atan2(dy - 10, dx);
        this.rockets.push({
          id: nextId(),
          x: tank.x + Math.cos(shellAngle) * 36,
          y: tank.y - 12 + Math.sin(shellAngle) * 36,
          vx: Math.cos(shellAngle) * 720,
          vy: Math.sin(shellAngle) * 720,
          angle: shellAngle,
          speed: 720,
          isHoming: true,
          targetId: hostileTank.id,
          life: 2.2,
        });
      }
    }
  }

  private updateFriendlyDrone(dt: number) {
    if (!this.friendlyDrone || !this.player.hasFriendlyDrone) return;
    const drone = this.friendlyDrone;

    // 1-minute battlefield active duration countdown
    drone.duration = (drone.duration ?? 60) - dt;
    this.player.friendlyDroneTimeRemaining = Math.max(0, drone.duration);
    if (drone.duration <= 0) {
      // Graceful departure after 60s
      this.addFloatingText('GUARDIAN DRONE DEPARTED (TIME UP) 💨', drone.x, drone.y - 25, '#f59e0b');
      sound.playExplosion('small');
      for (let s = 0; s < 12; s++) {
        this.particles.push({
          id: nextId(),
          x: drone.x + (Math.random() - 0.5) * 30,
          y: drone.y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 50,
          vy: -Math.random() * 80 - 40,
          size: 3,
          color: '#38bdf8',
          alpha: 0.9,
          life: 0.6,
          maxLife: 0.6,
        });
      }
      this.player.hasFriendlyDrone = false;
      this.friendlyDrone = null;
      return;
    }

    // Hover smoothly above and slightly behind the player
    const targetX = this.player.x + (this.player.facing === 1 ? -45 : 45);
    const targetY = Math.max(40, this.player.y - 95);

    drone.x += (targetX - drone.x) * dt * 4.5;
    drone.y += (targetY - drone.y) * dt * 4.5;

    drone.shootCooldown -= dt;

    // Prioritize shooting down incoming falling bombs near player!
    let targetBomb: Bomb | null = null;
    let minBombDist = 260;
    this.bombs.forEach((b) => {
      const d = Math.hypot(b.x - drone.x, b.y - drone.y);
      if (d < minBombDist) {
        minBombDist = d;
        targetBomb = b;
      }
    });

    if (targetBomb && drone.shootCooldown <= 0) {
      drone.shootCooldown = 0.45;
      const b = targetBomb as Bomb;
      const ang = Math.atan2(b.y - drone.y, b.x - drone.x);
      drone.targetAngle = ang;
      sound.playDroneShot();

      // Intercept bomb in midair!
      const idx = this.bombs.indexOf(b);
      if (idx !== -1) {
        this.bombs.splice(idx, 1);
        this.createExplosion(b.x, b.y, 'medium');
        this.stats.bombsShotDown++;
        this.addFloatingText('BOMB INTERCEPTED!', b.x, b.y - 12, '#38bdf8');
      }
      return;
    }

    // Otherwise target airborne enemy planes
    let targetPlane: Aircraft | null = null;
    let minDist = 500;
    this.aircrafts.forEach((ac) => {
      const d = Math.hypot(ac.x - drone.x, ac.y - drone.y);
      if (d < minDist) {
        minDist = d;
        targetPlane = ac;
      }
    });

    if (targetPlane) {
      const p = targetPlane as Aircraft;
      const ang = Math.atan2(p.y - drone.y, p.x - drone.x);
      drone.targetAngle = ang;

      if (drone.shootCooldown <= 0) {
        drone.shootCooldown = 0.65;
        sound.playDroneShot();

        // Laser tracer projectile towards plane
        p.health -= 1;
        if (p.health <= 0) {
          const pIdx = this.aircrafts.indexOf(p);
          if (pIdx !== -1) this.destroyAircraft(p, pIdx);
        } else {
          sound.playExplosion('small');
        }

        // Laser trail particles
        for (let lp = 0; lp < 6; lp++) {
          this.particles.push({
            id: nextId(),
            x: drone.x + Math.cos(ang) * (lp * 25),
            y: drone.y + Math.sin(ang) * (lp * 25),
            vx: 0,
            vy: 0,
            size: 2,
            color: '#38bdf8',
            alpha: 0.9,
            life: 0.2,
            maxLife: 0.2,
          });
        }
      }
    }
  }

  private updateHimarsTruck(dt: number) {
    if (!this.himarsTruck || !this.player.hasHimarsTruck) return;
    const himars = this.himarsTruck;

    himars.duration = (himars.duration ?? 60) - dt;
    this.player.himarsTruckTimeRemaining = Math.max(0, himars.duration);
    if (himars.duration <= 0) {
      this.addFloatingText('HIMARS DEPARTED (TIME UP) 💨', himars.x, himars.y - 25, '#f59e0b');
      sound.playExplosion('small');
      for (let s = 0; s < 12; s++) {
        this.particles.push({
          id: nextId(),
          x: himars.x + (Math.random() - 0.5) * 35,
          y: himars.y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 50,
          vy: -Math.random() * 60 - 20,
          size: 3,
          color: '#eab308',
          alpha: 0.9,
          life: 0.6,
          maxLife: 0.6,
        });
      }
      this.player.hasHimarsTruck = false;
      this.himarsTruck = null;
      return;
    }

    // Salvo reload cycle
    if (himars.ammo <= 0) {
      himars.salvoCooldown -= dt;
      if (himars.salvoCooldown <= 0) {
        himars.ammo = himars.maxAmmo;
        himars.salvoCooldown = 2.8;
        this.addFloatingText('HIMARS SALVO RELOADED! 🚀', himars.x, himars.y - 28, '#eab308');
      }
      return;
    }

    // Active burst fire
    if (himars.burstCount > 0) {
      himars.burstTimer -= dt;
      if (himars.burstTimer <= 0 && himars.ammo > 0) {
        himars.burstTimer = 0.12;
        himars.burstCount--;
        himars.ammo--;

        sound.playHimarsSalvo();
        this.screenShake = 2;

        const launchAng = himars.angle;
        const lx = himars.x - 8 + Math.cos(launchAng) * 28;
        const ly = himars.y - 10 + Math.sin(launchAng) * 28;

        this.rockets.push({
          id: nextId(),
          x: lx,
          y: ly,
          vx: Math.cos(launchAng) * 820 + (Math.random() - 0.5) * 60,
          vy: Math.sin(launchAng) * 820 + (Math.random() - 0.5) * 60,
          angle: launchAng,
          speed: 820,
          isHoming: true,
          targetId: himars.targetId,
          life: 2.8,
        });

        // Launch smoke puff
        for (let sp = 0; sp < 4; sp++) {
          this.particles.push({
            id: nextId(),
            x: lx,
            y: ly,
            vx: -Math.cos(launchAng) * 120 + (Math.random() - 0.5) * 40,
            vy: -Math.sin(launchAng) * 120 + (Math.random() - 0.5) * 40,
            size: 4,
            color: '#cbd5e1',
            alpha: 0.8,
            life: 0.4,
            maxLife: 0.4,
          });
        }
      }
      return;
    }

    // Target tracking
    himars.salvoCooldown -= dt;
    if (himars.salvoCooldown <= 0 && this.aircrafts.length > 0) {
      let targetAc: Aircraft | null = null;
      let minD = 999999;
      this.aircrafts.forEach((ac) => {
        const d = Math.hypot(ac.x - himars.x, ac.y - himars.y);
        if (ac.type === 'QUEEN_MOSQUITO' || d < minD) {
          minD = d;
          targetAc = ac;
        }
      });

      if (targetAc) {
        const t = targetAc as Aircraft;
        himars.targetId = t.id;
        const ang = Math.atan2(t.y - (himars.y - 10), t.x - (himars.x - 8));
        himars.angle = ang;
        himars.burstCount = 6;
        himars.burstTimer = 0.05;
        himars.salvoCooldown = 3.6;
      }
    }
  }

  private updateFlakCannon(dt: number) {
    if (!this.flakCannon || !this.player.hasFlakCannon) return;
    const flak = this.flakCannon;

    flak.duration = (flak.duration ?? 60) - dt;
    this.player.flakCannonTimeRemaining = Math.max(0, flak.duration);
    if (flak.duration <= 0) {
      this.addFloatingText('DUAL FLAK DEPARTED (TIME UP) 💨', flak.x, flak.y - 25, '#f59e0b');
      sound.playExplosion('small');
      this.player.hasFlakCannon = false;
      this.flakCannon = null;
      return;
    }

    // Smooth tactical patrol near player
    const dist = flak.x - (this.player.x + 80);
    if (dist > 120) {
      flak.vx = -45;
      flak.direction = -1;
    } else if (dist < -120) {
      flak.vx = 45;
      flak.direction = 1;
    }
    flak.x += flak.vx * dt;
    flak.x = Math.max(40, Math.min(this.terrain.width - 40, flak.x));
    flak.y = getTerrainY(flak.x, this.terrain);

    flak.cooldown -= dt;

    // First priority: intercept falling mosquito eggs!
    let targetBomb: Bomb | null = null;
    let minBombDist = 360;
    this.bombs.forEach((b) => {
      const d = Math.hypot(b.x - flak.x, b.y - flak.y);
      if (d < minBombDist) {
        minBombDist = d;
        targetBomb = b;
      }
    });

    if (targetBomb && flak.cooldown <= 0) {
      flak.cooldown = 0.12;
      flak.barrelIndex = flak.barrelIndex === 0 ? 1 : 0;
      const b = targetBomb as Bomb;
      const ang = Math.atan2(b.y - (flak.y - 12), Math.abs(b.x - flak.x));
      flak.angle = ang;
      flak.direction = b.x >= flak.x ? 1 : -1;
      sound.playFlakShot();

      const bIdx = this.bombs.indexOf(b);
      if (bIdx !== -1) {
        this.bombs.splice(bIdx, 1);
        this.createExplosion(b.x, b.y, 'small');
        this.stats.bombsShotDown++;
        this.addFloatingText('FLAK POP! 💥', b.x, b.y - 10, '#38bdf8');
      }
      return;
    }

    // Second priority: shred airborne mosquitos
    let targetAc: Aircraft | null = null;
    let minAcDist = 580;
    this.aircrafts.forEach((ac) => {
      const d = Math.hypot(ac.x - flak.x, ac.y - flak.y);
      if (d < minAcDist) {
        minAcDist = d;
        targetAc = ac;
      }
    });

    if (targetAc && flak.cooldown <= 0) {
      flak.cooldown = 0.14;
      flak.barrelIndex = flak.barrelIndex === 0 ? 1 : 0;
      const ac = targetAc as Aircraft;
      const dx = ac.x - flak.x;
      const dy = ac.y - (flak.y - 12);
      flak.angle = Math.atan2(dy, Math.abs(dx));
      flak.direction = dx >= 0 ? 1 : -1;
      sound.playFlakShot();

      // Damage mosquito + crit bonus if radar is active!
      const damageMultiplier = this.player.hasRadarStation ? 2.0 : 1.0;
      ac.health -= 1.8 * damageMultiplier;
      if (ac.health <= 0) {
        const idx = this.aircrafts.indexOf(ac);
        if (idx !== -1) this.destroyAircraft(ac, idx);
      } else {
        this.particles.push({
          id: nextId(),
          x: ac.x + (Math.random() - 0.5) * 16,
          y: ac.y + (Math.random() - 0.5) * 16,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          size: 4,
          color: '#1e293b',
          alpha: 0.7,
          life: 0.25,
          maxLife: 0.25,
        });
      }
    }
  }

  private updateRadarStation(dt: number) {
    if (!this.radarStation || !this.player.hasRadarStation) return;
    const radar = this.radarStation;

    radar.duration = (radar.duration ?? 60) - dt;
    this.player.radarStationTimeRemaining = Math.max(0, radar.duration);
    if (radar.duration <= 0) {
      this.addFloatingText('3D RADAR DEPARTED (TIME UP) 💨', radar.x, radar.y - 25, '#f59e0b');
      sound.playExplosion('small');
      this.player.hasRadarStation = false;
      this.radarStation = null;
      return;
    }

    radar.dishAngle += dt * 2.5;

    radar.pulseTimer -= dt;
    if (radar.pulseTimer <= 0) {
      radar.pulseTimer = 2.4;
      sound.playRadarPulse();
      radar.pulseWaves.push({
        radius: 15,
        maxRadius: 800,
        alpha: 0.85,
      });

      // Microwave jammer temporarily slowing all mosquitos by 40% for 2.8s
      this.aircrafts.forEach((ac) => {
        ac.slowTimer = 2.8;
        this.particles.push({
          id: nextId(),
          x: ac.x,
          y: ac.y,
          vx: (Math.random() - 0.5) * 20,
          vy: -20,
          size: 2.5,
          color: '#10b981',
          alpha: 0.8,
          life: 0.35,
          maxLife: 0.35,
        });
      });
      this.addFloatingText('RADAR EMP: SWARM SLOWED 40%! 📡', radar.x, radar.y - 45, '#10b981');
    }

    for (let w = radar.pulseWaves.length - 1; w >= 0; w--) {
      const wave = radar.pulseWaves[w];
      wave.radius += dt * 420;
      wave.alpha = Math.max(0, 1 - wave.radius / wave.maxRadius);
      if (wave.radius >= wave.maxRadius || wave.alpha <= 0) {
        radar.pulseWaves.splice(w, 1);
      }
    }
  }

  private updateEnemyBullets(dt: number) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Hit player check
      const dist = Math.hypot(b.x - this.player.x, b.y - (this.player.y - 14));
      if (dist < 18) {
        this.damagePlayer(b.damage);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      // Hit ground
      const gY = getTerrainY(b.x, this.terrain);
      if (b.y >= gY) {
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.life <= 0 || b.x < -20 || b.x > this.terrain.width + 20) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  // Bio-Acid Globules and Chemical Swarm updates
  private updateAcidBlobs(dt: number) {
    for (let i = this.acidBlobs.length - 1; i >= 0; i--) {
      const b = this.acidBlobs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;

      // Acid dripping sizzle particles
      if (Math.random() < 0.45) {
        this.particles.push({
          id: nextId(),
          x: b.x,
          y: b.y,
          vx: (Math.random() - 0.5) * 20,
          vy: (Math.random() - 0.5) * 20,
          size: 2.2,
          color: b.color || '#22c55e',
          alpha: 0.8,
          life: 0.25,
          maxLife: 0.25,
        });
      }

      // Check collision with Friendly Vehicles (Active Player Arsenal)
      let hitVehicle = false;
      if (this.friendlyTank && this.player.hasFriendlyTank && Math.hypot(b.x - this.friendlyTank.x, b.y - (this.friendlyTank.y - 10)) < 34) {
        this.damageFriendlyVehicle('TANK', b.damage);
        hitVehicle = true;
      } else if (this.autoTurret && this.player.hasAutoLauncher && Math.hypot(b.x - this.autoTurret.x, b.y - (this.autoTurret.y - 12)) < 30) {
        this.damageFriendlyVehicle('SAM', b.damage);
        hitVehicle = true;
      } else if (this.himarsTruck && this.player.hasHimarsTruck && Math.hypot(b.x - this.himarsTruck.x, b.y - (this.himarsTruck.y - 12)) < 32) {
        this.damageFriendlyVehicle('HIMARS', b.damage);
        hitVehicle = true;
      } else if (this.flakCannon && this.player.hasFlakCannon && Math.hypot(b.x - this.flakCannon.x, b.y - (this.flakCannon.y - 12)) < 30) {
        this.damageFriendlyVehicle('FLAK', b.damage);
        hitVehicle = true;
      } else if (this.radarStation && this.player.hasRadarStation && Math.hypot(b.x - this.radarStation.x, b.y - (this.radarStation.y - 15)) < 32) {
        this.damageFriendlyVehicle('RADAR', b.damage);
        hitVehicle = true;
      } else if (this.friendlyDrone && this.player.hasFriendlyDrone && Math.hypot(b.x - this.friendlyDrone.x, b.y - this.friendlyDrone.y) < 26) {
        this.damageFriendlyVehicle('DRONE', b.damage);
        hitVehicle = true;
      }

      if (hitVehicle) {
        this.acidBlobs.splice(i, 1);
        continue;
      }

      // Check collision with player
      const distToPlayer = Math.hypot(b.x - this.player.x, b.y - (this.player.y - 16));
      if (distToPlayer < 22) {
        this.damagePlayer(b.damage);
        sound.playAcidSizzle();
        this.acidBlobs.splice(i, 1);
        continue;
      }

      // Check collision with ground
      const gY = getTerrainY(b.x, this.terrain);
      if (b.y >= gY || b.life <= 0 || b.x < -30 || b.x > this.terrain.width + 30) {
        for (let s = 0; s < 4; s++) {
          this.particles.push({
            id: nextId(),
            x: b.x,
            y: Math.min(gY, b.y),
            vx: (Math.random() - 0.5) * 40,
            vy: -Math.random() * 30,
            size: 2,
            color: b.color || '#22c55e',
            alpha: 0.7,
            life: 0.3,
            maxLife: 0.3,
          });
        }
        this.acidBlobs.splice(i, 1);
      }
    }
  }

  // Damage friendly military war machines (ট্যাংক, স্যাম, হিমার্স, ফ্ল্যাক, রাডার, ড্রোন)
  public damageFriendlyVehicle(type: 'TANK' | 'SAM' | 'HIMARS' | 'FLAK' | 'RADAR' | 'DRONE', amount: number): boolean {
    if (this.isGameOver) return false;

    let targetName = '';
    let targetX = 0;
    let targetY = 0;
    let curHp = 0;
    let maxHp = 0;

    if (type === 'TANK' && this.friendlyTank && this.player.hasFriendlyTank) {
      this.friendlyTank.health = Math.max(0, (this.friendlyTank.health ?? 12) - amount);
      curHp = this.friendlyTank.health;
      maxHp = this.friendlyTank.maxHealth ?? 12;
      targetName = 'যুদ্ধট্যাংক (TANK)';
      targetX = this.friendlyTank.x;
      targetY = this.friendlyTank.y - 20;
      if (curHp <= 0) {
        this.destroyFriendlyVehicle('TANK');
        return true;
      }
    } else if (type === 'SAM' && this.autoTurret && this.player.hasAutoLauncher) {
      this.autoTurret.health = Math.max(0, (this.autoTurret.health ?? 8) - amount);
      curHp = this.autoTurret.health;
      maxHp = this.autoTurret.maxHealth ?? 8;
      targetName = 'স্যাম ব্যাটারি (SAM)';
      targetX = this.autoTurret.x;
      targetY = this.autoTurret.y - 20;
      if (curHp <= 0) {
        this.destroyFriendlyVehicle('SAM');
        return true;
      }
    } else if (type === 'HIMARS' && this.himarsTruck && this.player.hasHimarsTruck) {
      this.himarsTruck.health = Math.max(0, (this.himarsTruck.health ?? 8) - amount);
      curHp = this.himarsTruck.health;
      maxHp = this.himarsTruck.maxHealth ?? 8;
      targetName = 'হিমার্স রকেট ট্রাক (HIMARS)';
      targetX = this.himarsTruck.x;
      targetY = this.himarsTruck.y - 20;
      if (curHp <= 0) {
        this.destroyFriendlyVehicle('HIMARS');
        return true;
      }
    } else if (type === 'FLAK' && this.flakCannon && this.player.hasFlakCannon) {
      this.flakCannon.health = Math.max(0, (this.flakCannon.health ?? 8) - amount);
      curHp = this.flakCannon.health;
      maxHp = this.flakCannon.maxHealth ?? 8;
      targetName = 'ডুয়াল ফ্ল্যাক কামান (FLAK)';
      targetX = this.flakCannon.x;
      targetY = this.flakCannon.y - 20;
      if (curHp <= 0) {
        this.destroyFriendlyVehicle('FLAK');
        return true;
      }
    } else if (type === 'RADAR' && this.radarStation && this.player.hasRadarStation) {
      this.radarStation.health = Math.max(0, (this.radarStation.health ?? 8) - amount);
      curHp = this.radarStation.health;
      maxHp = this.radarStation.maxHealth ?? 8;
      targetName = 'থ্রিডি রাডার স্টেশন (RADAR)';
      targetX = this.radarStation.x;
      targetY = this.radarStation.y - 20;
      if (curHp <= 0) {
        this.destroyFriendlyVehicle('RADAR');
        return true;
      }
    } else if (type === 'DRONE' && this.friendlyDrone && this.player.hasFriendlyDrone) {
      this.friendlyDrone.health = Math.max(0, (this.friendlyDrone.health ?? 6) - amount);
      curHp = this.friendlyDrone.health;
      maxHp = this.friendlyDrone.maxHealth ?? 6;
      targetName = 'গার্ডিয়ান ড্রোন (DRONE)';
      targetX = this.friendlyDrone.x;
      targetY = this.friendlyDrone.y;
      if (curHp <= 0) {
        this.destroyFriendlyVehicle('DRONE');
        return true;
      }
    } else {
      return false;
    }

    sound.playAcidSizzle();
    this.screenShake = 4;
    this.addFloatingText(`⚠️ এসিড আক্রমণ! ${targetName} HP: ${Math.ceil(curHp)}/${maxHp}`, targetX, targetY - 15, '#ef4444');

    for (let p = 0; p < 8; p++) {
      this.particles.push({
        id: nextId(),
        x: targetX + (Math.random() - 0.5) * 30,
        y: targetY + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 80,
        vy: -Math.random() * 60 - 20,
        size: 3,
        color: '#22c55e',
        alpha: 0.9,
        life: 0.45,
        maxLife: 0.45,
      });
    }

    return true;
  }

  // Destroy vehicle upon taking lethal damage
  public destroyFriendlyVehicle(type: 'TANK' | 'SAM' | 'HIMARS' | 'FLAK' | 'RADAR' | 'DRONE') {
    let name = '';
    let x = 0;
    let y = 0;

    if (type === 'TANK' && this.friendlyTank) {
      name = 'যুদ্ধট্যাংক (TANK)';
      x = this.friendlyTank.x;
      y = this.friendlyTank.y;
      this.player.hasFriendlyTank = false;
      this.friendlyTank = null;
    } else if (type === 'SAM' && this.autoTurret) {
      name = 'স্যাম মিসাইল ব্যাটারি (SAM)';
      x = this.autoTurret.x;
      y = this.autoTurret.y;
      this.player.hasAutoLauncher = false;
      this.autoTurret = null;
    } else if (type === 'HIMARS' && this.himarsTruck) {
      name = 'হিমার্স আর্টিলারি ট্রাক (HIMARS)';
      x = this.himarsTruck.x;
      y = this.himarsTruck.y;
      this.player.hasHimarsTruck = false;
      this.himarsTruck = null;
    } else if (type === 'FLAK' && this.flakCannon) {
      name = 'ডুয়াল ফ্ল্যাক কামান (FLAK)';
      x = this.flakCannon.x;
      y = this.flakCannon.y;
      this.player.hasFlakCannon = false;
      this.flakCannon = null;
    } else if (type === 'RADAR' && this.radarStation) {
      name = '৩ডি ডিফেন্স রাডার (RADAR)';
      x = this.radarStation.x;
      y = this.radarStation.y;
      this.player.hasRadarStation = false;
      this.radarStation = null;
    } else if (type === 'DRONE' && this.friendlyDrone) {
      name = 'গার্ডিয়ান প্রিডেটর ড্রোন (DRONE)';
      x = this.friendlyDrone.x;
      y = this.friendlyDrone.y;
      this.player.hasFriendlyDrone = false;
      this.friendlyDrone = null;
    }

    if (!name) return;

    sound.playVehicleExplosion();
    this.createExplosion(x, y - 10, 'big');
    this.screenShake = 14;

    for (let d = 0; d < 24; d++) {
      this.particles.push({
        id: nextId(),
        x: x + (Math.random() - 0.5) * 45,
        y: y - 10 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 240,
        vy: -Math.random() * 260 - 60,
        size: 4 + Math.random() * 4,
        color: Math.random() > 0.5 ? '#1e293b' : (Math.random() > 0.5 ? '#f97316' : '#22c55e'),
        alpha: 1,
        life: 1.2,
        maxLife: 1.2,
        isDebris: true,
      });
    }

    this.addFloatingText(`💥 যুদ্ধাস্ত্র ধ্বংসপ্রাপ্ত! ${name} WRECKED! 💥`, x, y - 40, '#ef4444');
    this.bossWarningBanner = {
      text: `🚨 সতর্কতা! ভাইরাস মলা আপনার প্রধান যুদ্ধাস্ত্র [${name}] ধ্বংস করেছে! 🚨`,
      timer: 4.5,
      alpha: 1,
    };
  }

  // Battlefield Field Repair (সমস্ত ক্ষতিগ্রস্থ যুদ্ধাস্ত্র মেরামত)
  public repairAllVehicles(): boolean {
    let count = 0;
    if (this.friendlyTank) {
      this.friendlyTank.health = this.friendlyTank.maxHealth ?? 12;
      count++;
    }
    if (this.autoTurret) {
      this.autoTurret.health = this.autoTurret.maxHealth ?? 8;
      count++;
    }
    if (this.himarsTruck) {
      this.himarsTruck.health = this.himarsTruck.maxHealth ?? 8;
      count++;
    }
    if (this.flakCannon) {
      this.flakCannon.health = this.flakCannon.maxHealth ?? 8;
      count++;
    }
    if (this.radarStation) {
      this.radarStation.health = this.radarStation.maxHealth ?? 8;
      count++;
    }
    if (this.friendlyDrone) {
      this.friendlyDrone.health = this.friendlyDrone.maxHealth ?? 6;
      count++;
    }
    if (count > 0) {
      sound.playCratePickup();
      this.addFloatingText('🛠️ সমস্ত যুদ্ধাস্ত্র মেরামত ও পুনরুজ্জীবিত! 🛡️', this.player.x, this.player.y - 45, '#22c55e');
      return true;
    }
    return false;
  }

  private updateRockets(dt: number) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];

      // Homing guidance
      if (r.isHoming && this.aircrafts.length > 0) {
        let nearest: Aircraft | null = null;
        if (r.targetId) {
          nearest = this.aircrafts.find((ac) => ac.id === r.targetId) || null;
        }
        if (!nearest) {
          let minDist = 999999;
          this.aircrafts.forEach((ac) => {
            const d = Math.hypot(ac.x - r.x, ac.y - r.y);
            if (d < minDist) {
              minDist = d;
              nearest = ac;
            }
          });
        }

        if (nearest) {
          const target = nearest as Aircraft;
          const targetAngle = Math.atan2(target.y - r.y, target.x - r.x);
          const diff = targetAngle - r.angle;
          r.angle += Math.sin(diff) * dt * 5.0;
          r.vx = Math.cos(r.angle) * r.speed;
          r.vy = Math.sin(r.angle) * r.speed;
        }
      }

      r.x += r.vx * dt;
      r.y += r.vy * dt;
      r.life -= dt;

      // Dotted smoke trail
      if (Math.random() < 0.7) {
        this.particles.push({
          id: nextId(),
          x: r.x - Math.cos(r.angle) * 8,
          y: r.y - Math.sin(r.angle) * 8,
          vx: 0,
          vy: 0,
          size: 2.4,
          color: '#ffffff',
          alpha: 0.85,
          life: 0.45,
          maxLife: 0.45,
        });
      }

      let hit = false;
      // Hit aircraft
      for (let j = this.aircrafts.length - 1; j >= 0; j--) {
        const a = this.aircrafts[j];
        if (Math.abs(r.x - a.x) < a.width * 0.5 && Math.abs(r.y - a.y) < a.height * 0.5) {
          hit = true;
          this.stats.shotsHit++;
          a.health -= 1;

          if (a.health <= 0) {
            this.destroyAircraft(a, j);
          } else {
            sound.playExplosion('small');
          }
          break;
        }
      }

      // Hit Ground Tank (Hostile)
      if (!hit) {
        for (let tIdx = this.groundTanks.length - 1; tIdx >= 0; tIdx--) {
          const t = this.groundTanks[tIdx];
          if (!t.isFriendly && Math.abs(r.x - t.x) < 55 && Math.abs(r.y - (t.y - 10)) < 35) {
            hit = true;
            this.stats.shotsHit++;
            t.health -= 1;
            if (t.health <= 0) {
              this.destroyTank(t, tIdx);
            } else {
              sound.playExplosion('medium');
              this.createExplosion(r.x, r.y, 'small');
              this.addFloatingText(`PANZER ${t.health}/${t.maxHealth}`, t.x, t.y - 32, '#ef4444');
            }
            break;
          }
        }
      }

      // Hit Mosquito Egg mid-air! (মশার ডিম ধ্বংস!)
      if (!hit) {
        for (let bIdx = this.bombs.length - 1; bIdx >= 0; bIdx--) {
          const b = this.bombs[bIdx];
          if (Math.hypot(r.x - b.x, r.y - b.y) < 24) {
            hit = true;
            this.stats.shotsHit++;
            this.stats.eggsDestroyed = (this.stats.eggsDestroyed || 0) + 1;
            this.stats.bombsShotDown++;
            this.registerHitCombo('BOMB', 50, b.x, b.y);
            this.player.credits += 30;
            sound.playEggPop();
            this.createEggSplatter(b.x, b.y, b.eggType);
            this.addFloatingText('ডিম ধ্বংস! 🥚💥 +$30', b.x, b.y - 15, '#fef08a');
            this.bombs.splice(bIdx, 1);
            break;
          }
        }
      }

      // Hit Cruise Missile
      if (!hit) {
        for (let cmIdx = this.cruiseMissiles.length - 1; cmIdx >= 0; cmIdx--) {
          const cm = this.cruiseMissiles[cmIdx];
          if (Math.hypot(r.x - cm.x, r.y - cm.y) < 24) {
            hit = true;
            this.stats.shotsHit++;
            this.registerHitCombo('BOMB', 120, cm.x, cm.y);
            this.createExplosion(cm.x, cm.y, 'big');
            this.cruiseMissiles.splice(cmIdx, 1);
            break;
          }
        }
      }

      // Hit Enemy Paratrooper
      if (!hit) {
        for (let epIdx = this.enemyParatroopers.length - 1; epIdx >= 0; epIdx--) {
          const ep = this.enemyParatroopers[epIdx];
          if (Math.hypot(r.x - ep.x, r.y - (ep.y - 10)) < 26) {
            hit = true;
            this.stats.shotsHit++;
            ep.health--;
            if (ep.health <= 0) {
              this.registerHitCombo('PARATROOPER', 150, ep.x, ep.y);
              this.createExplosion(ep.x, ep.y, 'small');
              this.enemyParatroopers.splice(epIdx, 1);
            } else {
              sound.playExplosion('small');
            }
            break;
          }
        }
      }

      // Hit terrain
      const gY = getTerrainY(r.x, this.terrain);
      const isAscendingFromTunnel = r.fromTunnel && r.vy < 0 && r.y >= gY - 25;
      if (!isAscendingFromTunnel && r.y >= gY) {
        hit = true;
        if (!isCoveredByBunkerRoof(r.x, this.terrain)) {
          applyCrater(this.terrain, r.x, r.y, 16);
        }
        this.createExplosion(r.x, r.y, 'small');
      }

      if (hit || r.life <= 0 || r.x < -40 || r.x > this.terrain.width + 40 || r.y < -40) {
        this.rockets.splice(i, 1);
      }
    }
  }

  private createEggSplatter(x: number, y: number, eggType?: EggType) {
    const primaryColor = eggType === 'TOXIC' ? '#22c55e' : eggType === 'BLOOD' ? '#dc2626' : eggType === 'AEDES' ? '#c084fc' : '#facc15';
    const secondaryColor = eggType === 'AEDES' ? '#ffffff' : '#fef08a';

    for (let p = 0; p < 14; p++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 30 + Math.random() * 90;
      this.particles.push({
        id: nextId(),
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        size: 2.5 + Math.random() * 3,
        color: Math.random() < 0.7 ? primaryColor : secondaryColor,
        alpha: 1,
        life: 0.45,
        maxLife: 0.45,
        gravity: 260,
      });
    }
  }

  private createMosquitoSplatter(x: number, y: number, mosquitoType: MosquitoType) {
    const isBlood = mosquitoType === 'BLOODSUCKER_MOSQUITO';
    const isToxic = mosquitoType === 'TOXIC_MUTANT_MOSQUITO';
    const isQueen = mosquitoType === 'QUEEN_MOSQUITO';

    const count = isQueen ? 35 : 18;
    for (let p = 0; p < count; p++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 40 + Math.random() * 120;
      let col = '#0f172a';
      if (isBlood) {
        col = Math.random() < 0.7 ? '#dc2626' : '#ef4444';
      } else if (isToxic) {
        col = Math.random() < 0.7 ? '#22c55e' : '#86efac';
      } else if (isQueen) {
        col = Math.random() < 0.4 ? '#a855f7' : Math.random() < 0.7 ? '#fbbf24' : '#ec4899';
      } else {
        col = Math.random() < 0.4 ? '#ffffff' : Math.random() < 0.7 ? '#f59e0b' : '#1e293b';
      }

      this.particles.push({
        id: nextId(),
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        size: 2.5 + Math.random() * 3.5,
        color: col,
        alpha: 1,
        life: 0.5,
        maxLife: 0.5,
        gravity: 280,
      });
    }
  }

  private destroyAircraft(aircraft: Aircraft, index: number) {
    this.aircrafts.splice(index, 1);
    this.stats.mosquitoesDestroyed = (this.stats.mosquitoesDestroyed || 0) + 1;
    this.stats.planesDestroyed++;
    this.registerHitCombo('AIRCRAFT', aircraft.scoreValue, aircraft.x, aircraft.y);
    this.player.credits += Math.floor(aircraft.scoreValue * 0.7);
    this.screenShake = aircraft.type === 'QUEEN_MOSQUITO' ? 14 : 5;
    sound.playMosquitoSquash();

    // Organic insect juice splatter particles!
    this.createMosquitoSplatter(aircraft.x, aircraft.y, aircraft.type);

    if (aircraft.type === 'QUEEN_MOSQUITO') {
      this.activeBoss = null;
      this.stats.bossesDefeated++;
      this.player.credits += 600;
      this.addFloatingText('👑 QUEEN MOSQUITO DESTROYED! রানী মশা খতম! +$600 💥', aircraft.x, aircraft.y - 40, '#f59e0b');
      this.screenFlash = { color: '#fbbf24', alpha: 0.85 };
      for (let c = 1; c <= 4; c++) {
        setTimeout(() => {
          this.createMosquitoSplatter(aircraft.x + (Math.random() - 0.5) * 50, aircraft.y + (Math.random() - 0.5) * 25, 'QUEEN_MOSQUITO');
          sound.playMosquitoSquash();
        }, c * 130);
      }
    } else {
      this.addFloatingText(`${aircraft.mosquitoNameBn || 'মশা'} খতম! 🦟💥`, aircraft.x, aircraft.y - 20, '#4ade80');
    }
    // Note: Gifts/crates removed per user instruction ("গিফট বাদ দাও")
  }

  private destroyTank(tank: GroundTank, index: number) {
    this.groundTanks.splice(index, 1);
    this.registerHitCombo('AIRCRAFT', 350, tank.x, tank.y - 12);
    this.player.credits += 250;
    this.screenShake = 9;
    sound.playExplosion('big');
    applyCrater(this.terrain, tank.x, tank.y, 25);
    this.createSmokeRingExplosion(tank.x, tank.y - 10);
    this.addFloatingText('ENEMY PANZER DESTROYED! +$250 💥', tank.x, tank.y - 30, '#ef4444');
    // Note: Gifts/crates removed per user instruction ("গিফট বাদ দাও")
  }

  private updateEnemyParatroopers(dt: number) {
    for (let i = this.enemyParatroopers.length - 1; i >= 0; i--) {
      const tp = this.enemyParatroopers[i];
      const gY = getTerrainY(tp.x, this.terrain);

      if (!tp.isGrounded) {
        tp.y += tp.vy * dt;
        tp.x += tp.vx * dt;
        if (tp.y >= gY - 4) {
          tp.y = gY;
          tp.isGrounded = true;
          tp.vy = 0;
          tp.vx = 0;
        }
      } else {
        tp.facing = this.player.x >= tp.x ? 1 : -1;
        const dx = this.player.x - tp.x;
        if (Math.abs(dx) > 100) {
          tp.x += tp.facing * 48 * dt;
          tp.y = getTerrainY(tp.x, this.terrain);
        }

        tp.shootCooldown -= dt;
        if (tp.shootCooldown <= 0 && Math.abs(dx) < 380) {
          tp.shootCooldown = 2.4;
          sound.playMachineGun();
          const ang = Math.atan2(this.player.y - 15 - (tp.y - 12), this.player.x - tp.x);
          this.enemyBullets.push({
            id: nextId(),
            x: tp.x + tp.facing * 12,
            y: tp.y - 12,
            vx: Math.cos(ang) * 440,
            vy: Math.sin(ang) * 440,
            damage: 6,
            life: 1.2,
            isTracer: true,
          });
        }
      }

      // Check player stomp or collision
      const pDist = Math.hypot(this.player.x - tp.x, this.player.y - tp.y);
      if (pDist < 18) {
        if (!this.player.isGrounded && this.player.vy > 0) {
          this.player.vy = -320;
          this.registerHitCombo('PARATROOPER', 200, tp.x, tp.y);
          this.createExplosion(tp.x, tp.y, 'small');
          this.enemyParatroopers.splice(i, 1);
          sound.playJump();
          continue;
        } else {
          this.damagePlayer(10);
        }
      }
    }
  }

  private updateCruiseMissiles(dt: number) {
    for (let i = this.cruiseMissiles.length - 1; i >= 0; i--) {
      const cm = this.cruiseMissiles[i];
      cm.x += cm.vx * dt;
      cm.y += cm.vy * dt;

      cm.trailTimer += dt;
      if (cm.trailTimer >= 0.04) {
        cm.trailTimer = 0;
        this.particles.push({
          id: nextId(),
          x: cm.x - Math.sign(cm.vx) * 16,
          y: cm.y,
          vx: -cm.vx * 0.1,
          vy: (Math.random() - 0.5) * 10,
          size: 3,
          color: Math.random() < 0.5 ? '#f97316' : '#94a3b8',
          alpha: 0.8,
          life: 0.35,
          maxLife: 0.35,
        });
      }

      // Hit player
      const pDist = Math.hypot(this.player.x - cm.x, this.player.y - 14 - cm.y);
      if (pDist < 20) {
        this.createExplosion(cm.x, cm.y, 'big');
        this.damagePlayer(cm.damage);
        this.cruiseMissiles.splice(i, 1);
        continue;
      }

      // Ground impact
      const gY = getTerrainY(cm.x, this.terrain);
      if (cm.y >= gY) {
        applyCrater(this.terrain, cm.x, cm.y, 24);
        this.createExplosion(cm.x, cm.y, 'big');
        this.screenShake = 6;
        this.cruiseMissiles.splice(i, 1);
        continue;
      }

      if (cm.x < -80 || cm.x > this.terrain.width + 80) {
        this.cruiseMissiles.splice(i, 1);
      }
    }
  }

  private updateFallingWreckage(dt: number) {
    for (let i = this.fallingWreckage.length - 1; i >= 0; i--) {
      const w = this.fallingWreckage[i];
      w.vy += 320 * dt;
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.rotation += w.angularVelocity * dt;

      w.smokeTimer += dt;
      if (w.smokeTimer >= 0.04) {
        w.smokeTimer = 0;
        this.particles.push({
          id: nextId(),
          x: w.x,
          y: w.y,
          vx: (Math.random() - 0.5) * 30,
          vy: -Math.random() * 40,
          size: 4 + Math.random() * 3,
          color: Math.random() < 0.4 ? '#ea580c' : '#18181b',
          alpha: 0.9,
          life: 0.55,
          maxLife: 0.55,
        });
      }

      const gY = getTerrainY(w.x, this.terrain);
      if (w.y >= gY) {
        applyCrater(this.terrain, w.x, gY, 22);
        this.createSmokeRingExplosion(w.x, gY - 6);
        sound.playExplosion('big');
        this.screenShake = 6;
        this.fallingWreckage.splice(i, 1);
      }
    }
  }

  private updateBombs(dt: number) {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.vy += 220 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rotation = Math.atan2(b.vy, b.vx);

      if (Math.random() < 0.5) {
        this.particles.push({
          id: nextId(),
          x: b.x,
          y: b.y,
          vx: 0,
          vy: 0,
          size: 2,
          color: '#cbd5e1',
          alpha: 0.6,
          life: 0.35,
          maxLife: 0.35,
        });
      }

      // Hit player check (মশার ডিমের বিষাক্ত বা রক্তচোষা বিষক্রিয়া)
      const distToPlayer = Math.hypot(b.x - this.player.x, b.y - (this.player.y - 14));
      if (distToPlayer < 24) {
        // If player is sheltered inside tunnel under reinforced roof:
        if (this.player.isInTunnel && isCoveredByBunkerRoof(this.player.x, this.terrain)) {
          this.createEggSplatter(b.x, b.y, b.eggType);
          sound.playEggPop();
          this.addFloatingText('BUNKER ROOF DEFLECTED EGG! 🛡️ (টানেলে নিরাপদ)', this.player.x, this.player.y - 28, '#38bdf8');
          this.bombs.splice(i, 1);
          continue;
        }

        this.damagePlayer(b.damage || 20);
        this.createEggSplatter(b.x, b.y, b.eggType);
        sound.playEggPop();
        this.bombs.splice(i, 1);
        continue;
      }

      // Hit Friendly Vehicle check (বোমা ও ডিম যুদ্ধাস্ত্রে আঘাত)
      let hitVehicle = false;
      if (this.friendlyTank && this.player.hasFriendlyTank && Math.hypot(b.x - this.friendlyTank.x, b.y - (this.friendlyTank.y - 12)) < 36) {
        this.damageFriendlyVehicle('TANK', 2.0);
        hitVehicle = true;
      } else if (this.autoTurret && this.player.hasAutoLauncher && Math.hypot(b.x - this.autoTurret.x, b.y - (this.autoTurret.y - 12)) < 32) {
        this.damageFriendlyVehicle('SAM', 2.0);
        hitVehicle = true;
      } else if (this.himarsTruck && this.player.hasHimarsTruck && Math.hypot(b.x - this.himarsTruck.x, b.y - (this.himarsTruck.y - 12)) < 34) {
        this.damageFriendlyVehicle('HIMARS', 2.0);
        hitVehicle = true;
      } else if (this.flakCannon && this.player.hasFlakCannon && Math.hypot(b.x - this.flakCannon.x, b.y - (this.flakCannon.y - 12)) < 32) {
        this.damageFriendlyVehicle('FLAK', 2.0);
        hitVehicle = true;
      } else if (this.radarStation && this.player.hasRadarStation && Math.hypot(b.x - this.radarStation.x, b.y - (this.radarStation.y - 15)) < 34) {
        this.damageFriendlyVehicle('RADAR', 2.0);
        hitVehicle = true;
      }

      if (hitVehicle) {
        this.createEggSplatter(b.x, b.y, b.eggType);
        sound.playEggPop();
        this.bombs.splice(i, 1);
        continue;
      }

      // Hit terrain
      const gY = getTerrainY(b.x, this.terrain);
      if (b.y >= gY) {
        // Don't crater the reinforced bunker roof
        if (!isCoveredByBunkerRoof(b.x, this.terrain)) {
          applyCrater(this.terrain, b.x, b.y, 14);
        } else if (this.player.isInTunnel) {
          // Dust falls from bunker ceiling
          for (let d = 0; d < 5; d++) {
            this.particles.push({
              id: nextId(),
              x: this.player.x + (Math.random() - 0.5) * 35,
              y: getTerrainY(this.player.x, this.terrain) + 14,
              vx: (Math.random() - 0.5) * 20,
              vy: 35 + Math.random() * 30,
              size: 2,
              color: '#94a3b8',
              alpha: 0.8,
              life: 0.5,
              maxLife: 0.5,
            });
          }
        }
        this.createEggSplatter(b.x, gY, b.eggType);
        sound.playEggPop();
        this.screenShake = 3;
        this.bombs.splice(i, 1);
      }
    }
  }

  private damagePlayer(damageAmount = 20) {
    if (this.player.isDashing) {
      this.addFloatingText('DODGED! 💨', this.player.x, this.player.y - 28, '#38bdf8');
      return;
    }

    if (this.player.isInTunnel) {
      if (isCoveredByBunkerRoof(this.player.x, this.terrain)) {
        this.addFloatingText('BUNKER SHIELDED! 🛡️', this.player.x, this.player.y - 28, '#38bdf8');
        return;
      } else {
        // Open firing hatch: fortified trench parapet absorbs 75% of incoming blast!
        damageAmount = Math.max(3, Math.round(damageAmount * 0.25));
      }
    }

    this.comboStreak = 0;
    this.stats.combo = 0;
    this.screenShake = 12;

    if (this.player.shieldHits > 0) {
      this.player.shieldHits--;
      this.addFloatingText('SHIELD BLOCKED!', this.player.x, this.player.y - 28, '#38bdf8');
      sound.playExplosion('small');
      return;
    }

    // Scale damage by Difficulty Mode: Easy is gentle, Hard is punishing!
    let finalDamage = damageAmount;
    if (this.mode === 'EASY') {
      finalDamage = Math.max(4, Math.round(damageAmount * 0.50)); // 50% less damage in Easy mode
    } else if (this.mode === 'HARD') {
      finalDamage = Math.round(damageAmount * 1.40); // 40% extra damage in Hard mode
    }

    // Deduct from Lifeline HP gauge!
    this.player.health = Math.max(0, this.player.health - finalDamage);
    sound.playHitDamage();

    // Damage blood/sparks
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        id: nextId(),
        x: this.player.x,
        y: this.player.y - 12,
        vx: (Math.random() - 0.5) * 140,
        vy: -Math.random() * 120,
        size: 3,
        color: '#ef4444',
        alpha: 1,
        life: 0.4,
        maxLife: 0.4,
        gravity: 280,
      });
    }

    // Check Lifeline empty -> Game Over!
    if (this.player.health <= 0) {
      this.isGameOver = true;
      sound.playExplosion('big');
      if (this.stats.score > this.stats.highScore) {
        this.stats.highScore = this.stats.score;
        localStorage.setItem('air_attack_highscore', this.stats.highScore.toString());
      }
    }
  }

  private spawnAirdropCrate(spawnX?: number, preferredType?: PowerupType) {
    const x = spawnX ?? (120 + Math.random() * (this.terrain.width - 240));
    const powerups: { type: PowerupType; label: string }[] = [
      { type: 'HEALTH', label: 'FIELD MEDKIT (+40 HP)' },
      { type: 'AMMO_REFILL', label: 'ROCKET AMMO REFILL' },
      { type: 'REPAIR_VEHICLES', label: 'FIELD REPAIR KIT (সব যুদ্ধাস্ত্র মেরামত 🔧)' },
      { type: 'REINFORCE_SAM', label: 'AUTO SAM BEACON (60s)' },
      { type: 'REINFORCE_TANK', label: 'ALLIED TANK SUPPORT (60s)' },
      { type: 'REINFORCE_DRONE', label: 'GUARDIAN DRONE (60s)' },
      { type: 'REINFORCE_HIMARS', label: 'HIMARS ARTILLERY BEACON (60s) 🚀' },
      { type: 'REINFORCE_FLAK', label: 'DUAL FLAK AA BEACON (60s) 💥' },
      { type: 'REINFORCE_RADAR', label: '3D RADAR BEACON (60s) 📡' },
      { type: 'REINFORCE_ALL', label: 'TOTAL ARSENAL DEPLOY (সব ৬টি যুদ্ধাস্ত্র) ⚡' },
      { type: 'AIR_STRIKE', label: 'AIR STRIKE BEACON 💥' },
      { type: 'SHIELD', label: 'ENERGY SHIELD' },
      { type: 'TRIPLE_ROCKET', label: 'TRIPLE ROCKETS' },
      { type: 'HOMING_MISSILES', label: 'HOMING MISSILES' },
      { type: 'MULTI_JUMP', label: 'MULTI-JUMP BOOTS' },
      { type: 'RAPID_FIRE', label: 'RAPID FIRE' },
    ];

    // Smart supply: if player is hurt, prioritize medical aid; if empty ammo, drop rockets; if vehicles damaged, drop repair kit!
    let pick = powerups[Math.floor(Math.random() * powerups.length)];
    const hasDamagedVehicle = 
      (this.friendlyTank && (this.friendlyTank.health ?? 12) < 10) ||
      (this.autoTurret && (this.autoTurret.health ?? 8) < 6) ||
      (this.himarsTruck && (this.himarsTruck.health ?? 8) < 6) ||
      (this.flakCannon && (this.flakCannon.health ?? 8) < 6) ||
      (this.radarStation && (this.radarStation.health ?? 8) < 6);

    if (preferredType) {
      const found = powerups.find((p) => p.type === preferredType);
      if (found) pick = found;
    } else if (this.player.health < 40) {
      pick = powerups[0]; // FIELD MEDKIT
    } else if (hasDamagedVehicle && Math.random() < 0.5) {
      pick = powerups[2]; // FIELD REPAIR KIT
    } else if (this.player.ammo <= 1) {
      pick = powerups[1]; // ROCKET AMMO REFILL
    } else if (this.aircrafts.length >= 4 && Math.random() < 0.45) {
      pick = powerups[10]; // AIR STRIKE
    }

    this.crates.push({
      id: nextId(),
      type: pick.type,
      label: pick.label,
      x,
      y: 20,
      vy: 60,
      parachute: true,
      hasLanded: false,
      pulseTimer: 0,
      lifetime: 14.0, // Stays 14s then vanishes into thin air ("অটোমেটিক হাওয়া হয়ে যাবে")!
      maxLifetime: 14.0,
    });
  }

  private updateCrates(dt: number) {
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];

      if (!c.hasLanded) {
        c.y += c.vy * dt;
        const gY = getTerrainY(c.x, this.terrain);
        if (c.y >= gY - 14) {
          c.y = gY - 14;
          c.hasLanded = true;
        }
      } else {
        // Once landed, timer counts down. After specific time, automatically vanishes ("অটোমেটিক হাওয়া হয়ে যাবে")
        c.lifetime -= dt;
        if (c.lifetime <= 0) {
          // Vanish with sparkle puff particles into thin air!
          for (let p = 0; p < 16; p++) {
            this.particles.push({
              id: nextId(),
              x: c.x + (Math.random() - 0.5) * 24,
              y: c.y + (Math.random() - 0.5) * 24,
              vx: (Math.random() - 0.5) * 60,
              vy: -Math.random() * 80 - 20,
              size: 2.5,
              color: '#fef08a',
              alpha: 1,
              life: 0.65,
              maxLife: 0.65,
            });
          }
          this.addFloatingText('হাওয়া হয়ে গেছে! 💨 (VANISHED)', c.x, c.y - 18, '#cbd5e1');
          this.crates.splice(i, 1);
          continue;
        }
      }

      const dist = Math.hypot(c.x - this.player.x, c.y - (this.player.y - 14));
      if (dist < 36) {
        this.collectCrate(c);
        this.crates.splice(i, 1);
      }
    }
  }

  private collectCrate(crate: AirdropCrate) {
    this.stats.cratesCollected++;
    sound.playCratePickup();
    this.addScore(150, crate.x, crate.y);
    this.player.credits += 120;
    this.addFloatingText(crate.label, this.player.x, this.player.y - 34, '#ffffff');

    if (crate.type === 'HEALTH') {
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 40);
    } else if (crate.type === 'AMMO_REFILL') {
      this.player.ammo = this.player.maxAmmo;
      this.player.reloadProgress = 1;
      this.addFloatingText('ROCKETS REFILLED! 🚀', this.player.x, this.player.y - 48, '#38bdf8');
    } else if (crate.type === 'REPAIR_VEHICLES') {
      this.repairAllVehicles();
    } else if (crate.type === 'REINFORCE_SAM') {
      this.buyAutoLauncher(true);
    } else if (crate.type === 'REINFORCE_TANK') {
      this.buyFriendlyTank(true);
    } else if (crate.type === 'REINFORCE_DRONE') {
      this.buyFriendlyDrone(true);
    } else if (crate.type === 'REINFORCE_HIMARS') {
      this.buyHimarsTruck(true);
    } else if (crate.type === 'REINFORCE_FLAK') {
      this.buyFlakCannon(true);
    } else if (crate.type === 'REINFORCE_RADAR') {
      this.buyRadarStation(true);
    } else if (crate.type === 'REINFORCE_ALL') {
      this.deployAllArsenal(true);
    } else if (crate.type === 'AIR_STRIKE') {
      this.triggerAirStrike();
    } else if (crate.type === 'MULTI_JUMP') {
      this.player.maxJumps = 3;
      this.player.jumpsRemaining = 3;
      this.player.activePowerup = { type: 'MULTI_JUMP', duration: 20, totalDuration: 20 };
    } else if (crate.type === 'TRIPLE_ROCKET') {
      this.player.activePowerup = { type: 'TRIPLE_ROCKET', duration: 16, totalDuration: 16 };
    } else if (crate.type === 'HOMING_MISSILES') {
      this.player.activePowerup = { type: 'HOMING_MISSILES', duration: 16, totalDuration: 16 };
    } else if (crate.type === 'RAPID_FIRE') {
      this.player.activePowerup = { type: 'RAPID_FIRE', duration: 14, totalDuration: 14 };
    } else if (crate.type === 'SHIELD') {
      this.player.shieldHits = 3;
    }
  }

  private createExplosion(x: number, y: number, intensity: 'small' | 'medium' | 'big') {
    sound.playExplosion(intensity);
    const count = intensity === 'big' ? 24 : 12;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        id: nextId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? '#f97316' : '#eab308',
        alpha: 1,
        life: 0.4,
        maxLife: 0.4,
        gravity: 80,
      });
    }
  }

  private createSmokeRingExplosion(x: number, y: number) {
    const ringDots = 38;
    for (let i = 0; i < ringDots; i++) {
      const angle = (i / ringDots) * Math.PI * 2;
      const speed = 72 + Math.random() * 12;

      this.particles.push({
        id: nextId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.2,
        color: '#111827',
        alpha: 1,
        life: 0.85,
        maxLife: 0.85,
        isRingSmoke: true,
      });
    }

    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 95;
      this.particles.push({
        id: nextId(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? '#f59e0b' : '#fde047',
        alpha: 1,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        gravity: 120,
      });
    }
  }

  private updateParticles(dt: number) {
    // Hard cap on active particles to guarantee buttery-smooth 60-120fps on all devices
    if (this.particles.length > 65) {
      this.particles.splice(0, this.particles.length - 65);
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private updateFloatingTexts(dt: number) {
    if (this.floatingTexts.length > 15) {
      this.floatingTexts.splice(0, this.floatingTexts.length - 15);
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      t.alpha = Math.max(0, t.life / 1.1);
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public addScore(points: number, x: number, y: number) {
    this.stats.score += points;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
      localStorage.setItem('air_attack_highscore', this.stats.highScore.toString());
    }
    this.addFloatingText(`+${points}`, x, y, '#ffffff');
  }

  public addFloatingText(text: string, x: number, y: number, color = '#ffffff') {
    this.floatingTexts.push({
      id: nextId(),
      text,
      x,
      y,
      color,
      size: 9,
      alpha: 1,
      vy: -30,
      life: 1.1,
    });
  }
}
