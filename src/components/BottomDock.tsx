import React, { useState } from 'react';
import {
  Users,
  User,
  Palette,
  Fuel,
  RotateCcw,
  Camera,
  Volume2,
  VolumeX,
  Keyboard,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface BottomDockProps {
  isTwoPlayer: boolean;
  onToggleTwoPlayer: () => void;
  onOpenTuning: () => void;
  onOpenGasStation: () => void;
  onResetCar: () => void;
  onToggleCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenControlsGuide: () => void;
  cameraModeName: string;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  isTwoPlayer,
  onToggleTwoPlayer,
  onOpenTuning,
  onOpenGasStation,
  onResetCar,
  onToggleCamera,
  isMuted,
  onToggleMute,
  onOpenControlsGuide,
  cameraModeName,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto max-w-[min(940px,96vw)] w-full transition-transform duration-300">
      {/* Collapse / Expand Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="mb-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-700/80 text-zinc-300 hover:text-white text-[11px] font-semibold shadow-md transition hover:bg-zinc-800"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-red-400" />
            <span>Panelni Ko'rsatish (H)</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kino Rejimi (Panelni Yashirish)</span>
          </>
        )}
      </button>

      {/* Main Dock Container */}
      {!isCollapsed && (
        <div className="w-full bg-zinc-950/90 border border-zinc-700/80 rounded-2xl p-2 shadow-2xl flex flex-wrap items-center justify-between gap-1.5 backdrop-blur-md">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => isTwoPlayer && onToggleTwoPlayer()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !isTwoPlayer
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              1 Kishilik
            </button>
            <button
              onClick={() => !isTwoPlayer && onToggleTwoPlayer()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                isTwoPlayer
                  ? 'bg-red-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              2 Kishilik (Ekran Bo'lingan)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Car & Tuning button */}
            <button
              onClick={onOpenTuning}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition hover:border-red-500/50"
            >
              <Palette className="w-4 h-4 text-red-400" />
              Mashinalar & Tyuning
            </button>

            {/* Gas Station button */}
            <button
              onClick={onOpenGasStation}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition hover:border-amber-500/50"
            >
              <Fuel className="w-4 h-4 text-amber-400" />
              Zapravka
            </button>

            {/* Reset Car */}
            <button
              onClick={onResetCar}
              title="Mashinani yo'lga qaytarish"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition"
            >
              <RotateCcw className="w-4 h-4 text-zinc-400" />
              Qayta qo'yish [R]
            </button>

            {/* Camera View Switch */}
            <button
              onClick={onToggleCamera}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              Kamera: {cameraModeName} [C]
            </button>

            {/* Audio Mute */}
            <button
              onClick={onToggleMute}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition"
              title={isMuted ? 'Ovozni yoqish' : "Ovozni o'chirish"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Controls Guide */}
            <button
              onClick={onOpenControlsGuide}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 transition"
              title="Boshqaruv tugmalari"
            >
              <Keyboard className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
