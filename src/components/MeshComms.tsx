import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  ShieldAlert, 
  Wifi, 
  Signal, 
  Users, 
  MapPin, 
  Zap,
  CheckCircle2,
  RefreshCw,
  Clock
} from 'lucide-react';
import { INITIAL_MESHTASTIC_MESSAGES, MeshtasticMessage } from '../data/nomadData';
import { Language } from '../types';

interface MeshCommsProps {
  lang: Language;
}

export const MeshComms: React.FC<MeshCommsProps> = ({ lang }) => {
  const [messages, setMessages] = useState<MeshtasticMessage[]>(INITIAL_MESHTASTIC_MESSAGES);
  const [activeChannel, setActiveChannel] = useState<'LongFast (#0)' | 'Emergência (#911)' | 'Equipe (#1)'>('LongFast (#0)');
  const [input, setInput] = useState('');
  const [nodes, setNodes] = useState([
    { id: '!8fe2', name: 'Base-Alpha (Estação Repetidora)', battery: 94, rssi: -78, snr: 9.8, hops: 0, distance: '1.2 km' },
    { id: '!41c9', name: 'Operador-Bravo (Rádio Portátil)', battery: 68, rssi: -92, snr: 5.1, hops: 1, distance: '3.8 km' },
    { id: '!2a50', name: 'Posto-Medico (Depósito Sul)', battery: 82, rssi: -84, snr: 8.2, hops: 0, distance: '2.1 km' },
    { id: '!7f19', name: 'Vigia-Norte (Ponto Alto)', battery: 45, rssi: -105, snr: 2.0, hops: 2, distance: '8.4 km' },
  ]);

  const channels: Array<'LongFast (#0)' | 'Emergência (#911)' | 'Equipe (#1)'> = [
    'LongFast (#0)',
    'Emergência (#911)',
    'Equipe (#1)'
  ];

  const quickTemplates = [
    'SITUAÇÃO SEGURA / TUDO NORMAL',
    'FONTE DE ÁGUA IDENTIFICADA',
    'CHEGANDO AO PONTO DE ENCONTRO',
    'REFORÇO SOLICITADO NO LOCAL',
    'MANTENDO ESCUTA NO CANAL'
  ];

  const handleSend = (textToSend?: string, isEmergency = false) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    const newMsg: MeshtasticMessage = {
      id: `mesh-${Date.now()}`,
      sender: 'Meu-Nomad !9a3b (Local)',
      channel: activeChannel,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rssi: -65,
      snr: 10.5,
      isEmergency
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
  };

  const sendSosBeacon = () => {
    const coordsStr = 'LAT: -15.7801 LNG: -47.9292';
    handleSend(`🚨 [SOS MAYDAY BEACON] Operador em emergência. Posição: ${coordsStr}. Frequência de escuta 915MHz LoRa LongFast.`, true);
  };

  const filteredMessages = messages.filter(m => m.channel === activeChannel || m.isEmergency);

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-3xl mx-auto px-3 pt-2">
      
      {/* 1. LoRa Radio Status Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md shrink-0 mb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-100">
                <span>MESHTASTIC LoRa 915 MHz</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                  LONGFAST
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {nodes.length} NÓS MESH ATIVOS NA MALHA LOCAL
              </div>
            </div>
          </div>

          <button
            onClick={sendSosBeacon}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold border border-rose-400/50 shadow-lg shadow-rose-950/50 active:scale-95"
            title="Emitir Beacon SOS com GPS no canal de emergência"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SOS BEACON</span>
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-800 text-xs font-mono">
          <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">CANAL:</span>
          {channels.map((chan) => (
            <button
              key={chan}
              onClick={() => setActiveChannel(chan)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-all ${
                activeChannel === chan
                  ? chan.includes('911') 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {chan}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Message Stream */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-2">
        {filteredMessages.map((msg) => {
          const isMe = msg.sender.includes('(Local)');
          return (
            <div
              key={msg.id}
              className={`p-2.5 rounded-xl text-xs space-y-1 shadow-sm border ${
                msg.isEmergency
                  ? 'bg-rose-950/40 border-rose-500/60 text-rose-100 animate-pulse'
                  : isMe
                    ? 'bg-amber-950/30 border-amber-500/40 text-slate-100 ml-6'
                    : 'bg-slate-900 border-slate-800 text-slate-200 mr-6'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={`font-bold ${isMe ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {msg.sender}
                </span>
                <div className="flex items-center gap-2 text-slate-400">
                  <span>RSSI: {msg.rssi}dBm</span>
                  <span>SNR: {msg.snr}dB</span>
                  <span>{msg.timestamp}</span>
                </div>
              </div>

              <div className="text-xs leading-relaxed font-mono">
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Templates Bar */}
      <div className="flex items-center gap-1 overflow-x-auto py-1 shrink-0 no-scrollbar">
        {quickTemplates.map((tmpl, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(tmpl)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-amber-300 rounded-full shrink-0 transition-colors whitespace-nowrap font-mono"
          >
            {tmpl}
          </button>
        ))}
      </div>

      {/* Send Input */}
      <div className="shrink-0 pt-1.5 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl p-1.5 shadow-lg focus-within:border-amber-500"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Transmitir no canal ${activeChannel}...`}
            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold transition-all"
            aria-label="Transmitir pacote"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
