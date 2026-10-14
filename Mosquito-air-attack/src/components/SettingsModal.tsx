import React from 'react';
import { X, Sliders, Volume2, Music, Sparkles, Smartphone } from 'lucide-react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 text-slate-100 rounded-xl max-w-md w-full p-5 md:p-6 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <h2 className="font-pixel text-sm md:text-base text-purple-300">
              AUDIO & GAME SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-5 text-xs">
          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-slate-200">Sound Effects</div>
                <div className="text-[10px] text-slate-400">Explosions, rockets, helicopters</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-3 py-1.5 font-pixel text-[10px] rounded transition cursor-pointer ${
                settings.soundEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Retro Chiptune Music */}
          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Music className="w-4 h-4 text-yellow-400" />
              <div>
                <div className="font-semibold text-slate-200">Arcade Synth Music</div>
                <div className="text-[10px] text-slate-400">8-bit battlefield background melody</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`px-3 py-1.5 font-pixel text-[10px] rounded transition cursor-pointer ${
                settings.musicEnabled
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Master Volume Slider */}
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-slate-200">
              <span className="font-semibold">Master Volume</span>
              <span className="font-mono text-emerald-400">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Screen Shake */}
          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <div>
                <div className="font-semibold text-slate-200">Screen Shake</div>
                <div className="text-[10px] text-slate-400">Camera rumble on explosions</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ screenShakeEnabled: !settings.screenShakeEnabled })}
              className={`px-3 py-1.5 font-pixel text-[10px] rounded transition cursor-pointer ${
                settings.screenShakeEnabled
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.screenShakeEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Force Virtual Touch Controls */}
          <div className="flex items-center justify-between p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="font-semibold text-slate-200">On-Screen Controls</div>
                <div className="text-[10px] text-slate-400">Show buttons on desktop screen</div>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ showTouchControls: !settings.showTouchControls })}
              className={`px-3 py-1.5 font-pixel text-[10px] rounded transition cursor-pointer ${
                settings.showTouchControls
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {settings.showTouchControls ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-pixel text-xs rounded transition shadow-md cursor-pointer"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
