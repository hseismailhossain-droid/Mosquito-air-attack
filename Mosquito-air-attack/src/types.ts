export type GameMode = 'EASY' | 'HARD' | 'BOTTOMLESS';

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type ActiveModal = 'NONE' | 'INSTRUCTIONS' | 'CONTROLS' | 'SETTINGS' | 'SHOP';

export type MosquitoType = 
  | 'AEDES_MOSQUITO'       // ডেঙ্গু এডিস মশা (Black & white striped)
  | 'CULEX_MOSQUITO'       // সাধারণ কিউলেক্স মশা (Brown swarmer)
  | 'ANOPHELES_MOSQUITO'   // ম্যালেরিয়া অ্যানোফিলিস মশা (45-deg angled)
  | 'BLOODSUCKER_MOSQUITO' // রক্তচোষা মশা (Crimson swollen blood belly)
  | 'TOXIC_MUTANT_MOSQUITO'// বিষাক্ত মিউট্যান্ট মশা (Radioactive green glow)
  | 'SPEED_MOSQUITO'       // দ্রুতগতির ঝাঁক মশা (Swift darting mosquito)
  | 'QUEEN_MOSQUITO'       // দৈত্য রানী মশা (Titan Queen Boss)
  | 'ZIKA_VIRUS_MOSQUITO'  // জিকা ভাইরাস মশা (Cyan neon glowing bio-acid spitter)
  | 'CHIKUNGUNYA_MOSQUITO' // চিকুনগুনিয়া ভাইরাস মশা (Rapid erratic red virus kamikaze)
  | 'VIRUS_BIO_TITAN';     // বিষাক্ত ভাইরাস বায়ো-টাইটান (Giant corrosive virus titan)

// Backward compatibility alias for existing references
export type AircraftType = MosquitoType;

export type PowerupType = 
  | 'MULTI_JUMP' 
  | 'TRIPLE_ROCKET' 
  | 'HOMING_MISSILES' 
  | 'RAPID_FIRE' 
  | 'AIR_STRIKE' 
  | 'SHIELD' 
  | 'HEALTH'
  | 'REINFORCE_SAM'
  | 'REINFORCE_TANK'
  | 'REINFORCE_DRONE'
  | 'REINFORCE_HIMARS'
  | 'REINFORCE_FLAK'
  | 'REINFORCE_RADAR'
  | 'REINFORCE_ALL'
  | 'REPAIR_VEHICLES'
  | 'AMMO_REFILL';

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  aimAngle: number; // in radians
  isGrounded: boolean;
  health: number; // 0 to 100 Lifeline HP
  maxHealth: number; // 100
  ammo: number; // current rockets in magazine
  maxAmmo: number; // max magazine size (default 6)
  ammoRecoverTimer: number; // timer to recover 1 rocket
  ammoRecoverRate: number; // seconds per rocket recovery
  jumpsRemaining: number;
  maxJumps: number;
  isParachuting: boolean;
  reloadProgress: number; // 0 to 1
  shieldHits: number;
  credits: number; // in-game currency earned from kills to buy upgrades
  // 6 Military War Machines to eradicate mosquitos:
  hasAutoLauncher: boolean; // 1. Patriot SAM Missile Battery
  autoLauncherCooldown: number;
  autoLauncherTimeRemaining: number;
  hasFriendlyTank: boolean; // 2. Heavy Main Battle Tank
  friendlyTankTimeRemaining: number;
  hasFriendlyDrone: boolean; // 3. MQ-9 Predator Strike Drone
  friendlyDroneTimeRemaining: number;
  hasHimarsTruck: boolean; // 4. HIMARS / MLRS Rocket Artillery Truck
  himarsTruckTimeRemaining: number;
  hasFlakCannon: boolean; // 5. Dual Flak Autocannon Mobile AA
  flakCannonTimeRemaining: number;
  hasRadarStation: boolean; // 6. 3D Phased-Array Air Defense Radar Truck
  radarStationTimeRemaining: number;
  activePowerup: {
    type: PowerupType;
    duration: number; // seconds remaining
    totalDuration: number;
  } | null;
  walkFrame: number;
  walkTimer: number;
  scale: number;
  rageMeter: number; // 0 to 100% Super Overdrive Rage
  maxRage: number; // 100
  weaponMode: 'ROCKET' | 'FLAK' | 'LASER'; // Switchable weapon mode: Rocket, Flak, or Ion Laser
  dashCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  isInTunnel: boolean; // inside underground fortified bunker
  isFrenzyActive?: boolean;
  frenzyTimer?: number;
}

export interface TunnelBunker {
  startX: number;
  endX: number;
  leftEntranceX: number;
  rightEntranceX: number;
  hatchOpeningX: number;
  hatchWidth: number;
}

export interface Aircraft {
  id: string;
  type: MosquitoType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  direction: 1 | -1;
  health: number;
  maxHealth: number;
  width: number;
  height: number;
  dropBombCooldown: number; // Egg drop cooldown
  gunCooldown: number;
  rotorAngle?: number;
  scoreValue: number;
  scale: number;
  wingFlapPhase: number;
  wingFlapSpeed: number;
  bobPhase: number;
  mosquitoNameBn?: string;
  isDivingToBite?: boolean;
  biteCooldown?: number;
  originalAltitude?: number;
  slowTimer?: number;
  flightPhase?: number;
  swoopTimer?: number;
  isEnraged?: boolean;
  biteAttackPrepTimer?: number;
  diveAngle?: number;
  stingerTargetX?: number;
  stingerTargetY?: number;
  stunTimer?: number;
  swoopDirectionY?: number;
  targetVehicleType?: 'TANK' | 'SAM' | 'HIMARS' | 'FLAK' | 'RADAR' | 'DRONE' | 'PLAYER';
  targetVehicleCoords?: { x: number; y: number };
}

