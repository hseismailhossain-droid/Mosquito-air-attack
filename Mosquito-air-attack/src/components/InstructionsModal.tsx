import React, { useState } from 'react';
import { X, Info, Footprints, Zap, Crosshair, Flame, Shield, Heart, Plane, ArrowRight } from 'lucide-react';

interface InstructionsModalProps {
  onClose: () => void;
  onPlayNow: () => void;
  showInitialPromptOnly?: boolean;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  onClose,
  onPlayNow,
  showInitialPromptOnly = true,
}) => {
  const [isDetailed, setIsDetailed] = useState(!showInitialPromptOnly);

  // Exact dialog from video (00:03)
  if (!isDetailed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
        <div className="bg-white text-slate-900 rounded-lg max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-start gap-4 mb-4">
            {/* Round info icon like video */}
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
              <Info className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 font-sans">
                View Instructions?
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-2 leading-relaxed font-sans">
                We recommend you take a moment to read through the instructions. Nailing the controls will make your gaming experience more pleasant and make you superior.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-6 pt-2">
            <button
              onClick={() => setIsDetailed(true)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 tracking-wider transition cursor-pointer"
            >
              SHOW INSTRUCTIONS
            </button>
            <button
              onClick={onPlayNow}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 tracking-wider transition cursor-pointer"
            >
              MAYBE LATER
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full detailed tactical guide
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
      <div className="bg-slate-900 text-slate-100 rounded-xl max-w-2xl w-full p-5 md:p-6 shadow-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-emerald-400" />
            <h2 className="font-pixel text-sm md:text-base text-emerald-300">
              INSTRUCTIONS & CONTROLS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 my-4 text-xs font-sans">
          {/* Controls */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
            <h3 className="font-pixel text-[11px] text-amber-400 mb-2">
              HOW TO PLAY
            </h3>
            <ul className="space-y-2 text-slate-300 list-disc list-inside">
              <li><strong>Tap / Click anywhere on screen</strong> to shoot rockets with white smoke trails directly towards enemy aircraft!</li>
              <li><strong>Run left & right</strong> using <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">A / D</kbd> or <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">Left / Right Arrow</kbd> keys.</li>
              <li><strong>Jump</strong> using <kbd className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">W / Space / Up Arrow</kbd>.</li>
              <li><strong>Underground Bunker Tunnel:</strong> Press <kbd className="bg-amber-800/80 px-1.5 py-0.5 rounded font-mono text-amber-200">S / Down / B</kbd> or tap <strong>BUNKER</strong> button to take shelter in the fortified subterranean tunnel and launch rockets safely from inside!</li>
              <li>Collect <strong>Airdrop Crates</strong> (like <em>MULTI-JUMP BOOTS</em>) to jump multiple times in mid-air!</li>
              <li>Shoot down enemy bombs before they hit the ground or damage your soldier.</li>
            </ul>
          </div>

          {/* Mosquito threats & egg defense */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
            <h3 className="font-pixel text-[11px] text-red-400 mb-2">
              🦟 MOSQUITO SPECIES & EGG DEFENSE (মশার প্রজাতি ও ডিম আক্রমণ)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-300">
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="font-bold text-white block">🦟 এডিস ও কিউলেক্স মশা</span>
                <span className="text-[11px] text-slate-400">উপর দিয়ে উড়ে নিচে বিষাক্ত ডিম ফেলে। ডিম মাটিতে পড়ার আগেই রকেট দিয়ে ধ্বংস করুন!</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="font-bold text-red-400 block">🩸 রক্তচোষা ও বিষাক্ত মশা</span>
                <span className="text-[11px] text-slate-400">রক্তে ভরা স্ফীত পেট এবং বিষাক্ত ড্রপ—এদের মারলে প্রচুর পয়েন্ট ও কয়েন পাবেন।</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded border border-slate-800">
                <span className="font-bold text-purple-400 block">👑 দৈত্য রানী মশা (Boss)</span>
                <span className="text-[11px] text-slate-400">বিশাল আকৃতির বস মশা—একটানা ঝাঁকে ঝাঁকে ডিম ছুড়ে মারে। টানেলে আশ্রয় নিয়ে লড়াই করুন!</span>
              </div>
            </div>
          </div>

          {/* Combat Arsenal */}
          <div className="bg-slate-950/70 p-3.5 rounded-lg border border-slate-800">
            <h3 className="font-pixel text-[11px] text-emerald-400 mb-2">
              ⚔️ COMBAT WEAPONS & DEFENSE (যুদ্ধাস্ত্র ও সহায়তা)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-base">🚀</span>
                <span>Heavy Rocket & AA Flak Cannon (অ্যান্টি-এয়ার অস্ত্র)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <span>Subterranean Tunnel (মাটির নিচের বাংকার)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <span>Auto SAM Launcher & Allied Tank (সহায়ক ট্যাঙ্ক ও তুর্কি)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base">⚡</span>
                <span>Guardian Drone & EMP Blast (ড্রোন ও শকওয়েভ)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onPlayNow}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-pixel text-xs rounded transition shadow-lg cursor-pointer"
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  );
};
