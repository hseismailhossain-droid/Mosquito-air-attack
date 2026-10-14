import React from 'react';
import { X, Gamepad2, Mouse, Smartphone, Keyboard } from 'lucide-react';

interface ControlsModalProps {
  onClose: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 text-slate-100 rounded-xl max-w-lg w-full p-5 md:p-6 shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-pixel text-sm md:text-base text-cyan-300">
              CONTROLS SETUP
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
          {/* Keyboard & Mouse (Desktop) */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-pixel text-[11px]">
              <Keyboard className="w-4 h-4" />
              <span>KEYBOARD & MOUSE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Move Left</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">A / ◀</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Move Right</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">D / ▶</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Jump</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">W / SPACE</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Dodge Dash</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">C / SHIFT</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Weapon Mode</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">E / R</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Super EMP Nuke</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">F / X</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center">
                <span>Tunnel Bunker</span>
                <kbd className="bg-amber-800/90 px-2 py-0.5 rounded font-mono font-bold text-amber-200">S / ▼ / B</kbd>
              </div>
              <div className="bg-slate-900 p-2 rounded flex justify-between items-center col-span-2">
                <span>Pause</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded font-mono font-bold text-white">ESC / P</kbd>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 text-slate-300 border-t border-slate-800/80">
              <Mouse className="w-4 h-4 text-emerald-400" />
              <span>Aim with cursor & Left-Click (or hold) to fire rockets</span>
            </div>
          </div>

          {/* Touch / Mobile Controls */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-pixel text-[11px]">
              <Smartphone className="w-4 h-4" />
              <span>MOBILE & TOUCH SCREEN</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Touch anywhere on the sky to aim and fire rockets directly at enemy aircraft or bombs. On mobile devices, virtual on-screen buttons appear for moving left, right, and jumping.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-pixel text-xs rounded transition shadow-md cursor-pointer"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
