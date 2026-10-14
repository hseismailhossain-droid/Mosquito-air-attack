import React, { useState } from 'react';
import { GameMode, ActiveModal } from '../types';
import { Maximize2 } from 'lucide-react';

interface MainMenuProps {
  onStartGame: (mode: GameMode, startAtBoss?: boolean) => void;
  onOpenModal: (modal: ActiveModal) => void;
  onRandomizeTerrain: () => void;
  onRequestModeSelect: (mode: GameMode) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartGame,
  onOpenModal,
  onRandomizeTerrain,
  onRequestModeSelect,
}) => {
  const [menuView, setMenuView] = useState<'ROOT' | 'MODES'>('ROOT');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-end items-center pb-6 md:pb-10 pointer-events-auto select-none">
      {/* Subtle Fullscreen Switch */}
      <div className="absolute top-3 right-3 pointer-events-auto">
        <button
          onClick={toggleFullscreen}
          className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 shadow-md backdrop-blur-xs transition cursor-pointer"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Menu Buttons Row (matching video 00:01 - 00:02) */}
      {menuView === 'ROOT' ? (
        <div className="flex items-center gap-2 md:gap-3 px-3 py-2 bg-black/50 backdrop-blur-xs rounded-xl border border-slate-700/60 shadow-2xl">
          {/* PLAY Button */}
          <button
            onClick={() => setMenuView('MODES')}
            className="flex flex-col items-center justify-between w-16 h-18 md:w-20 md:h-22 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            {/* Soldier with bazooka icon */}
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-9 h-9">
                {/* Soldier body */}
                <rect x="12" y="14" width="8" height="10" fill="#3f5627" />
                <rect x="10" y="24" width="4" height="6" fill="#1e3818" />
                <rect x="18" y="24" width="4" height="6" fill="#1e3818" />
                {/* Helmet */}
                <rect x="13" y="6" width="6" height="5" fill="#2d4019" />
                <rect x="14" y="11" width="5" height="3" fill="#f5c6a5" />
                {/* Bazooka pointing up-right */}
                <line x1="8" y1="20" x2="24" y2="4" stroke="#475569" strokeWidth="4" />
                <polygon points="23,3 27,7 25,1" fill="#ef4444" />
              </svg>
            </div>
            <span className="font-pixel text-[8px] md:text-[9px] text-white tracking-wider">PLAY</span>
          </button>

          {/* CONTROLS Button */}
          <button
            onClick={() => onOpenModal('CONTROLS')}
            className="flex flex-col items-center justify-between w-16 h-18 md:w-20 md:h-22 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-9 h-9">
                <rect x="6" y="8" width="20" height="16" rx="3" fill="#0284c7" />
                <circle x="12" y="16" r="3" fill="#ffffff" />
                <rect x="11" y="13" width="2" height="6" fill="#0f172a" />
                <rect x="9" y="15" width="6" height="2" fill="#0f172a" />
                <circle cx="21" cy="14" r="1.5" fill="#ef4444" />
                <circle cx="23" cy="18" r="1.5" fill="#eab308" />
              </svg>
            </div>
            <span className="font-pixel text-[8px] md:text-[9px] text-white tracking-wider">CONTROLS</span>
          </button>

          {/* SHOP / UPGRADES Button */}
          <button
            onClick={() => onOpenModal('INSTRUCTIONS')}
            className="flex flex-col items-center justify-between w-16 h-18 md:w-20 md:h-22 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-9 h-9">
                <rect x="8" y="10" width="16" height="16" rx="2" fill="#e2e8f0" />
                <path d="M12,10 C12,6 20,6 20,10" fill="none" stroke="#475569" strokeWidth="2" />
                <polygon points="16,14 12,19 15,19 15,23 17,23 17,19 20,19" fill="#16a34a" />
              </svg>
            </div>
            <span className="font-pixel text-[8px] md:text-[9px] text-white tracking-wider">UPGRADES</span>
          </button>

          {/* SETTINGS Button */}
          <button
            onClick={() => onOpenModal('SETTINGS')}
            className="flex flex-col items-center justify-between w-16 h-18 md:w-20 md:h-22 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-9 h-9">
                <circle cx="16" cy="16" r="6" fill="#94a3b8" />
                <circle cx="16" cy="16" r="3" fill="#1e293b" />
                <rect x="14" y="6" width="4" height="4" fill="#94a3b8" />
                <rect x="14" y="22" width="4" height="4" fill="#94a3b8" />
                <rect x="6" y="14" width="4" height="4" fill="#94a3b8" />
                <rect x="22" y="14" width="4" height="4" fill="#94a3b8" />
              </svg>
            </div>
            <span className="font-pixel text-[8px] md:text-[9px] text-white tracking-wider">SETTINGS</span>
          </button>

          {/* CLOSE Button */}
          <button
            onClick={() => onOpenModal('INSTRUCTIONS')}
            className="flex flex-col items-center justify-between w-16 h-18 md:w-20 md:h-22 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-9 h-9">
                <rect x="6" y="8" width="20" height="16" rx="2" fill="#1e293b" />
                <text x="16" y="15" fill="#f8fafc" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">AIR</text>
                <text x="16" y="20" fill="#ef4444" fontSize="5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ATTACK</text>
                <circle cx="24" cy="8" r="4" fill="#ef4444" />
                <text x="24" y="10" fill="#ffffff" fontSize="6" fontFamily="monospace" textAnchor="middle" fontWeight="bold">X</text>
              </svg>
            </div>
            <span className="font-pixel text-[8px] md:text-[9px] text-white tracking-wider">CLOSE</span>
          </button>
        </div>
      ) : (
        /* Game Modes Row (matching video 00:04 - 00:06) */
        <div className="flex items-center gap-2 md:gap-3 px-3 py-2 bg-black/40 backdrop-blur-xs rounded-xl border border-slate-700/50 shadow-2xl">
          {/* PLAY BOTTOMLESS */}
          <button
            onClick={() => onRequestModeSelect('BOTTOMLESS')}
            className="flex flex-col items-center justify-between w-20 h-20 md:w-24 md:h-24 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <span className="text-xl">♾️</span>
            </div>
            <span className="font-pixel text-[7px] md:text-[8px] text-white text-center leading-tight">PLAY<br />BOTTOM<br />LESS</span>
          </button>

          {/* PLAY EASY (সহজ মুড) */}
          <button
            onClick={() => onRequestModeSelect('EASY')}
            className="flex flex-col items-center justify-between w-20 h-20 md:w-24 md:h-24 bg-emerald-950/70 hover:bg-emerald-900/80 active:scale-95 border-2 border-emerald-500 rounded p-1.5 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            title="Easy Mode (সহজ মুড): 200 HP, 2 Shields, slower enemies & passive health regen"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <rect x="12" y="14" width="8" height="10" fill="#22c55e" />
                <rect x="10" y="24" width="4" height="6" fill="#14532d" />
                <rect x="18" y="24" width="4" height="6" fill="#14532d" />
                <rect x="13" y="6" width="6" height="5" fill="#15803d" />
                <rect x="14" y="11" width="5" height="3" fill="#f5c6a5" />
                <line x1="8" y1="20" x2="24" y2="4" stroke="#475569" strokeWidth="4" />
                <polygon points="23,3 27,7 25,1" fill="#ef4444" />
              </svg>
            </div>
            <span className="font-pixel text-[7px] md:text-[8px] text-emerald-300 text-center leading-tight">
              PLAY<br />EASY<br />
              <span className="text-[6px] text-emerald-400 font-bold">সহজ</span>
            </span>
          </button>

          {/* PLAY HARD (কঠিন মুড) */}
          <button
            onClick={() => onRequestModeSelect('HARD')}
            className="flex flex-col items-center justify-between w-20 h-20 md:w-24 md:h-24 bg-rose-950/70 hover:bg-rose-900/80 active:scale-95 border-2 border-rose-500 rounded p-1.5 shadow-lg shadow-rose-500/20 transition cursor-pointer"
            title="Hard Mode (কঠিন মুড): 85 HP, intense blitz, stealth bombers & tactical bunker defense"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-8 h-8">
                <rect x="12" y="14" width="8" height="10" fill="#ef4444" />
                <rect x="10" y="24" width="4" height="6" fill="#7f1d1d" />
                <rect x="18" y="24" width="4" height="6" fill="#7f1d1d" />
                <rect x="13" y="6" width="6" height="5" fill="#991b1b" />
                <rect x="14" y="11" width="5" height="3" fill="#f5c6a5" />
                <line x1="8" y1="20" x2="24" y2="4" stroke="#475569" strokeWidth="4" />
                <polygon points="23,3 27,7 25,1" fill="#ef4444" />
              </svg>
            </div>
            <span className="font-pixel text-[7px] md:text-[8px] text-rose-300 text-center leading-tight">
              PLAY<br />HARD<br />
              <span className="text-[6px] text-rose-400 font-bold">কঠিন</span>
            </span>
          </button>

          {/* BOSS BATTLE (দৈত্য রানী মশার সাথে সরাসরি মহাযুদ্ধ) */}
          <button
            onClick={() => onStartGame('EASY', true)}
            className="flex flex-col items-center justify-between w-20 h-20 md:w-24 md:h-24 bg-purple-950/80 hover:bg-purple-900 active:scale-95 border-2 border-purple-500 rounded p-1.5 shadow-lg shadow-purple-500/30 transition cursor-pointer"
            title="Boss Battle: Fight the Titan Queen Mosquito directly! (দৈত্য রানী মশার সাথে সরাসরি যুদ্ধ)"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <span className="text-2xl animate-bounce">👑</span>
            </div>
            <span className="font-pixel text-[7px] md:text-[8px] text-purple-300 text-center leading-tight">
              BOSS<br />BATTLE<br />
              <span className="text-[6px] text-purple-400 font-bold">রানী মশা</span>
            </span>
          </button>

          {/* RANDOM TERRAIN (matching video!) */}
          <button
            onClick={onRandomizeTerrain}
            className="flex flex-col items-center justify-between w-20 h-20 md:w-24 md:h-24 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-9 h-9">
                <ellipse cx="16" cy="24" rx="14" ry="6" fill="#65a828" />
                <rect x="15" y="14" width="3" height="8" fill="#452a18" />
                <circle cx="16" cy="11" r="7" fill="#4d8c22" />
                <circle cx="13" cy="9" r="5" fill="#65a828" />
              </svg>
            </div>
            <span className="font-pixel text-[7px] md:text-[8px] text-white text-center leading-tight">RANDOM<br />TERRAIN</span>
          </button>

          {/* PREV (back arrow button) */}
          <button
            onClick={() => setMenuView('ROOT')}
            className="flex flex-col items-center justify-between w-16 h-20 md:w-18 md:h-24 bg-slate-800/90 hover:bg-slate-700/90 active:scale-95 border border-slate-500 rounded p-1.5 shadow-lg transition cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center">
              <span className="text-xl text-white">◀</span>
            </div>
            <span className="font-pixel text-[8px] md:text-[9px] text-white">PREV</span>
          </button>
        </div>
      )}
    </div>
  );
};
