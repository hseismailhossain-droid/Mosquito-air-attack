import React from 'react';
import { GameStats } from '../types';
import { RotateCcw, Home, Award, Plane, Target, Package } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onHome,
}) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;
  const accuracy = stats.shotsFired > 0 
    ? Math.round((stats.shotsHit / stats.shotsFired) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border-2 border-red-600/80 rounded-2xl max-w-md w-full p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="inline-block bg-red-600 text-white font-pixel text-xs px-3 py-1 rounded mb-3 tracking-widest">
          MISSION FAILED
        </div>

        <h2 className="text-2xl md:text-3xl font-pixel text-red-400 drop-shadow mb-1">
          GAME OVER
        </h2>
        <p className="text-xs text-slate-400 font-pixel mb-5">
          THE HILLS HAVE FALLEN
        </p>

        {isNewHighScore && (
          <div className="mb-4 bg-amber-950/80 border border-amber-500/60 p-2.5 rounded-lg flex items-center justify-center gap-2 text-amber-300 font-pixel text-xs animate-bounce">
            <Award className="w-4 h-4 text-amber-400" />
            <span>NEW RECORD HIGH SCORE!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3 mb-6 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
            <span className="text-xs font-pixel text-slate-400">FINAL SCORE</span>
            <span className="text-lg font-pixel text-emerald-400 tabular-nums">
              {stats.score}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="font-pixel text-[10px] text-amber-400">WAVE:</span>
              <span className="font-pixel text-[11px] text-white tabular-nums">{stats.currentWave}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-sm">🦟</span>
              <span className="font-pixel text-[10px] text-emerald-400">মশা খতম:</span>
              <span className="font-pixel text-[11px] text-white tabular-nums">{stats.mosquitoesDestroyed ?? stats.planesDestroyed}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-sm">🥚</span>
              <span className="font-pixel text-[10px] text-yellow-400">ডিম ধ্বংস:</span>
              <span className="font-pixel text-[11px] text-white tabular-nums">{stats.eggsDestroyed ?? stats.bombsShotDown}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span className="font-pixel text-[10px] text-slate-400">ACCURACY:</span>
              <span className="font-pixel text-[11px] text-white tabular-nums">{accuracy}%</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-sm">👑</span>
              <span className="font-pixel text-[10px] text-purple-400">রানী মশা:</span>
              <span className="font-pixel text-[11px] text-amber-300 tabular-nums">{stats.bossesDefeated || 0}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-sm">🔥</span>
              <span className="font-pixel text-[10px] text-amber-400">STREAK:</span>
              <span className="font-pixel text-[11px] text-amber-300 tabular-nums">x{stats.maxCombo || 0}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRestart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-pixel text-xs rounded-xl shadow-lg transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>TRY AGAIN</span>
          </button>

          <button
            onClick={onHome}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-pixel text-xs rounded-xl shadow-md transition cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
