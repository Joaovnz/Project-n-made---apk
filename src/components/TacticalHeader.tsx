import React from 'react';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Battery, 
  BatteryCharging, 
  AlertTriangle, 
  Sun, 
  Moon, 
  Globe, 
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { TacticalTheme, Language, SystemVitals } from '../types';

interface TacticalHeaderProps {
  vitals: SystemVitals;
  onToggleOffgrid: () => void;
  theme: TacticalTheme;
  onChangeTheme: (theme: TacticalTheme) => void;
  lang: Language;
  onToggleLang: () => void;
  onTriggerSos: () => void;
  onOpenSettings: () => void;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  vitals,
  onToggleOffgrid,
  theme,
  onChangeTheme,
  lang,
  onToggleLang,
  onTriggerSos,
  onOpenSettings
}) => {
  const getThemeClass = () => {
    switch (theme) {
      case 'amber':
        return 'border-amber-500/30 bg-amber-950/20 text-amber-400';
      case 'green':
        return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400';
      case 'oled':
        return 'border-zinc-800 bg-black text-zinc-300';
      default:
        return 'border-cyan-500/20 bg-slate-900/90 text-cyan-400';
    }
  };

  return (
    <header className={`sticky top-0 z-40 w-full backdrop-blur-md border-b px-3.5 py-2.5 transition-colors duration-200 ${getThemeClass()}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Left: Branding & Core Node Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 shadow-inner">
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-black tracking-wider uppercase text-slate-100">
                NOMAD
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                FIELD
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <span className={`w-1.5 h-1.5 rounded-full ${vitals.isOffgrid ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping`} style={{ animationDuration: '3s' }} />
              <span>{vitals.isOffgrid ? (lang === 'pt' ? 'OFF-GRID' : 'OFF-GRID') : 'CORE ONLINE'}</span>
            </div>
          </div>
        </div>

        {/* Center: Quick Tactical Badges */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span>TEMP:</span>
            <span className="text-amber-400 font-bold">{vitals.temperatureC}°C</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <span>LoRa:</span>
            <span className="text-emerald-400 font-bold">915MHz</span>
          </div>
        </div>

        {/* Right: Controls & Battery & SOS */}
        <div className="flex items-center gap-1.5">
          {/* Battery Status */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800/80 border border-slate-700/70 text-slate-200 font-mono text-xs">
            {vitals.isCharging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <Battery className={`w-3.5 h-3.5 ${vitals.batteryPercent < 25 ? 'text-rose-400' : 'text-amber-400'}`} />
            )}
            <span className="font-semibold">{vitals.batteryPercent}%</span>
          </div>

          {/* Off-grid toggle */}
          <button
            onClick={onToggleOffgrid}
            title={vitals.isOffgrid ? 'Modo Off-Grid Ativo (Rede Isolada)' : 'Conectado à Rede Local'}
            className={`p-1.5 rounded-md border text-xs font-mono transition-all flex items-center justify-center ${
              vitals.isOffgrid
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            aria-label="Alternar modo off-grid"
          >
            {vitals.isOffgrid ? <WifiOff className="w-4 h-4 text-amber-400" /> : <Wifi className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] font-bold"
            title="Mudar Idioma / Switch Language"
            aria-label="Mudar idioma"
          >
            {lang === 'pt' ? 'PT' : 'EN'}
          </button>

          {/* Theme Quick Toggle */}
          <button
            onClick={() => {
              const themes: TacticalTheme[] = ['dark', 'amber', 'green', 'oled'];
              const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
              onChangeTheme(themes[nextIndex]);
            }}
            className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-400"
            title={`Tema Tático: ${theme.toUpperCase()}`}
            aria-label="Alternar paleta tática"
          >
            <Terminal className="w-4 h-4" />
          </button>

          {/* Emergency SOS Button */}
          <button
            onClick={onTriggerSos}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-lg shadow-rose-950/60 active:scale-95 transition-transform border border-rose-400/40"
            title="Alerta de Emergência SOS"
            aria-label="Emitir alerta SOS"
          >
            <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden xs:inline">SOS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