export interface GroundTank {
  id: string;
  x: number;
  y: number;
  vx: number;
  direction: 1 | -1;
  health: number;
  maxHealth: number;
  cannonCooldown: number;
  turretAngle: number;
  width: number;
  height: number;
  isFriendly?: boolean;
  duration?: number;
  maxDuration?: number;
}

export interface AutoTurret {
  x: number;
  y: number;
  angle: number;
  cooldown: number;
  ammo: number;
  maxAmmo: number;
  reloadTimer: number;
  targetId: string | null;
  level: number;
  health: number;
  maxHealth: number;
  duration: number;
  maxDuration: number;
}

export interface FriendlyDrone {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetAngle: number;
  shootCooldown: number;
  ammo: number;
  maxAmmo: number;
  reloadTimer: number;
  health: number;
  maxHealth: number;
  duration: number;
  maxDuration: number;
}

// 4. HIMARS / MLRS Multi-Launch Rocket Artillery Truck (Reference: 1790870270967.jpg top-left)
export interface HimarsTruck {
  id: string;
  x: number;
  y: number;
  angle: number;
  ammo: number;
  maxAmmo: number;
  salvoCooldown: number;
  burstCount: number;
  burstTimer: number;
  targetId: string | null;
  health: number;
  maxHealth: number;
  duration: number;
  maxDuration: number;
}

// 5. Dual Flak Autocannon Mobile Anti-Air Platform (Reference: 1790870270967.jpg bottom-left)
export interface FlakCannonVehicle {
  id: string;
  x: number;
  y: number;
  vx: number;
  direction: 1 | -1;
  angle: number;
  cooldown: number;
  barrelIndex: 0 | 1;
  health: number;
  maxHealth: number;
  duration: number;
  maxDuration: number;
}

// 6. 3D Phased-Array Air Defense Radar Truck (Reference: 1790870270967.jpg bottom-right)
export interface RadarStationTruck {
  id: string;
  x: number;
  y: number;
  dishAngle: number;
  pulseTimer: number;
  pulseWaves: { radius: number; maxRadius: number; alpha: number }[];
  health: number;
  maxHealth: number;
  duration: number;
  maxDuration: number;
}

export interface EnemyBullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  isTracer?: boolean;
}

export interface Rocket {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  isHoming?: boolean;
  targetId?: string | null;
  isAutoTurretRocket?: boolean;
  fromTunnel?: boolean;
  life: number;
}

export type EggType = 'REGULAR' | 'AEDES' | 'BLOOD' | 'TOXIC' | 'QUEEN' | 'VIRUS_ACID';

export interface Bomb {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  scale: number;
  damage: number;
  eggType?: EggType;
  health?: number; // eggs can be shot down mid-air!
  wobble?: number;
  wobbleSpeed?: number;
}

export type MosquitoEgg = Bomb;

export interface BioAcidBlob {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  targetVehicleType?: 'TANK' | 'SAM' | 'HIMARS' | 'FLAK' | 'RADAR' | 'DRONE' | 'PLAYER';
  life: number;
  color: string;
  radius: number;
}

export interface AirdropCrate {
  id: string;
  type: PowerupType;
  label: string;
  x: number;
  y: number;
  vy: number;
  parachute: boolean;
  hasLanded: boolean;
  pulseTimer: number;
  lifetime: number;
  maxLifetime: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity?: number;
  isDebris?: boolean;
  isRingSmoke?: boolean;
  ringRadius?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  alpha: number;
  vy: number;
  life: number;
}

export interface Tree {
  x: number;
  type: 'LEAFY' | 'DEAD' | 'STUMP';
  height: number;
  health: number;
}

export interface Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;
  opacity: number;
}

export interface EnemyParatrooper {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  isGrounded: boolean;
  facing: 1 | -1;
  shootCooldown: number;
}

export interface FallingWreckage {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  angularVelocity: number;
  type: AircraftType;
  direction: 1 | -1;
  scale: number;
  smokeTimer: number;
}

export interface CruiseMissile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  health: number;
  trailTimer: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  screenShakeEnabled: boolean;
  showTouchControls: boolean;
}

export interface GameStats {
  score: number;
  highScore: number;
  currentWave: number;
  planesDestroyed: number;
  bombsShotDown: number;
  mosquitoesDestroyed: number;
  eggsDestroyed: number;
  cratesCollected: number;
  shotsFired: number;
  shotsHit: number;
  combo: number;
  maxCombo: number;
  bossesDefeated: number;
}

export type TimeOfDay = 'DAY' | 'DUSK' | 'NIGHT' | 'RAIN';

export interface BadgePopup {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  reward: number;
  timer: number;
  alpha: number;
}

export interface ElectricArc {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  life: number;
}

export interface ChemicalSmoke {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface Raindrop {
  x: number;
  y: number;
  speed: number;
  len: number;
}

