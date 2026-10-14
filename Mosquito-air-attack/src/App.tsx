/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameEngine } from './gameEngine';
import { generateTerrain } from './terrain';
import { GameMode, GameState, ActiveModal, GameSettings } from './types';
import { GameCanvas } from './components/GameCanvas';
import { GameHUD } from './components/GameHUD';
import { MainMenu } from './components/MainMenu';
import { InstructionsModal } from './components/InstructionsModal';
import { ControlsModal } from './components/ControlsModal';
import { SettingsModal } from './components/SettingsModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { sound } from './audio';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('EASY');
  const [activeModal, setActiveModal] = useState<ActiveModal>('NONE');
  const [showInitialPrompt, setShowInitialPrompt] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  const [settings, setSettings] = useState<GameSettings>(() => {
    return {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.7,
      screenShakeEnabled: true,
      showTouchControls: true,
    };
  });

  // Check orientation for landscape optimization
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth && window.innerWidth < 768);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  useEffect(() => {
    sound.setSettings(settings.soundEnabled, settings.musicEnabled, settings.soundVolume);
  }, [settings]);

  // Engine Ref
  const engineRef = useRef<GameEngine | null>(null);

  if (!engineRef.current) {
    const initialTerrain = generateTerrain(1200, 640);
    engineRef.current = new GameEngine(initialTerrain, 'EASY');
  }

  // Stable game over callback
  const handleGameOver = useCallback(() => {
    setGameState('GAMEOVER');
  }, []);

  // Music toggle
  useEffect(() => {
    if (gameState === 'PLAYING' && settings.musicEnabled) {
      sound.startMusic();
    } else {
      sound.stopMusic();
    }
    return () => {
      sound.stopMusic();
    };
  }, [gameState, settings.musicEnabled]);

  // Randomize terrain
  const handleRandomizeTerrain = useCallback(() => {
    const newTerrain = generateTerrain(1200, 640, Math.random() * 1000);
    if (engineRef.current) {
      engineRef.current.terrain = newTerrain;
      engineRef.current.player.x = 600;
      engineRef.current.player.y = 80;
    }
    sound.playExplosion('small');
  }, []);

  // Request mode select (opens 00:03 video prompt)
  const handleRequestModeSelect = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setShowInitialPrompt(true);
    setActiveModal('INSTRUCTIONS');
  }, []);

  // Start new game
  const handleStartGame = useCallback((mode: GameMode, startAtBoss = false) => {
    setGameMode(mode);
    const terrain = generateTerrain(1200, 640);
    const newEngine = new GameEngine(terrain, mode);
    if (startAtBoss) {
      newEngine.startWave(3); // Start directly at Boss Wave with Queen Mosquito!
    }
    engineRef.current = newEngine;
    setGameState('PLAYING');
    setActiveModal('NONE');
    setShowInitialPrompt(false);
  }, []);

  const handleRestart = useCallback(() => {
    handleStartGame(gameMode);
  }, [gameMode, handleStartGame]);

  const handleTogglePause = useCallback(() => {
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
      sound.stopMusic();
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
      if (settings.musicEnabled) sound.startMusic();
    }
  }, [gameState, settings.musicEnabled]);

  // Hand Touch Controls Callbacks
  const handleMoveLeftStart = useCallback(() => engineRef.current?.setTouchMovement(-1), []);
  const handleMoveLeftEnd = useCallback(() => engineRef.current?.setTouchMovement(0), []);
  const handleMoveRightStart = useCallback(() => engineRef.current?.setTouchMovement(1), []);
  const handleMoveRightEnd = useCallback(() => engineRef.current?.setTouchMovement(0), []);
  const handleJumpPress = useCallback(() => engineRef.current?.jump(), []);
  const handleShootPress = useCallback(() => engineRef.current?.shootRocket(), []);

  return (
    <div className="relative w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden select-none">
      {/* Portrait warning banner advising user to turn phone to Landscape */}
      {isPortrait && (
        <div className="absolute top-2 z-50 bg-amber-950/90 border border-amber-500/80 text-amber-200 px-4 py-2 rounded-xl text-xs font-sans flex items-center gap-2 shadow-2xl backdrop-blur-xs animate-pulse">
          <Smartphone className="w-5 h-5 text-amber-400 rotate-90" />
          <span>দয়া করে মোবাইলটি Landscape মোডে ঘুরিয়ে নিন (Rotate to Landscape) 🔄</span>
        </div>
      )}

      {/* 16:9 Landscape Arena Viewport */}
      <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] aspect-[16/9] flex items-center justify-center bg-slate-950">
        {/* Canvas Engine */}
        {engineRef.current && (
          <GameCanvas
            engine={engineRef.current}
            onGameOver={handleGameOver}
            screenShakeEnabled={settings.screenShakeEnabled}
            isInGame={gameState === 'PLAYING'}
          />
        )}

        {/* Main Menu */}
        {gameState === 'MENU' && (
          <MainMenu
            onStartGame={handleStartGame}
            onOpenModal={(modal) => {
              setShowInitialPrompt(false);
              setActiveModal(modal);
            }}
            onRandomizeTerrain={handleRandomizeTerrain}
            onRequestModeSelect={handleRequestModeSelect}
          />
        )}

        {/* In-Game HUD & Hand Touch Controls */}
        {gameState === 'PLAYING' && engineRef.current && (
          <GameHUD
            engine={engineRef.current}
            isPaused={false}
            onTogglePause={handleTogglePause}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
            onJumpPress={handleJumpPress}
            onMoveLeftStart={handleMoveLeftStart}
            onMoveLeftEnd={handleMoveLeftEnd}
            onMoveRightStart={handleMoveRightStart}
            onMoveRightEnd={handleMoveRightEnd}
            onShootPress={handleShootPress}
          />
        )}

        {/* Pause Modal */}
        {gameState === 'PAUSED' && (
          <PauseModal
            onResume={() => {
              setGameState('PLAYING');
              if (settings.musicEnabled) sound.startMusic();
            }}
            onRestart={handleRestart}
            onHome={() => setGameState('MENU')}
            onOpenSettings={() => setActiveModal('SETTINGS')}
          />
        )}

        {/* Game Over Modal */}
        {gameState === 'GAMEOVER' && engineRef.current && (
          <GameOverModal
            stats={engineRef.current.stats}
            onRestart={handleRestart}
            onHome={() => setGameState('MENU')}
          />
        )}

        {/* Instructions Dialog Prompt (matching video 00:03) */}
        {activeModal === 'INSTRUCTIONS' && (
          <InstructionsModal
            onClose={() => setActiveModal('NONE')}
            onPlayNow={() => handleStartGame(gameMode)}
            showInitialPromptOnly={showInitialPrompt}
          />
        )}

        {/* Controls Modal */}
        {activeModal === 'CONTROLS' && (
          <ControlsModal onClose={() => setActiveModal('NONE')} />
        )}

        {/* Settings Modal */}
        {activeModal === 'SETTINGS' && (
          <SettingsModal
            settings={settings}
            onUpdateSettings={(partial) => setSettings((s) => ({ ...s, ...partial }))}
            onClose={() => setActiveModal('NONE')}
          />
        )}
      </div>
    </div>
  );
}
