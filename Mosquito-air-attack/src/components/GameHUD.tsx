import React from 'react';
import { GameEngine } from '../gameEngine';
import { Volume2, VolumeX, Pause, Play, Shield, Zap, Footprints, Flame, Crosshair, Heart, Wrench, ChevronLeft, ChevronRight, ArrowUp, Rocket, Wind, Repeat } from 'lucide-react';

interface GameHUDProps {
  engine: GameEngine;
  isPaused: boolean;
  onTogglePause: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onJumpPress: () => void;
  onMoveLeftStart: () => void;
  onMoveLeftEnd: () => void;
  onMoveRightStart: () => void;
  onMoveRightEnd: () => void;
  onShootPress: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = React.memo(({
  engine,
  isPaused,
  onTogglePause,
  soundEnabled,
  onToggleSound,
  onJumpPress,
  onMoveLeftStart,
  onMoveLeftEnd,
  onMoveRightStart,
  onMoveRightEnd,
  onShootPress,
}) => {
  // Isolated HUD refresh timer: updates ONLY the HUD DOM elements without re-rendering App or GameCanvas!
  const [, setHudTick] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHudTick((t) => (t + 1) % 1000);
    }, 140);
    return () => clearInterval(interval);
  }, []);

  const p = engine.player;
  const powerup = p.activePowerup;

  const hpRatio = Math.max(0, p.health / p.maxHealth);
  const hpTextColor = hpRatio > 0.5 ? 'text-emerald-400' : hpRatio > 0.25 ? 'text-amber-400' : 'text-red-400 animate-pulse';
  const hpBorderColor = hpRatio > 0.5 ? 'border-emerald-500/60' : hpRatio > 0.25 ? 'border-amber-500/60' : 'border-red-500 animate-pulse';

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-1 md:p-2 select-none z-20 overflow-hidden">
      {/* Health is shown directly with the mosquitoes in-world, no display clutter on HUD */}

      {/* ALL OPTIONS & CONTROLS STRICTLY AT THE GREEN DRAWN LINE AT SCREEN BOTTOM (সবুজ দাগটার লাইনে) */}
      <div className="w-full flex items-end justify-between pointer-events-auto pb-0.5 px-0.5 md:px-2 gap-1 z-20">
        {/* Left Thumb: Directional Round Switches + Tactical Dash Roll */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
          {/* Circular Switch: Move Left */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onMoveLeftStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onMoveLeftEnd(); }}
            onMouseDown={onMoveLeftStart}
            onMouseUp={onMoveLeftEnd}
            onMouseLeave={onMoveLeftEnd}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-slate-950/85 active:bg-emerald-600/80 border-2 border-slate-600/80 active:border-emerald-400 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer select-none touch-none"
            title="Move Left"
          >
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-emerald-400 drop-shadow-md" />
          </button>

          {/* Circular Switch: Move Right */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onMoveRightStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onMoveRightEnd(); }}
            onMouseDown={onMoveRightStart}
            onMouseUp={onMoveRightEnd}
            onMouseLeave={onMoveRightEnd}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-slate-950/85 active:bg-emerald-600/80 border-2 border-slate-600/80 active:border-emerald-400 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all cursor-pointer select-none touch-none"
            title="Move Right"
          >
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-emerald-400 drop-shadow-md" />
          </button>

          {/* Circular Switch: Tactical Dodge Roll / Dash */}
          <button
            onClick={() => engine.performTacticalDash()}
            disabled={p.dashCooldown > 0}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition-all active:scale-90 cursor-pointer select-none touch-none ${
              p.dashCooldown <= 0
                ? 'bg-cyan-950/85 active:bg-cyan-600 border-cyan-400 text-cyan-200'
                : 'bg-slate-950/60 border-slate-700 text-slate-500 opacity-60'
            }`}
            title="Tactical Evade Roll / Dash (Invulnerable Dodge)"
          >
            <Wind className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-[6px] font-pixel leading-none mt-0.5 text-cyan-200">
              {p.dashCooldown > 0 ? `${p.dashCooldown.toFixed(1)}s` : 'DASH'}
            </span>
          </button>
        </div>

        {/* CENTER UNDERGROUND DOCK: Everything in 1 Single Line (এক লাইনে ছোট করে সব সাজানো) */}
        <div className="flex-1 flex items-center justify-center px-0.5 min-w-0 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-1 md:gap-1.5 bg-slate-950/92 px-2 py-1 rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md max-w-full overflow-x-auto text-[7px] md:text-[8px] font-pixel scrollbar-none">
            {/* 1. Lifeline HP */}
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border ${hpBorderColor} bg-slate-900/90 shrink-0`}>
              <Heart className="w-2.5 h-2.5 fill-red-500 text-red-500 animate-pulse" />
              <span className={`font-bold ${hpTextColor}`}>{p.health}%</span>
            </div>

            {/* 2. Ammo & Weapon Mode */}
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-sky-500/50 bg-slate-900/90 shrink-0">
              <span className="text-[9px] leading-none">
                {p.weaponMode === 'FLAK' ? '💥' : p.weaponMode === 'LASER' ? '⚡' : '🚀'}
              </span>
              <span className={`font-bold ${p.isFrenzyActive ? 'text-amber-400 animate-bounce' : p.ammo > 0 ? 'text-sky-400' : 'text-amber-400 animate-pulse'}`}>
                {p.isFrenzyActive ? 'INF' : p.ammo > 0 ? `${p.ammo}/${p.maxAmmo}` : 'REL'}
              </span>
            </div>

            {/* 3. Shield Badge (if active) */}
            {p.shieldHits > 0 && (
              <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-full border border-cyan-400/60 bg-cyan-950/80 text-cyan-300 shrink-0">
                <Shield className="w-2.5 h-2.5 fill-cyan-400/30" />
                <span>x{p.shieldHits}</span>
              </div>
            )}

            {/* 4. Wave, Money & Score */}
            <span className="text-amber-400 font-bold shrink-0">W{engine.currentWave}</span>
            <span className="text-emerald-400 font-bold shrink-0">${p.credits}</span>
            <span className="text-slate-300 shrink-0">{engine.stats.score}</span>

            {/* Divider */}
            <span className="w-px h-3.5 bg-slate-700/80 shrink-0 mx-0.5" />

            {/* 5. Compact Tactical Buttons (সব এক লাইনে ছোট বোতাম) */}
            {/* Super Nuke */}
            <button
              onClick={() => engine.triggerSuperNuke()}
              disabled={p.rageMeter < 100}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.rageMeter >= 100
                  ? 'bg-amber-950 border-amber-400 ring-2 ring-yellow-400 animate-bounce text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'
              }`}
              title="Super EMP Orbital Shockwave"
            >
              <Zap className={`w-2.5 h-2.5 ${p.rageMeter >= 100 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.rageMeter >= 100 ? 'NUKE' : `${Math.floor(p.rageMeter)}%`}
              </span>
            </button>

            {/* 1. HIMARS MLRS Rocket Artillery Truck (1790870270967.jpg top-left) */}
            <button
              onClick={() => engine.buyHimarsTruck()}
              disabled={!p.hasHimarsTruck && p.credits < 300 && engine.currentWave < 5}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.hasHimarsTruck
                  ? 'bg-amber-950 border-amber-400 ring-1 ring-amber-400 animate-pulse text-amber-300'
                  : p.credits >= 300 || engine.currentWave >= 5
                  ? 'bg-slate-900 hover:bg-amber-900 border-amber-500 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="HIMARS Rocket Artillery Truck ($300) - হাইমার্স রকেট ট্রাক"
            >
              <span className="text-[9px] leading-none">🚀</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.hasHimarsTruck ? `${Math.ceil(p.himarsTruckTimeRemaining || 60)}s` : '$300'}
              </span>
            </button>

            {/* 2. Main Battle Tank (1790870270967.jpg top-center) */}
            <button
              onClick={() => engine.buyFriendlyTank()}
              disabled={!p.hasFriendlyTank && p.credits < 350 && engine.currentWave < 3}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.hasFriendlyTank
                  ? 'bg-blue-950 border-blue-400 ring-1 ring-blue-400 animate-pulse text-blue-300'
                  : p.credits >= 350 || engine.currentWave >= 3
                  ? 'bg-slate-900 hover:bg-blue-900 border-blue-500 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Heavy Main Battle Tank ($350) - আর্মার্ড ব্যাটল ট্যাঙ্ক"
            >
              <span className="text-[9px] leading-none">🛡️</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.hasFriendlyTank ? `${Math.ceil(p.friendlyTankTimeRemaining || 60)}s` : '$350'}
              </span>
            </button>

            {/* 3. Patriot SAM Long-Range Missile Battery (1790870270967.jpg top-right) */}
            <button
              onClick={() => engine.buyAutoLauncher()}
              disabled={!p.hasAutoLauncher && p.credits < 350 && engine.currentWave < 2}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.hasAutoLauncher
                  ? 'bg-emerald-950 border-emerald-400 ring-1 ring-emerald-400 animate-pulse text-emerald-300'
                  : p.credits >= 350 || engine.currentWave >= 2
                  ? 'bg-slate-900 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Patriot SAM Missile Battery ($350) - প্যাট্রিয়ট মিসাইল ট্রাক"
            >
              <span className="text-[9px] leading-none">🎯</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.hasAutoLauncher ? `${Math.ceil(p.autoLauncherTimeRemaining || 60)}s` : '$350'}
              </span>
            </button>

            {/* 4. Dual Flak Autocannon Mobile AA (1790870270967.jpg bottom-left) */}
            <button
              onClick={() => engine.buyFlakCannon()}
              disabled={!p.hasFlakCannon && p.credits < 250 && engine.currentWave < 6}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.hasFlakCannon
                  ? 'bg-cyan-950 border-cyan-400 ring-1 ring-cyan-400 animate-pulse text-cyan-300'
                  : p.credits >= 250 || engine.currentWave >= 6
                  ? 'bg-slate-900 hover:bg-cyan-900 border-cyan-500 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Dual Flak Autocannon AA ($250) - ডুয়েল অ্যান্টি-এয়ারক্রাফট কামান"
            >
              <span className="text-[9px] leading-none">💥</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.hasFlakCannon ? `${Math.ceil(p.flakCannonTimeRemaining || 60)}s` : '$250'}
              </span>
            </button>

            {/* 5. MQ-9 Predator Strike Drone (1790870270967.jpg bottom-center) */}
            <button
              onClick={() => engine.buyFriendlyDrone()}
              disabled={!p.hasFriendlyDrone && p.credits < 300 && engine.currentWave < 4}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.hasFriendlyDrone
                  ? 'bg-purple-950 border-purple-400 ring-1 ring-purple-400 animate-pulse text-purple-300'
                  : p.credits >= 300 || engine.currentWave >= 4
                  ? 'bg-slate-900 hover:bg-purple-900 border-purple-500 text-purple-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="MQ-9 Predator Combat Drone ($300) - প্রিডেটর কমব্যাট ড্রোন"
            >
              <span className="text-[9px] leading-none">🛸</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.hasFriendlyDrone ? `${Math.ceil(p.friendlyDroneTimeRemaining || 60)}s` : '$300'}
              </span>
            </button>

            {/* 6. 3D Phased-Array Air Defense Radar (1790870270967.jpg bottom-right) */}
            <button
              onClick={() => engine.buyRadarStation()}
              disabled={!p.hasRadarStation && p.credits < 200 && engine.currentWave < 7}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.hasRadarStation
                  ? 'bg-emerald-950 border-emerald-400 ring-1 ring-emerald-400 animate-pulse text-emerald-300'
                  : p.credits >= 200 || engine.currentWave >= 7
                  ? 'bg-slate-900 hover:bg-emerald-900 border-emerald-500 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="3D Phased-Array Radar Truck ($200) - ফেজড-অ্যারে রাডার স্টেশন"
            >
              <span className="text-[9px] leading-none">📡</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.hasRadarStation ? `${Math.ceil(p.radarStationTimeRemaining || 60)}s` : '$200'}
              </span>
            </button>

            {/* 7. ALL 6 WAR MACHINES DEPLOY (সব যুদ্ধাস্ত্র এক ক্লিকে) */}
            <button
              onClick={() => engine.deployAllArsenal()}
              disabled={p.credits < 500}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.credits >= 500
                  ? 'bg-gradient-to-tr from-amber-600 to-yellow-400 border-yellow-200 text-slate-950 font-bold animate-pulse'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="DEPLOY ALL 6 WAR MACHINES ($500) - সব ৬টি যুদ্ধাস্ত্র একসাথে মোতায়েন"
            >
              <span className="text-[9px] leading-none">⚡</span>
              <span className="text-[5px] font-pixel leading-none font-bold text-slate-950">
                ALL
              </span>
            </button>

            {/* 8. FRENZY OVERDRIVE (মশক নিধন উন্মাদনা - সীমাহীন দ্রুত ফায়ার) */}
            <button
              onClick={() => engine.triggerFrenzyMode()}
              disabled={p.isFrenzyActive || p.credits < 200}
              className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                p.isFrenzyActive
                  ? 'bg-amber-500 border-yellow-200 text-slate-950 font-bold animate-bounce ring-2 ring-yellow-400'
                  : p.credits >= 200
                  ? 'bg-amber-950 hover:bg-amber-900 border-amber-400 text-amber-200'
                  : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
              }`}
              title="Frenzy Overdrive ($200) - মশক নিধন উন্মাদনা (সীমাহীন বুলেট)"
            >
              <span className="text-[9px] leading-none">🔥</span>
              <span className="text-[5px] font-pixel leading-none font-bold">
                {p.isFrenzyActive ? `${Math.ceil(p.frenzyTimer || 0)}s` : 'FRNZ'}
              </span>
            </button>

            {/* Small Weapon Switches (যুদ্ধাস্ত্রের ছোট ছোট সুইচ) */}
            <div className="flex items-center gap-0.5 bg-slate-950/90 p-0.5 rounded-full border border-slate-700/80 shrink-0">
              {/* Rocket Switch */}
              <button
                onClick={() => engine.setWeaponMode('ROCKET')}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 cursor-pointer shrink-0 ${
                  p.weaponMode === 'ROCKET'
                    ? 'bg-red-950 border-red-400 ring-2 ring-red-400 text-red-200 shadow-md shadow-red-500/30'
                    : 'bg-slate-900 hover:bg-red-950/50 border-slate-700 text-slate-400'
                }`}
                title="Heavy Rocket RPG (হেভি রকেট) - বিধ্বংসী রকেট অস্ত্র"
              >
                <span className="text-[9px] leading-none">🚀</span>
                <span className="text-[5px] font-pixel leading-none font-bold">RCK</span>
              </button>

              {/* Flak Switch */}
              <button
                onClick={() => engine.setWeaponMode('FLAK')}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 cursor-pointer shrink-0 ${
                  p.weaponMode === 'FLAK'
                    ? 'bg-amber-950 border-amber-400 ring-2 ring-amber-400 text-amber-200 shadow-md shadow-amber-500/30'
                    : 'bg-slate-900 hover:bg-amber-950/50 border-slate-700 text-slate-400'
                }`}
                title="AA Rapid Flak Autocannon (অটো কামান) - ঝাঁক ধ্বংসে দ্রুত বুলেট"
              >
                <span className="text-[9px] leading-none">💥</span>
                <span className="text-[5px] font-pixel leading-none font-bold">FLK</span>
              </button>

              {/* Laser Switch */}
              <button
                onClick={() => engine.setWeaponMode('LASER')}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 cursor-pointer shrink-0 ${
                  p.weaponMode === 'LASER'
                    ? 'bg-sky-950 border-sky-400 ring-2 ring-sky-400 text-sky-200 shadow-md shadow-sky-500/30'
                    : 'bg-slate-900 hover:bg-sky-950/50 border-slate-700 text-slate-400'
                }`}
                title="Ion Plasma Laser Beam (আয়ন লেজার) - উচ্চ ভেদনক্ষম লেজার"
              >
                <span className="text-[9px] leading-none">⚡</span>
                <span className="text-[5px] font-pixel leading-none font-bold">LSR</span>
              </button>
            </div>

            {/* Emergency Vehicle Repair */}
            <button
              onClick={() => engine.repairAllVehicles()}
              className="w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border border-emerald-400 bg-slate-900 hover:bg-emerald-950 active:scale-90 shadow-md cursor-pointer shrink-0 text-emerald-300"
              title="Emergency Battlefield Repair - সমস্ত ক্ষতিগ্রস্থ যুদ্ধাস্ত্র দ্রুত মেরামত"
            >
              <Wrench className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[5px] font-pixel leading-none font-bold text-emerald-400">REP</span>
            </button>

            {/* Heal Player Medkit */}
            {p.health < p.maxHealth && (
              <button
                onClick={() => engine.buyHealthRepair()}
                disabled={p.credits < 120}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-full flex flex-col items-center justify-center border transition-all active:scale-90 shadow-md cursor-pointer shrink-0 ${
                  p.credits >= 120
                    ? 'bg-teal-950 hover:bg-teal-900 border-teal-400 text-teal-200 shadow-teal-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                }`}
                title="Heal Player +50 HP ($120)"
              >
                <Heart className="w-2.5 h-2.5 text-teal-300" />
                <span className="text-[5px] font-pixel leading-none font-bold text-teal-300">$120</span>
              </button>
            )}

            {/* Divider */}
            <span className="w-px h-3.5 bg-slate-700/80 shrink-0 mx-0.5" />

            {/* Sound & Pause Controls */}
            <button
              onClick={onToggleSound}
              className="w-5 h-5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-90 border border-slate-700 flex items-center justify-center text-slate-200 shadow transition-all cursor-pointer shrink-0"
              title={soundEnabled ? 'Mute' : 'Sound'}
            >
              {soundEnabled ? <Volume2 className="w-2.5 h-2.5 text-emerald-400" /> : <VolumeX className="w-2.5 h-2.5 text-red-400" />}
            </button>
            <button
              onClick={onTogglePause}
              className="w-5 h-5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-90 border border-slate-700 flex items-center justify-center text-slate-200 shadow transition-all cursor-pointer shrink-0"
              title="Pause"
            >
              {isPaused ? <Play className="w-2.5 h-2.5 text-green-400" /> : <Pause className="w-2.5 h-2.5 text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Right Thumb: Weapon Mode, Tunnel, Jump & Fire Switches */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
          {/* Circular Switch: Weapon Switch (Heavy Rocket vs AA Flak vs Ion Laser) */}
          <button
            onClick={() => engine.toggleWeaponMode()}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-indigo-950/85 active:bg-indigo-600 border-2 border-indigo-400/80 active:border-indigo-300 text-white flex flex-col items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer select-none touch-none"
            title="Toggle Weapon: Heavy Rocket 🚀 / AA Flak 💥 / Ion Laser ⚡"
          >
            <span className="text-xs">{p.weaponMode === 'FLAK' ? '💥' : p.weaponMode === 'LASER' ? '⚡' : '🚀'}</span>
            <span className="text-[5.5px] font-pixel leading-none mt-0.5 text-indigo-200">
              {p.weaponMode === 'FLAK' ? 'FLAK' : p.weaponMode === 'LASER' ? 'LASER' : 'RCKT'}
            </span>
          </button>

          {/* Circular Switch: Subterranean Bunker Tunnel Toggle (মাটির নিচে টানেল সুইচ) */}
          <button
            onClick={() => engine.toggleTunnelCover()}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-full flex flex-col items-center justify-center border-2 shadow-xl transition-all active:scale-90 cursor-pointer select-none touch-none ${
              p.isInTunnel
                ? 'bg-amber-950/95 border-amber-400 text-amber-200 ring-2 ring-amber-400/80 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800 active:bg-slate-700 border-slate-500 text-slate-200 hover:border-amber-400'
            }`}
            title="Underground Bunker Tunnel (মাটির নিচের টানেল / আশ্রয় ও আক্রমণ)"
          >
            <span className="text-xs">{p.isInTunnel ? '🛡️' : '🪜'}</span>
            <span className="text-[5.5px] font-pixel leading-none mt-0.5 text-center font-bold">
              {p.isInTunnel ? 'EXIT' : 'BUNKER'}
            </span>
          </button>

          {/* Circular Switch: Jump */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onJumpPress(); }}
            onMouseDown={onJumpPress}
            className="relative w-11 h-11 md:w-12 md:h-12 rounded-full bg-blue-950/85 active:bg-blue-600 border-2 border-blue-500/80 active:border-blue-400 text-white flex flex-col items-center justify-center shadow-xl shadow-blue-500/20 active:scale-90 transition-all cursor-pointer select-none touch-none"
            title="Jump / Leap out of bunker"
          >
            <ArrowUp className="w-4 h-4 md:w-5 md:h-5 text-blue-300" />
            <span className="text-[6px] font-pixel text-blue-200 leading-none">JUMP</span>
            {p.maxJumps > 1 && (
              <span className="absolute -top-1 -right-1 text-[7px] font-pixel bg-amber-500 text-black px-1 rounded-full font-bold">
                x{p.jumpsRemaining}
              </span>
            )}
          </button>

          {/* Circular Switch: Attack / Shoot Rocket */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onShootPress(); }}
            onMouseDown={onShootPress}
            className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-2xl active:scale-90 transition-all cursor-pointer select-none touch-none ${
              p.isFrenzyActive
                ? 'bg-amber-600 active:bg-amber-500 border-yellow-300 shadow-yellow-500/50 ring-2 ring-yellow-400 animate-pulse'
                : p.ammo > 0
                ? p.weaponMode === 'FLAK'
                  ? 'bg-amber-950/90 active:bg-amber-600 border-amber-500 shadow-amber-500/30'
                  : p.weaponMode === 'LASER'
                  ? 'bg-sky-950/90 active:bg-sky-600 border-sky-400 shadow-sky-500/30'
                  : 'bg-red-950/90 active:bg-red-600 border-red-500 shadow-red-500/30'
                : 'bg-slate-950/80 border-slate-700 text-slate-500 opacity-80'
            }`}
            title="Fire Weapon (Rocket / Flak / Laser)"
          >
            {p.weaponMode === 'LASER' ? (
              <Zap className={`w-5 h-5 md:w-6 md:h-6 ${p.ammo > 0 || p.isFrenzyActive ? 'text-sky-300 fill-sky-400' : 'text-slate-500'}`} />
            ) : (
              <Rocket className={`w-5 h-5 md:w-6 md:h-6 ${p.ammo > 0 || p.isFrenzyActive ? (p.weaponMode === 'FLAK' ? 'text-amber-400' : 'text-red-400') : 'text-slate-500'}`} />
            )}
            <span className="text-[6px] md:text-[6.5px] font-pixel leading-none mt-0.5 text-red-200">
              {p.isFrenzyActive ? 'FRENZY' : p.ammo > 0 ? (p.weaponMode === 'FLAK' ? 'FLAK' : p.weaponMode === 'LASER' ? 'LASER' : 'FIRE') : 'RELOAD'}
            </span>
            {/* Ammo counter badge */}
            <span className={`absolute -top-1 -right-1 text-[7px] md:text-[8px] font-pixel px-1 rounded-full font-bold ${
              p.isFrenzyActive
                ? 'bg-amber-500 text-slate-950 ring-1 ring-yellow-200'
                : p.ammo > 0
                ? 'bg-red-600 text-white ring-1 ring-red-300'
                : 'bg-slate-700 text-slate-300'
            }`}>
              {p.isFrenzyActive ? '∞' : p.ammo}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});
