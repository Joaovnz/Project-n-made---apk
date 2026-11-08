/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TacticalHeader } from './components/TacticalHeader';
import { BottomNav } from './components/BottomNav';
import { CommandCenter } from './components/CommandCenter';
import { AiAssistant } from './components/AiAssistant';
import { OfflineMap } from './components/OfflineMap';
import { MedicalReference } from './components/MedicalReference';
import { MeshComms } from './components/MeshComms';
import { SurvivalTools } from './components/SurvivalTools';
import { SupplyDepotView } from './components/SupplyDepotView';
import { ActiveTab, TacticalTheme, Language, SystemVitals } from './types';
import { SurvivalGuide } from './data/nomadData';
import { ShieldAlert, X, Radio, Volume2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [theme, setTheme] = useState<TacticalTheme>('dark');
  const [lang, setLang] = useState<Language>('pt');
  const [selectedGuide, setSelectedGuide] = useState<SurvivalGuide | null>(null);
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  const [vitals, setVitals] = useState<SystemVitals>({
    cpuUsage: 14,
    ramUsagePercent: 32,
    ramUsedGb: 2.6,
    ramTotalGb: 8.0,
    diskUsedGb: 142,
    diskTotalGb: 512,
    batteryPercent: 88,
    isCharging: false,
    temperatureC: 41,
    uptimeHours: 72,
    isOffgrid: true,
    serverConnected: true,
    serverUrl: 'http://192.168.1.100:8080'
  });

  // Query Battery API if supported on device
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setVitals(v => ({
            ...v,
            batteryPercent: Math.round(battery.level * 100),
            isCharging: battery.charging
          }));
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
  }, []);

  // SOS Countdown timer
  useEffect(() => {
    let timer: any;
    if (sosCountdown !== null && sosCountdown > 0) {
      timer = setTimeout(() => {
        setSosCountdown(sosCountdown - 1);
      }, 1000);
    } else if (sosCountdown === 0) {
      // Trigger Siren sound
      playDistressSiren();
    }
    return () => clearTimeout(timer);
  }, [sosCountdown]);

  const playDistressSiren = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);

      // Sweep frequency up and down like emergency siren
      const now = audioCtx.currentTime;
      for (let i = 0; i < 6; i++) {
        osc.frequency.setValueAtTime(600, now + i * 0.8);
        osc.frequency.linearRampToValueAtTime(1100, now + i * 0.8 + 0.4);
        osc.frequency.linearRampToValueAtTime(600, now + i * 0.8 + 0.8);
      }

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 5);
      setTimeout(() => audioCtx.close(), 5500);
    } catch {}
  };

  const handleTriggerSos = () => {
    setShowSosModal(true);
    setSosCountdown(5);
  };

  const cancelSos = () => {
    setShowSosModal(false);
    setSosCountdown(null);
  };

  // Tactical theme wrapper classes
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'amber':
        return 'theme-amber text-amber-300 bg-[#0e0902]';
      case 'green':
        return 'theme-green text-emerald-300 bg-[#020e06]';
      case 'oled':
        return 'theme-oled text-zinc-200 bg-black';
      default:
        return 'text-slate-100 bg-[#090d16]';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${getThemeWrapperClass()}`}>
      
      {/* 1. Tactical Header */}
      <TacticalHeader
        vitals={vitals}
        onToggleOffgrid={() => setVitals(v => ({ ...v, isOffgrid: !v.isOffgrid }))}
        theme={theme}
        onChangeTheme={setTheme}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'pt' ? 'en' : 'pt')}
        onTriggerSos={handleTriggerSos}
        onOpenSettings={() => setActiveTab('tools')}
      />

      {/* 2. Main Content View Router */}
      <main className="flex-1 w-full overflow-x-hidden">
        {activeTab === 'dashboard' && (
          <CommandCenter
            vitals={vitals}
            onNavigate={setActiveTab}
            lang={lang}
            onSelectGuide={setSelectedGuide}
            onUpdateServerUrl={(url) => setVitals(v => ({ ...v, serverUrl: url }))}
          />
        )}

        {activeTab === 'ai' && (
          <AiAssistant lang={lang} />
        )}

        {activeTab === 'maps' && (
          <OfflineMap lang={lang} />
        )}

        {activeTab === 'medical' && (
          <MedicalReference lang={lang} />
        )}

        {activeTab === 'mesh' && (
          <MeshComms lang={lang} />
        )}

        {activeTab === 'tools' && (
          <SurvivalTools lang={lang} />
        )}

        {activeTab === 'depot' && (
          <SupplyDepotView lang={lang} />
        )}
      </main>

      {/* 3. Mobile Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        lang={lang}
      />

      {/* Guide Details Reader Modal */}
      {selectedGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="font-bold text-xs text-slate-100 font-mono tracking-wide">
                  {selectedGuide.title}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedGuide(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs leading-relaxed font-sans text-slate-200">
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
                <strong>RESUMO OPERACIONAL:</strong> {selectedGuide.summary}
              </div>

              <div className="whitespace-pre-wrap font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300">
                {selectedGuide.content}
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedGuide(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
              >
                Fechar Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMERGENCY SOS MODAL */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-red-950/95 backdrop-blur-xl flex items-center justify-center p-4 select-none">
          <div className="bg-slate-950 border-2 border-rose-500 rounded-2xl max-w-sm w-full p-5 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-600/30 border-2 border-rose-500 mx-auto flex items-center justify-center animate-ping" style={{ animationDuration: '1.5s' }}>
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>

            <div>
              <h2 className="text-base font-black text-rose-400 font-mono tracking-widest uppercase">
                EMISSÃO DE ALERTA SOS
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Transmitindo coordenadas de emergência via rádio LoRa Meshtastic (Canal #911) e ativando alarme sonoro.
              </p>
            </div>

            {sosCountdown !== null && sosCountdown > 0 ? (
              <div className="py-2">
                <span className="text-5xl font-mono font-black text-amber-400">
                  0{sosCountdown}
                </span>
                <span className="block text-[11px] font-mono text-slate-400 mt-1">
                  SEGUNDOS PARA CANCELAR
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-900/60 border border-rose-500/50 text-xs font-mono text-rose-200 animate-pulse">
                🚨 TRANSMISSÃO ATIVA • ALARME DISPARADO
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={cancelSos}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs border border-slate-600"
              >
                CANCELAR SOS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
