import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { GameEngine, CameraMode } from './three/gameEngine';
import { CarCustomization, PlayerCarState } from './types/game';
import { SinglePlayerHUD, Minimap } from './components/HUD';
import { BottomDock } from './components/BottomDock';
import { TuningModal } from './components/TuningModal';
import { GasStationModal } from './components/GasStationModal';
import { ControlsGuideModal } from './components/ControlsGuideModal';
import { soundManager } from './audio/soundManager';

const defaultPlayer1Custom: CarCustomization = {
  modelId: 'gentra',
  bodyColor: '#1d4ed8', // Tashkent Blue
  finish: 'metallic',
  roofColor: '#0f172a',
  wheelStyle: 'sport',
  rimColor: '#e2e8f0',
  tireSmokeColor: '#93c5fd',
  underglowColor: '#00e5ff',
  spoilerStyle: 'sport',
  windowTint: 'dark',
  hornPitch: 440,
};

const defaultPlayer2Custom: CarCustomization = {
  modelId: 'supercar',
  bodyColor: '#dc2626', // Crimson Red
  finish: 'gloss',
  roofColor: '#18181b',
  wheelStyle: 'bbs',
  rimColor: '#f59e0b',
  tireSmokeColor: '#fca5a5',
  underglowColor: '#ef4444',
  spoilerStyle: 'gt',
  windowTint: 'dark',
  hornPitch: 493.88,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [p1Custom, setP1Custom] = useState<CarCustomization>(defaultPlayer1Custom);
  const [p2Custom, setP2Custom] = useState<CarCustomization>(defaultPlayer2Custom);
  const [isTwoPlayer, setIsTwoPlayer] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const [isMuted, setIsMuted] = useState(false);

  // HUD & Game loop sync states
  const [p1State, setP1State] = useState<PlayerCarState | null>(null);
  const [p2State, setP2State] = useState<PlayerCarState | null>(null);
  const [isP1NearGas, setIsP1NearGas] = useState(false);
  const [isP2NearGas, setIsP2NearGas] = useState(false);

  // Modals
  const [isTuningOpen, setIsTuningOpen] = useState(false);
  const [isGasModalOpen, setIsGasModalOpen] = useState(false);
  const [activeGasPlayer, setActiveGasPlayer] = useState<1 | 2>(1);
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  // Initialize Three.js Engine once on mount
  useEffect(() => {
    if (!canvasMountRef.current) return;

    const engine = new GameEngine(
      canvasMountRef.current,
      defaultPlayer1Custom,
      defaultPlayer2Custom
    );
    engineRef.current = engine;

    // Throttle state update to HUD to ~30fps for silky smooth React UI
    let lastUiUpdate = 0;
    engine.onStateUpdate = (p1, p2, p1Gas, p2Gas) => {
      const now = performance.now();
      if (now - lastUiUpdate > 33) {
        lastUiUpdate = now;
        setP1State({ ...p1 });
        setP2State({ ...p2 });
        setIsP1NearGas(p1Gas);
        setIsP2NearGas(p2Gas);
      }
    };

    // User interaction gesture to initialize Web Audio
    const handleFirstGesture = () => {
      soundManager.init();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    // Key 'E' for gas station shortcut
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (engineRef.current) {
          if (isP1NearGas) {
            setActiveGasPlayer(1);
            setIsGasModalOpen(true);
          } else if (isP2NearGas) {
            setActiveGasPlayer(2);
            setIsGasModalOpen(true);
          }
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeys);
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Update Two Player Mode toggle
  const handleToggleTwoPlayer = () => {
    if (!engineRef.current) return;
    const nextMode = !isTwoPlayer;
    setIsTwoPlayer(nextMode);
    engineRef.current.isTwoPlayer = nextMode;
    if (nextMode) {
      engineRef.current.resetPlayerPosition(2);
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  // Customization handlers
  const handleUpdateP1Custom = (custom: CarCustomization) => {
    setP1Custom(custom);
    if (engineRef.current) {
      engineRef.current.updatePlayer1Customization(custom);
    }
  };

  const handleUpdateP2Custom = (custom: CarCustomization) => {
    setP2Custom(custom);
    if (engineRef.current) {
      engineRef.current.updatePlayer2Customization(custom);
    }
  };

  // Reset Car
  const handleResetCar = () => {
    if (!engineRef.current) return;
    engineRef.current.resetPlayerPosition(1);
    if (isTwoPlayer) {
      engineRef.current.resetPlayerPosition(2);
    }
    soundManager.playDing();
  };

  // Toggle Camera
  const handleToggleCamera = () => {
    if (!engineRef.current) return;
    engineRef.current.cycleCamera();
    setCameraMode(engineRef.current.cameraMode);
  };

  // Audio Mute
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Refuel Complete
  const handleRefuelComplete = (amount: number) => {
    if (engineRef.current) {
      engineRef.current.refuelPlayer(activeGasPlayer, amount);
    }
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
    });
  };

  const cameraLabels: Record<CameraMode, string> = {
    chase: 'Orqa',
    hood: 'Salon',
    top: 'Tepadan',
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans select-none">
      {/* Three.js Isolated Canvas Mount (Skill Mandate: Empty ref container) */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Split-Screen Divider (Shown in 2-Player mode) */}
      {isTwoPlayer && (
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-blue-500 via-amber-400 to-red-500 z-10 pointer-events-none shadow-[0_0_12px_rgba(255,255,255,0.4)]" />
      )}

      {/* Top Header & Minimap */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-start justify-between pointer-events-none">
        {/* Title & Badge */}
        <div className="pointer-events-auto bg-zinc-950/80 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-wider text-white">SHAHAR POYGARi</span>
            <span className="px-2 py-0.5 rounded-md bg-red-600/30 border border-red-500/50 text-red-400 text-[10px] font-extrabold uppercase">
              3D AVTO
            </span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            {isTwoPlayer ? "2 Kishilik Poyga (Split-Screen)" : "1 Kishilik Erkin Haydash"} • Benzin Zapravka & Tyuning
          </div>
        </div>

        {/* Minimap Radar */}
        {p1State && (
          <Minimap
            player1={p1State}
            player2={isTwoPlayer && p2State ? p2State : undefined}
            gasStations={engineRef.current?.cityData.gasStationZones || []}
          />
        )}
      </div>

      {/* In-Game HUDs */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {!isTwoPlayer ? (
          // 1 Player Full HUD
          p1State && (
            <SinglePlayerHUD
              player={p1State}
              label="Sizning Mashinangiz"
              colorScheme="blue"
              isNearGasStation={isP1NearGas}
              onOpenGasStation={() => {
                setActiveGasPlayer(1);
                setIsGasModalOpen(true);
              }}
              onOpenTuning={() => setIsTuningOpen(true)}
            />
          )
        ) : (
          // 2 Player Split Screen HUDs (Left & Right halves)
          <div className="grid grid-cols-2 w-full h-full">
            {/* Player 1 Left View HUD */}
            <div className="relative h-full pr-1">
              {p1State && (
                <SinglePlayerHUD
                  player={p1State}
                  label="1-O'yinchi (W A S D)"
                  colorScheme="blue"
                  isNearGasStation={isP1NearGas}
                  onOpenGasStation={() => {
                    setActiveGasPlayer(1);
                    setIsGasModalOpen(true);
                  }}
                  onOpenTuning={() => setIsTuningOpen(true)}
                />
              )}
            </div>

            {/* Player 2 Right View HUD */}
            <div className="relative h-full pl-1">
              {p2State && (
                <SinglePlayerHUD
                  player={p2State}
                  label="2-O'yinchi (Strelkalar)"
                  colorScheme="red"
                  isNearGasStation={isP2NearGas}
                  onOpenGasStation={() => {
                    setActiveGasPlayer(2);
                    setIsGasModalOpen(true);
                  }}
                  onOpenTuning={() => setIsTuningOpen(true)}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock (Skill Mandate: Zero Viewport Occlusion) */}
      <BottomDock
        isTwoPlayer={isTwoPlayer}
        onToggleTwoPlayer={handleToggleTwoPlayer}
        onOpenTuning={() => setIsTuningOpen(true)}
        onOpenGasStation={() => {
          setActiveGasPlayer(1);
          setIsGasModalOpen(true);
        }}
        onResetCar={handleResetCar}
        onToggleCamera={handleToggleCamera}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenControlsGuide={() => setIsControlsOpen(true)}
        cameraModeName={cameraLabels[cameraMode]}
      />

      {/* Tuning Garage Modal */}
      <TuningModal
        isOpen={isTuningOpen}
        onClose={() => setIsTuningOpen(false)}
        player1Custom={p1Custom}
        player2Custom={p2Custom}
        isTwoPlayer={isTwoPlayer}
        onUpdatePlayer1={handleUpdateP1Custom}
        onUpdatePlayer2={handleUpdateP2Custom}
      />

      {/* Gas Station Refuel Modal */}
      <GasStationModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
        playerCarFuel={activeGasPlayer === 1 ? p1State?.fuel ?? 80 : p2State?.fuel ?? 80}
        onRefuelComplete={handleRefuelComplete}
        carName={activeGasPlayer === 1 ? "1-O'yinchi Mashinasi" : "2-O'yinchi Mashinasi"}
      />

      {/* Controls Guide Modal */}
      <ControlsGuideModal
        isOpen={isControlsOpen}
        onClose={() => setIsControlsOpen(false)}
      />
    </div>
  );
}
