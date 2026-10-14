import React from 'react';
import { Play, RotateCcw, Home, Sliders } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  onOpenSettings,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-6 text-center shadow-2xl">
        <h2 className="text-xl md:text-2xl font-pixel text-yellow-300 mb-6 drop-shadow">
          GAME PAUSED
        </h2>

        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-pixel text-xs rounded-lg shadow-md transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>RESUME</span>
          </button>

          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs rounded-lg transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART WAVE</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-pixel text-xs rounded-lg transition cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-red-950/60 hover:bg-red-900/60 text-red-300 font-pixel text-xs rounded-lg transition cursor-pointer border border-red-800/60"
          >
            <Home className="w-4 h-4" />
            <span>QUIT TO MENU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
