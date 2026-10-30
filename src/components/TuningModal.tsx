import React, { useState } from 'react';
import { CarCustomization, WheelStyle, BodyFinish, CarModelId } from '../types/game';
import { CAR_MODELS } from '../data/carModels';
import { Palette, Disc, Sparkles, X, Check, Car, Gauge, Zap, Shield } from 'lucide-react';

interface TuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  player1Custom: CarCustomization;
  player2Custom: CarCustomization;
  isTwoPlayer: boolean;
  onUpdatePlayer1: (custom: CarCustomization) => void;
  onUpdatePlayer2: (custom: CarCustomization) => void;
}

export const TuningModal: React.FC<TuningModalProps> = ({
  isOpen,
  onClose,
  player1Custom,
  player2Custom,
  isTwoPlayer,
  onUpdatePlayer1,
  onUpdatePlayer2,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<'cars' | 'color' | 'wheels' | 'extras'>('cars');

  if (!isOpen) return null;

  const currentCustom = selectedPlayer === 1 ? player1Custom : player2Custom;
  const updateCurrent = (patch: Partial<CarCustomization>) => {
    const updated = { ...currentCustom, ...patch };
    if (selectedPlayer === 1) {
      onUpdatePlayer1(updated);
    } else {
      onUpdatePlayer2(updated);
    }
  };

  const colorPresets = [
    { name: 'Ferrari Qizil', hex: '#dc2626' },
    { name: 'Toshkent Tun Moviy', hex: '#1d4ed8' },
    { name: 'Zumrad Yashil', hex: '#059669' },
    { name: 'Oltin Sariq', hex: '#eab308' },
    { name: 'Marvarid Oq', hex: '#f8fafc' },
    { name: 'Matoviy Qora', hex: '#18181b' },
    { name: 'Kiber Binafsha', hex: '#9333ea' },
    { name: 'Quyosh Apelsin', hex: '#ea580c' },
  ];

  const rimColors = [
    { name: 'Xrom Kumush', hex: '#e2e8f0' },
    { name: 'Oltin', hex: '#f59e0b' },
    { name: 'Qora Glanets', hex: '#09090b' },
    { name: 'Bronza', hex: '#b45309' },
    { name: 'Neon Moviy', hex: '#06b6d4' },
    { name: 'Poyga Qizil', hex: '#ef4444' },
  ];

  const wheelOptions: { id: WheelStyle; label: string; desc: string }[] = [
    { id: 'sport', label: 'Sport 5-Qirrali', desc: 'Yengil qotishmali tezyurar diska' },
    { id: 'bbs', label: 'BBS Palka', desc: 'Ko‘p qirrali sport uslubi' },
    { id: 'offroad', label: 'Off-Road Katta', desc: 'Qalin protektorli baquvvat balon' },
    { id: 'cyber', label: 'Kiber Neon', desc: 'Yonuvchi futuristik halqali diska' },
    { id: 'classic', label: 'Klassik Simli', desc: 'Xromlangan retro diskalar' },
  ];

  const underglowOptions = [
    { name: "O'chiq", color: null },
    { name: 'Neon Moviy', color: '#00e5ff' },
    { name: 'Binafsha', color: '#c026d3' },
    { name: 'Yashil', color: '#22c55e' },
    { name: 'Qizil', color: '#ef4444' },
    { name: 'Sariq', color: '#facc15' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Mashinalar Garaji & Tyuning</h2>
              <p className="text-xs text-zinc-400">Mashinani almashtiring, balonlarini va ranglarini sozlang</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Selector (If 2 players active) */}
        {isTwoPlayer && (
          <div className="flex bg-zinc-950 px-6 py-2 border-b border-zinc-800 gap-2">
            <button
              onClick={() => setSelectedPlayer(1)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                selectedPlayer === 1
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
            >
              1-O'yinchi Mashinasi (Moviy)
            </button>
            <button
              onClick={() => setSelectedPlayer(2)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                selectedPlayer === 2
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
            >
              2-O'yinchi Mashinasi (Qizil)
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/90 px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('cars')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'cars'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Car className="w-4 h-4 text-amber-400" />
            Mashinani Almashtirish
          </button>
          <button
            onClick={() => setActiveTab('color')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'color'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-4 h-4 text-blue-400" />
            Kuzov Rangi
          </button>
          <button
            onClick={() => setActiveTab('wheels')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'wheels'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Disc className="w-4 h-4 text-emerald-400" />
            Balonlar & Diskalar
          </button>
          <button
            onClick={() => setActiveTab('extras')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition ${
              activeTab === 'extras'
                ? 'border-red-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Neon & Spoyler
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: CAR MODEL SWITCHER */}
          {activeTab === 'cars' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                Garajdagi Avtomobillar (Tanlang va Darhol Haydang):
              </div>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(CAR_MODELS) as CarModelId[]).map((mId) => {
                  const spec = CAR_MODELS[mId];
                  const isSelected = (currentCustom.modelId || 'gentra') === mId;

                  return (
                    <div
                      key={mId}
                      onClick={() => updateCurrent({ modelId: mId })}
                      className={`cursor-pointer p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-zinc-800/90 border-red-500 ring-2 ring-red-500/50 shadow-xl'
                          : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                            <Car className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-base text-white">{spec.name}</h3>
                              <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {spec.category}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">{spec.description}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-lg">
                            <Check className="w-4 h-4" />
                            Tanlangan
                          </div>
                        )}
                      </div>

                      {/* Specs Indicators */}
                      <div className="grid grid-cols-3 gap-3 pt-3 mt-2 border-t border-zinc-800/80 text-xs">
                        <div>
                          <div className="flex justify-between text-zinc-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-cyan-400" />
                              Maks. Tezlik
                            </span>
                            <span className="font-bold text-white font-mono">{spec.maxSpeed} km/h</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-cyan-500 h-full rounded-full"
                              style={{ width: `${(spec.maxSpeed / 250) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-zinc-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" />
                              Tezlanish
                            </span>
                            <span className="font-bold text-white font-mono">{spec.accel}</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${(spec.accel / 60) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-zinc-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-emerald-400" />
                              Boshqaruv
                            </span>
                            <span className="font-bold text-white font-mono">{Math.round(spec.handling * 100)}%</span>
                          </div>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${spec.handling * 80}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COLOR */}
          {activeTab === 'color' && (
            <div className="space-y-6">
              {/* Preset Colors */}
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-3">
                  Mashina Kuzov Rangi
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.hex}
                      onClick={() => updateCurrent({ bodyColor: preset.hex })}
                      className="group relative flex flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl border-2 transition transform group-hover:scale-105 flex items-center justify-center ${
                          currentCustom.bodyColor.toLowerCase() === preset.hex.toLowerCase()
                            ? 'border-white ring-2 ring-red-500 shadow-lg'
                            : 'border-zinc-700/60'
                        }`}
                        style={{ backgroundColor: preset.hex }}
                      >
                        {currentCustom.bodyColor.toLowerCase() === preset.hex.toLowerCase() && (
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400 truncate max-w-[64px] text-center">
                        {preset.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Picker & Finish */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-2">
                    Istalgan Rangni Tanlash
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentCustom.bodyColor}
                      onChange={(e) => updateCurrent({ bodyColor: e.target.value })}
                      className="w-12 h-10 rounded cursor-pointer bg-transparent border-0"
                    />
                    <span className="text-sm font-mono text-zinc-300 uppercase">{currentCustom.bodyColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-2">
                    Bo'yoq Turi (Finish)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gloss', 'metallic', 'matte'] as BodyFinish[]).map((finish) => (
                      <button
                        key={finish}
                        onClick={() => updateCurrent({ finish })}
                        className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition ${
                          currentCustom.finish === finish
                            ? 'bg-red-600/30 border-red-500 text-white'
                            : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {finish === 'gloss' ? 'Yaltiroq' : finish === 'metallic' ? 'Metallik' : 'Matoviy'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Window Tint */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-3">
                  Oynalar Qoraytirish (Toning)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'clear', label: 'Shaffof' },
                    { id: 'dark', label: 'Qora Limo (100%)' },
                    { id: 'chameleon', label: 'Xameleon' },
                  ].map((tint) => (
                    <button
                      key={tint.id}
                      onClick={() => updateCurrent({ windowTint: tint.id as 'clear' | 'dark' | 'chameleon' })}
                      className={`py-2.5 px-3 rounded-lg text-xs font-medium border transition ${
                        currentCustom.windowTint === tint.id
                          ? 'bg-blue-600/30 border-blue-500 text-white'
                          : 'bg-zinc-800/60 border-zinc-700/50 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tint.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHEELS */}
          {activeTab === 'wheels' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-3">
                  Balon va Diska Turlari
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {wheelOptions.map((wheel) => (
                    <button
                      key={wheel.id}
                      onClick={() => updateCurrent({ wheelStyle: wheel.id })}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition ${
                        currentCustom.wheelStyle === wheel.id
                          ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700">
                        <Disc className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{wheel.label}</div>
                        <div className="text-xs text-zinc-400">{wheel.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rim Color */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-3">
                  Diska Qoplamasi Rangi
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {rimColors.map((rim) => (
                    <button
                      key={rim.hex}
                      onClick={() => updateCurrent({ rimColor: rim.hex })}
                      className="flex flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <div
                        className={`w-11 h-11 rounded-full border-2 transition ${
                          currentCustom.rimColor.toLowerCase() === rim.hex.toLowerCase()
                            ? 'border-white ring-2 ring-red-500 scale-105'
                            : 'border-zinc-700'
                        }`}
                        style={{ backgroundColor: rim.hex }}
                      />
                      <span className="text-[10px] text-zinc-400 text-center">{rim.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXTRAS */}
          {activeTab === 'extras' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-3">
                  Orqa Spoyler (Qanot)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'none', label: "Spoylersiz", desc: "Klassik toza ko'rinish" },
                    { id: 'sport', label: 'Sport Qanot', desc: 'Ko‘tarilgan aerodinamik qanot' },
                    { id: 'gt', label: 'GT Poyga Spoyleri', desc: 'Katta sport poyga qanoti' },
                  ].map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => updateCurrent({ spoilerStyle: sp.id as 'none' | 'sport' | 'gt' })}
                      className={`p-3.5 rounded-xl border text-left transition ${
                        currentCustom.spoilerStyle === sp.id
                          ? 'bg-red-600/20 border-red-500 text-white ring-1 ring-red-500'
                          : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      <div className="font-semibold text-sm">{sp.label}</div>
                      <div className="text-xs text-zinc-400">{sp.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Underglow Neon */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-semibold uppercase text-zinc-400 tracking-wider block mb-3">
                  Mashina Osti Neon Yoritgichi (Underglow)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {underglowOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => updateCurrent({ underglowColor: opt.color })}
                      className="flex flex-col items-center gap-1.5 focus:outline-none"
                    >
                      <div
                        className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition ${
                          currentCustom.underglowColor === opt.color
                            ? 'border-white ring-2 ring-cyan-500 scale-105'
                            : 'border-zinc-700'
                        }`}
                        style={{ backgroundColor: opt.color || '#27272a' }}
                      >
                        {!opt.color && <span className="text-xs text-zinc-500">OFF</span>}
                      </div>
                      <span className="text-[10px] text-zinc-400 text-center">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition shadow-lg shadow-red-600/30"
          >
            Tayyor, Haydash!
          </button>
        </div>
      </div>
    </div>
  );
};
