import React, { useState, useEffect } from 'react';
import { Fuel, Check, Zap } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface GasStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCarFuel: number;
  onRefuelComplete: (fuelAmount: number) => void;
  carName: string;
}

export const GasStationModal: React.FC<GasStationModalProps> = ({
  isOpen,
  onClose,
  playerCarFuel,
  onRefuelComplete,
  carName,
}) => {
  const [selectedFuelType, setSelectedFuelType] = useState<'ai92' | 'ai95' | 'ai98' | 'metan'>('ai95');
  const [isPumping, setIsPumping] = useState(false);
  const [pumpProgress, setPumpProgress] = useState(playerCarFuel);

  useEffect(() => {
    setPumpProgress(playerCarFuel);
  }, [playerCarFuel, isOpen]);

  if (!isOpen) return null;

  const fuelTypes = [
    { id: 'ai92', name: 'Ai-92 Standart', price: "11,500 so'm/L", oct: 92, color: 'text-amber-400 border-amber-500/50' },
    { id: 'ai95', name: 'Ai-95 Premial', price: "13,200 so'm/L", oct: 95, color: 'text-blue-400 border-blue-500/50' },
    { id: 'ai98', name: 'Ai-98 Super Sport', price: "15,500 so'm/L", oct: 98, color: 'text-red-400 border-red-500/50' },
    { id: 'metan', name: 'CNG Metan Gaz', price: "3,800 so'm/kub", oct: 105, color: 'text-emerald-400 border-emerald-500/50' },
  ];

  const handleStartRefuel = () => {
    setIsPumping(true);
    let cur = pumpProgress;
    const interval = setInterval(() => {
      cur += 4;
      soundManager.playRefuelPump();
      if (cur >= 100) {
        cur = 100;
        clearInterval(interval);
        setIsPumping(false);
        soundManager.playDing();
        onRefuelComplete(100);
      }
      setPumpProgress(cur);
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wide">LUK-AVTO ZAPRAVKA</h2>
              <p className="text-xs text-red-100">Yoqilg'i quyish shoxobchasi • {carName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isPumping}
            className="text-xs bg-black/30 hover:bg-black/50 px-3 py-1.5 rounded-lg transition"
          >
            Yopish
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Fuel Level Display */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold uppercase text-zinc-400">Benzin Baki Darajasi</span>
              <span
                className={`text-sm font-bold font-mono ${
                  pumpProgress < 20 ? 'text-red-400' : pumpProgress < 50 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {Math.round(pumpProgress)}% / 100%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden p-0.5 border border-zinc-700">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  pumpProgress < 20
                    ? 'bg-red-500'
                    : pumpProgress < 50
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                }`}
                style={{ width: `${pumpProgress}%` }}
              />
            </div>
          </div>

          {/* Fuel selection */}
          <div>
            <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-2.5">
              Yoqilg'i Markasini Tanlang
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {fuelTypes.map((fuel) => (
                <button
                  key={fuel.id}
                  disabled={isPumping}
                  onClick={() => setSelectedFuelType(fuel.id as 'ai92' | 'ai95' | 'ai98' | 'metan')}
                  className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                    selectedFuelType === fuel.id
                      ? `bg-zinc-800 border-red-500 ring-1 ring-red-500`
                      : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/50'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{fuel.name}</div>
                    <div className="text-xs text-zinc-400">{fuel.price}</div>
                  </div>
                  {selectedFuelType === fuel.id && <Check className="w-4 h-4 text-red-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              onClick={handleStartRefuel}
              disabled={isPumping || pumpProgress >= 99}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg ${
                pumpProgress >= 99
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isPumping
                  ? 'bg-amber-600 text-white animate-pulse'
                  : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              }`}
            >
              {pumpProgress >= 99 ? (
                <>
                  <Check className="w-5 h-5" />
                  Bak To'liq (100%)
                </>
              ) : isPumping ? (
                <>
                  <Zap className="w-5 h-5 animate-spin" />
                  Benzin Quyilmoqda...
                </>
              ) : (
                <>
                  <Fuel className="w-5 h-5" />
                  To'liq Bak Quyish (Zapravka Qilish)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-zinc-950/90 border-t border-zinc-800 text-center">
          <p className="text-[11px] text-zinc-400">
            Maslahat: Harakatlanish vaqtida benzin kamayadi. Bak bo'shasa, mashina sekinlashadi!
          </p>
        </div>
      </div>
    </div>
  );
};
