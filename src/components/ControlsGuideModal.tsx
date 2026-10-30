import React from 'react';
import { Keyboard, X, Users, Sparkles } from 'lucide-react';

interface ControlsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlsGuideModal: React.FC<ControlsGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">O'yin Boshqaruv Tugmalari</h2>
              <p className="text-xs text-zinc-400">1 va 2 kishilik o'yin uchun klaviatura tugmalari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Player 1 Controls */}
          <div className="bg-zinc-950/70 border border-blue-900/50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              1-O'YINCHI (Moviy Mashina)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Gaz (Tezlanish):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">W</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Tormoz / Orqaga:</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">S</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Rul (Chap / O'ng):</span>
                <span className="font-mono font-bold text-white">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">A</kbd> / <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">D</kbd>
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Qo'l tormozi (Drift):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">SPACE</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Nitro (NOS Tezlatgich):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">SHIFT</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Signal (Gudok):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">H</kbd>
              </div>
            </div>
          </div>

          {/* Player 2 Controls */}
          <div className="bg-zinc-950/70 border border-red-900/50 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-3 text-red-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              2-O'YINCHI (Qizil Mashina - 2 Kishilik Rejimda)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Gaz (Tezlanish):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">↑ (Yuqori)</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Tormoz / Orqaga:</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">↓ (Pastki)</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Rul (Chap / O'ng):</span>
                <span className="font-mono font-bold text-white">
                  <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">←</kbd> / <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded">→</kbd>
                </span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Qo'l tormozi (Drift):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">ENTER</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Nitro (NOS Tezlatgich):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">L</kbd>
              </div>
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg">
                <span className="text-zinc-400">Signal (Gudok):</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded font-mono font-bold text-white">/</kbd>
              </div>
            </div>
          </div>

          {/* Quick Keys */}
          <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center justify-around text-xs text-zinc-300">
            <div><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-bold">E</kbd> Benzin quyish</div>
            <div><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-bold">C</kbd> Kamera ko'rinishi</div>
            <div><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-bold">R</kbd> Mashinani tiklash</div>
            <div><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded font-bold">H</kbd> Panelni yashirish</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition"
          >
            Tushunarli, O'ynash!
          </button>
        </div>
      </div>
    </div>
  );
};
