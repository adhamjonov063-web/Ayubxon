import React from 'react';
import { PlayerCarState, GasStationZone } from '../types/game';
import { CAR_MODELS } from '../data/carModels';
import { Fuel, Zap, Flame, Compass, AlertTriangle, ShieldCheck, Camera, Car } from 'lucide-react';

interface SinglePlayerHUDProps {
  player: PlayerCarState;
  label: string;
  colorScheme: 'blue' | 'red';
  isNearGasStation: boolean;
  onOpenGasStation: () => void;
  onOpenTuning: () => void;
}

export const SinglePlayerHUD: React.FC<SinglePlayerHUDProps> = ({
  player,
  label,
  colorScheme,
  isNearGasStation,
  onOpenGasStation,
  onOpenTuning,
}) => {
  const absSpeed = Math.round(Math.abs(player.speed));
  const isLowFuel = player.fuel < 18;
  const isCriticalFuel = player.fuel <= 2;
  const carModel = CAR_MODELS[player.modelId || 'gentra'] || CAR_MODELS.gentra;

  const badgeBg = colorScheme === 'blue' ? 'bg-blue-600/30 text-blue-300 border-blue-500/40' : 'bg-red-600/30 text-red-300 border-red-500/40';

  return (
    <div className="pointer-events-none flex flex-col justify-between h-full p-4 select-none">
      {/* Top Header info */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${badgeBg} border`}>
              {label}
            </div>

            {/* Car Model Badge */}
            <button
              onClick={onOpenTuning}
              title="Mashinani almashtirish"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 text-white text-xs font-bold transition shadow"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>{carModel.name}</span>
            </button>

            {player.drift > 0.2 && (
              <div className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1 animate-bounce">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                DRIFT x{Math.round(player.drift * 10)}
              </div>
            )}
          </div>

          {/* Traffic Police & Driver Rating Status */}
          <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded-xl text-[11px] backdrop-blur-sm">
            <div className="flex items-center gap-1 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Ball: {player.driverPoints ?? 100}/100</span>
            </div>
            <div className="text-zinc-600">•</div>
            <div className="text-zinc-400">
              Jarima: <span className="font-mono font-bold text-red-400">{(player.fines ?? 0).toLocaleString()} so'm</span>
            </div>
          </div>
        </div>

        {/* Center Alert Banners: Traffic Violation or Gas Station Prompt */}
        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          {/* Traffic Rule Violation Banner */}
          {player.recentViolation && (
            <div className="bg-red-600/95 text-white px-5 py-2.5 rounded-2xl shadow-2xl border-2 border-red-400 flex items-center gap-3 animate-pulse">
              <AlertTriangle className="w-6 h-6 text-yellow-300 shrink-0" />
              <div>
                <div className="text-xs font-black uppercase tracking-wide flex items-center gap-1.5">
                  <span>YO'L QOIDASI BUZILDI!</span>
                </div>
                <div className="text-xs text-white font-medium">{player.recentViolation.title}</div>
                <div className="text-[11px] font-bold text-yellow-200">
                  Jarima: -{player.recentViolation.amount.toLocaleString()} so'm
                </div>
              </div>
            </div>
          )}

          {/* Gas Station Alert Prompt */}
          {isNearGasStation && (
            <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-4 py-2 rounded-xl shadow-xl border border-yellow-400/50 flex items-center gap-3">
              <Fuel className="w-5 h-5 text-yellow-300 animate-bounce" />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide">Zapravkaga Kirdingiz!</div>
                <div className="text-[11px] text-yellow-100">Yoqilg'i quyish uchun bosing yoki [E] bosing</div>
              </div>
              <button
                onClick={onOpenGasStation}
                className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-black text-xs px-3 py-1.5 rounded-lg transition shadow"
              >
                Quyish ⛽
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Gauges */}
      <div className="flex items-end justify-between">
        {/* Fuel & Nitro Status */}
        <div className="pointer-events-auto flex flex-col gap-2 bg-zinc-950/85 border border-zinc-800 p-3 rounded-2xl shadow-xl w-48 backdrop-blur-md">
          {/* Fuel Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
                <Fuel className={`w-3.5 h-3.5 ${isLowFuel ? 'text-red-400 animate-pulse' : 'text-zinc-400'}`} />
                Benzin Baki
              </span>
              <span
                className={`font-mono font-bold text-xs ${
                  isCriticalFuel ? 'text-red-500 animate-pulse' : isLowFuel ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {Math.round(player.fuel)}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-100 ${
                  isLowFuel ? 'bg-red-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                }`}
                style={{ width: `${player.fuel}%` }}
              />
            </div>
            {isLowFuel && (
              <div className="text-[10px] text-red-400 mt-1 font-semibold flex items-center justify-between">
                <span>⚠️ Benzin kam!</span>
                <button
                  onClick={onOpenGasStation}
                  className="underline hover:text-white"
                >
                  Zapravkaga boring
                </button>
              </div>
            )}
          </div>

          {/* Nitro (NOS) Bar */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="flex items-center gap-1.5 text-zinc-400 font-semibold">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                Nitro (NOS)
              </span>
              <span className="font-mono font-bold text-xs text-cyan-400">
                {Math.round(player.nitroLevel)}%
              </span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-75"
                style={{ width: `${player.nitroLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Speedometer Dial */}
        <div className="pointer-events-auto bg-zinc-950/85 border border-zinc-800 p-4 rounded-3xl shadow-2xl flex flex-col items-center justify-center min-w-[130px] backdrop-blur-md">
          <div className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-0.5">TEZLIK</div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black font-mono tracking-tight ${absSpeed > 70 ? 'text-red-400' : 'text-white'}`}>
              {absSpeed}
            </span>
            <span className="text-xs font-bold text-zinc-400">km/h</span>
          </div>

          {/* Speed Limit Indicator (70 km/h) */}
          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
            <span>Chegara:</span>
            <span className="text-red-400 font-mono">70 km/h</span>
          </div>

          {/* Gear & RPM */}
          <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-zinc-800 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-zinc-500 text-[10px]">UZATMA:</span>
              <span className="font-bold text-yellow-400 font-mono">
                {player.speed < -1 ? 'R' : player.gear}
              </span>
            </div>
            <div className="font-mono text-[11px] text-zinc-400">
              {player.rpm} <span className="text-[9px] text-zinc-500">RPM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface MinimapProps {
  player1: PlayerCarState;
  player2?: PlayerCarState;
  gasStations: GasStationZone[];
}

export const Minimap: React.FC<MinimapProps> = ({ player1, player2, gasStations }) => {
  const mapScale = 140 / 300;
  const toMapX = (worldX: number) => 70 + worldX * mapScale;
  const toMapY = (worldZ: number) => 70 + worldZ * mapScale;

  const radars = [
    { x: 0, z: 45 },
    { x: 0, z: -45 },
    { x: 45, z: 0 },
    { x: -45, z: 0 },
  ];

  return (
    <div className="relative w-[140px] h-[140px] bg-zinc-950/90 rounded-2xl border border-zinc-700/80 shadow-2xl overflow-hidden backdrop-blur-md pointer-events-auto">
      <svg className="w-full h-full" viewBox="0 0 140 140">
        <rect x="5" y="5" width="130" height="130" fill="#18181b" stroke="#3f3f46" strokeWidth="1" rx="8" />

        {/* Roads */}
        {[-120, -60, 0, 60, 120].map((coord) => (
          <React.Fragment key={coord}>
            <line
              x1="5"
              y1={toMapY(coord)}
              x2="135"
              y2={toMapY(coord)}
              stroke="#334155"
              strokeWidth="5"
            />
            <line
              x1={toMapX(coord)}
              y1="5"
              x2={toMapX(coord)}
              y2="135"
              stroke="#334155"
              strokeWidth="5"
            />
          </React.Fragment>
        ))}

        {/* Gas Stations */}
        {gasStations.map((gs) => (
          <g key={gs.id} transform={`translate(${toMapX(gs.x)}, ${toMapY(gs.z)})`}>
            <circle r="7" fill="#15803d" stroke="#86efac" strokeWidth="1.5" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="8"
              fill="#ffffff"
              fontWeight="bold"
            >
              ⛽
            </text>
          </g>
        ))}

        {/* Speed Radar Cameras (Camera icons) */}
        {radars.map((r, i) => (
          <g key={i} transform={`translate(${toMapX(r.x)}, ${toMapY(r.z)})`}>
            <circle r="4.5" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6"
              fill="#ffffff"
            >
              📷
            </text>
          </g>
        ))}

        {/* Player 2 icon (Red arrow) */}
        {player2 && (
          <g
            transform={`translate(${toMapX(player2.x)}, ${toMapY(player2.z)}) rotate(${
              (-player2.angle * 180) / Math.PI
            })`}
          >
            <polygon points="0,-6 4,5 -4,5" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
          </g>
        )}

        {/* Player 1 icon (Blue arrow) */}
        <g
          transform={`translate(${toMapX(player1.x)}, ${toMapY(player1.z)}) rotate(${
            (-player1.angle * 180) / Math.PI
          })`}
        >
          <polygon points="0,-7 5,6 -5,6" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
        </g>
      </svg>

      <div className="absolute top-1.5 left-2 flex items-center gap-1 text-[9px] font-bold text-zinc-400">
        <Compass className="w-2.5 h-2.5 text-zinc-300" />
        SHAHAR RADARI
      </div>
    </div>
  );
};
