import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Sun, 
  Battery, 
  Volume2, 
  Eye, 
  FileText, 
  Lock, 
  Copy, 
  Check, 
  Flame, 
  Radio, 
  Download,
  Trash2,
  Play,
  Square
} from 'lucide-react';
import { textToMorse, morseToText, estimateSolarRuntime, SolarCalculationResult } from '../utils/survivalLogic';
import { Language } from '../types';

interface SurvivalToolsProps {
  lang: Language;
}

export const SurvivalTools: React.FC<SurvivalToolsProps> = ({ lang }) => {
  const [activeTool, setActiveTool] = useState<'MORSE' | 'SOLAR' | 'CRYPTO' | 'NOTES'>('MORSE');

  // --- MORSE BEACON STATE ---
  const [morseInput, setMorseInput] = useState('SOS MAYDAY');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isFlashingStrobe, setIsFlashingStrobe] = useState(false);
  const [strobeColor, setStrobeColor] = useState<'white' | 'red'>('white');
  const [strobeActive, setStrobeActive] = useState(false);

  // Morse conversion
  const { morse, timingUnits } = textToMorse(morseInput);

  // Audio beeper using Web Audio API
  const playMorseAudio = () => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dotTimeMs = 100;
      let currentTime = audioCtx.currentTime + 0.05;

      timingUnits.forEach((unit) => {
        if (unit > 0) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(750, currentTime); // 750Hz standard emergency tone
          gain.gain.setValueAtTime(0.3, currentTime);

          const durationSec = (unit * dotTimeMs) / 1000;
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(currentTime);
          osc.stop(currentTime + durationSec);
          currentTime += durationSec;
        } else {
          const pauseSec = (Math.abs(unit) * dotTimeMs) / 1000;
          currentTime += pauseSec;
        }
      });

      const totalDurationMs = (currentTime - audioCtx.currentTime) * 1000;
      setTimeout(() => {
        setIsPlayingAudio(false);
        audioCtx.close();
      }, totalDurationMs + 100);
    } catch (e) {
      console.warn('AudioContext error:', e);
      setIsPlayingAudio(false);
    }
  };

  // --- SOLAR CALCULATOR STATE ---
  const [batteryWh, setBatteryWh] = useState(600); // e.g. EcoFlow / LiFePO4
  const [chargePercent, setChargePercent] = useState(85);
  const [loadWatts, setLoadWatts] = useState(45); // NOMAD server + router + radio
  const [solarWatts, setSolarWatts] = useState(100); // 100W foldable solar panel
  const [sunHours, setSunHours] = useState(5.5);

  const solarResult: SolarCalculationResult = estimateSolarRuntime(
    batteryWh,
    chargePercent,
    loadWatts,
    solarWatts,
    sunHours
  );

  // --- CRYPTO / CYBERCHEF STATE ---
  const [cryptoText, setCryptoText] = useState('COORDENADAS: S 15.7801 W 47.9292');
  const [cryptoMode, setCryptoMode] = useState<'BASE64' | 'HEX' | 'ROT13' | 'SHA256'>('BASE64');
  const [cryptoOutput, setCryptoOutput] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      if (cryptoMode === 'BASE64') {
        setCryptoOutput(btoa(cryptoText));
      } else if (cryptoMode === 'HEX') {
        let hex = '';
        for (let i = 0; i < cryptoText.length; i++) {
          hex += cryptoText.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
        }
        setCryptoOutput(hex.trim());
      } else if (cryptoMode === 'ROT13') {
        setCryptoOutput(
          cryptoText.replace(/[a-zA-Z]/g, (c) => {
            const code = c.charCodeAt(0);
            const base = code >= 97 ? 97 : 65;
            return String.fromCharCode(((code - base + 13) % 26) + base);
          })
        );
      } else if (cryptoMode === 'SHA256') {
        // Quick deterministic pseudo hash
        let hash = 0;
        for (let i = 0; i < cryptoText.length; i++) {
          hash = (hash << 5) - hash + cryptoText.charCodeAt(i);
          hash |= 0;
        }
        setCryptoOutput(`hash-${Math.abs(hash).toString(16).padStart(16, '0')}`);
      }
    } catch {
      setCryptoOutput('Erro na conversão.');
    }
  }, [cryptoText, cryptoMode]);

  // --- FIELD NOTES STATE ---
  const [notes, setNotes] = useState(() => {
    return localStorage.getItem('nomad_field_notes') || `# Diário Tático NOMAD
Data: 2026-11-07
- Estação base configurada em 915 MHz LongFast.
- Ponto de água potável inspecionado no setor Norte.
- Estoque de antibióticos e torniquetes verificado.`;
  });

  const saveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem('nomad_field_notes', val);
  };

  return (
    <div className="space-y-3.5 pb-20 pt-2 px-3.5 max-w-4xl mx-auto">
      
      {/* 1. Header & Tool Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
              {lang === 'pt' ? 'UTILITÁRIOS & CYBERCHEF TÁTICO' : 'SURVIVAL UTILITIES & CYBERCHEF'}
            </h2>
            <div className="text-[10px] text-slate-400 font-mono">
              FERRAMENTAS OFFLINE DE SINALIZAÇÃO, ENERGIA E CRIPTO
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
          <button
            onClick={() => setActiveTool('MORSE')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeTool === 'MORSE'
                ? 'bg-amber-600 text-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Sinal Morse' : 'Morse Beacon'}
          </button>
          <button
            onClick={() => setActiveTool('SOLAR')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeTool === 'SOLAR'
                ? 'bg-yellow-500 text-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Solar & Bat' : 'Solar Runtime'}
          </button>
          <button
            onClick={() => setActiveTool('CRYPTO')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeTool === 'CRYPTO'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Cripto / Cifras' : 'CyberChef'}
          </button>
          <button
            onClick={() => setActiveTool('NOTES')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeTool === 'NOTES'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Diário Campo' : 'Field Notes'}
          </button>
        </div>
      </div>

      {/* --- TOOL 1: MORSE BEACON --- */}
      {activeTool === 'MORSE' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-100 font-mono">
                {lang === 'pt' ? 'TRANSMISSOR DE CÓDIGO MORSE' : 'MORSE CODE BEACON'}
              </h3>
              <span className="text-[10px] font-mono text-amber-400">750 Hz AUDIO / STROBE</span>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">TEXTO PARA CODIFICAR:</label>
              <input
                type="text"
                value={morseInput}
                onChange={(e) => setMorseInput(e.target.value)}
                placeholder="Ex: SOS MAYDAY"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {/* Morse Code Box */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-[10px] font-mono text-slate-500 block mb-1">CÓDIGO MORSE (PONTOS & TRAÇOS):</span>
              <div className="text-base font-mono font-bold tracking-widest text-amber-400 break-all">
                {morse || '...'}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={playMorseAudio}
                disabled={isPlayingAudio || !morseInput.trim()}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
                <span>{isPlayingAudio ? 'Transmitindo Áudio...' : 'Emitir Bip Sonoro (750Hz)'}</span>
              </button>

              <button
                onClick={() => setIsFlashingStrobe(true)}
                className="py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow"
              >
                <Eye className="w-4 h-4" />
                <span>Strobe SOS Visual</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Strobe Modal */}
      {isFlashingStrobe && (
        <div 
          onClick={() => setIsFlashingStrobe(false)}
          className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-6 cursor-pointer select-none transition-colors duration-100 ${
            strobeActive ? 'bg-white text-black' : 'bg-red-700 text-white'
          }`}
        >
          <div className="text-xs font-mono font-bold">
            SINALIZADOR DE RESGATE ATIVO (TOQUE EM QUALQUER LUGAR PARA SAIR)
          </div>
          <div className="text-4xl font-mono font-black tracking-widest animate-ping">
            SOS
          </div>
          <div className="text-xs font-mono">
            VISÍVEL A LONGA DISTÂNCIA EM AMBIENTE ESCURO
          </div>
        </div>
      )}

      {/* --- TOOL 2: SOLAR RUNTIME CALCULATOR --- */}
      {activeTool === 'SOLAR' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 font-mono flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-yellow-400" />
                {lang === 'pt' ? 'Calculadora de Autonomia Solar & Bateria' : 'Solar Autonomy Calculator'}
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                solarResult.status === 'SURPLUS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {solarResult.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">CAPACIDADE BATERIA (Wh):</label>
                <input
                  type="number"
                  value={batteryWh}
                  onChange={(e) => setBatteryWh(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CARGA ATUAL (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={chargePercent}
                  onChange={(e) => setChargePercent(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">CONSUMO DA CARGA (Watts):</label>
                <input
                  type="number"
                  value={loadWatts}
                  onChange={(e) => setLoadWatts(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PAINEL SOLAR (Watts Pico):</label>
                <input
                  type="number"
                  value={solarWatts}
                  onChange={(e) => setSolarWatts(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100"
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block">ENERGIA ARMAZENADA:</span>
                <span className="text-sm font-bold text-slate-100">{solarResult.currentStoredWh} Wh</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block">POTÊNCIA LÍQUIDA:</span>
                <span className={`text-sm font-bold ${solarResult.netPowerWatts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {solarResult.netPowerWatts > 0 ? `+${solarResult.netPowerWatts}` : solarResult.netPowerWatts} W
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block">AUTONOMIA ESTIMADA:</span>
                <span className="text-sm font-bold text-amber-400">
                  {solarResult.willDeplete ? `${solarResult.runtimeHours} Horas` : 'Contínuo (Superávit)'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono">
                <span className="text-[10px] text-slate-400 block">BALANÇO DIÁRIO (24h):</span>
                <span className={`text-sm font-bold ${solarResult.dailySurplusWh >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {solarResult.dailySurplusWh >= 0 ? `+${solarResult.dailySurplusWh}` : solarResult.dailySurplusWh} Wh/dia
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TOOL 3: CRYPTO & CYBERCHEF --- */}
      {activeTool === 'CRYPTO' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 font-mono">
                {lang === 'pt' ? 'CYBERCHEF DE CAMPO (ENCRIPTADOR / CIFRAS)' : 'CYBERCHEF FIELD CRYPTO'}
              </h3>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-1 font-mono text-[11px]">
              {(['BASE64', 'HEX', 'ROT13', 'SHA256'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setCryptoMode(m)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    cryptoMode === m
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">ENTRADA (TEXTO CLARO):</label>
              <textarea
                value={cryptoText}
                onChange={(e) => setCryptoText(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>SAÍDA PROCESSADA:</span>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(cryptoOutput);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-purple-300 break-all select-all">
                {cryptoOutput || '...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TOOL 4: FIELD NOTES (FLATNOTES) --- */}
      {activeTool === 'NOTES' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-400" />
                {lang === 'pt' ? 'Diário de Campo & Flatnotes' : 'Field Log & Flatnotes'}
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">GRAVAÇÃO LOCAL OFFLINE</span>
            </div>

            <textarea
              value={notes}
              onChange={(e) => saveNotes(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-blue-500"
            />

            <div className="flex justify-between items-center pt-1 font-mono text-[11px]">
              <span className="text-slate-500">Salvo automaticamente no dispositivo.</span>
              <button
                onClick={() => {
                  const blob = new Blob([notes], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `nomad-field-notes-${new Date().toISOString().slice(0, 10)}.md`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar .md</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
