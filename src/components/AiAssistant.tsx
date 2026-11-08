import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Database, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  FileText, 
  ShieldAlert,
  Loader2,
  BookmarkPlus
} from 'lucide-react';
import { queryOfflineAiEngine } from '../utils/offlineAiEngine';
import { Language } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

interface AiAssistantProps {
  lang: Language;
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ lang }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: lang === 'pt' 
        ? 'Olá, Operador. Eu sou o Assistente Tático e de Sobrevivência do Projeto NOMAD. Tenho acesso às bibliotecas locais de primeiros socorros, protocolos de emergência, rádio e purificação de água. Como posso apoiar a operação agora?' 
        : 'Greetings, Operator. I am the Project NOMAD Tactical & Survival Assistant. I have local access to first aid manuals, emergency protocols, radio frequencies and water purification. How can I assist you?',
      timestamp: '12:00',
      source: 'nomad-offline-kb'
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedKb, setSelectedKb] = useState('survival');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const kbOptions = [
    { id: 'survival', label: lang === 'pt' ? 'Sobrevivência & Água' : 'Survival & Water' },
    { id: 'medical', label: lang === 'pt' ? 'Primeiros Socorros / START' : 'First Aid & Triage' },
    { id: 'comms', label: lang === 'pt' ? 'Rádio & Meshtastic' : 'Radio & Comms' },
    { id: 'drugs', label: lang === 'pt' ? 'Farmacologia & Remédios' : 'Herbal & Pharmacy' },
  ];

  const quickPrompts = [
    lang === 'pt' ? 'Como purificar água de rio?' : 'How to purify river water?',
    lang === 'pt' ? 'Passo a passo da Triagem START' : 'Step-by-step START triage',
    lang === 'pt' ? 'Frequências VHF de emergência' : 'VHF emergency frequencies',
    lang === 'pt' ? 'Tratamento de hipotermia grave' : 'Treating severe hypothermia',
    lang === 'pt' ? 'Remédio natural para queimadura' : 'Natural remedy for burns',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          knowledgeBase: selectedKb,
          history: messages.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', text: m.text }))
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const botMsg: Message = {
        id: `b-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || (lang === 'pt' ? 'Não foi possível gerar resposta.' : 'Unable to generate reply.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'nomad-kb'
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      // Local high-performance on-device AI inference engine
      const localResponse = queryOfflineAiEngine(text, lang);
      const fallbackMsg: Message = {
        id: `b-offline-${Date.now()}`,
        sender: 'assistant',
        text: localResponse.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'nomad-local-edge'
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakText = (text: string, id: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      // Strip markdown hashes and asterisks for cleaner speech
      const cleanText = text.replace(/[#*_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang === 'pt' ? 'pt-BR' : 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-3xl mx-auto px-3 pt-2">
      
      {/* Top Header & Knowledge Base selector */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 shadow-md shrink-0 mb-2.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
                {lang === 'pt' ? 'IA TÁTICA NOMAD (OLLAMA & RAG)' : 'NOMAD TACTICAL AI (OLLAMA & RAG)'}
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>QDRANT VECTORS READY</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setMessages([messages[0]])}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
            title="Limpar histórico"
            aria-label="Limpar histórico"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* KB Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
          <span className="text-slate-500 text-[10px] uppercase font-bold shrink-0">KB:</span>
          {kbOptions.map(kb => (
            <button
              key={kb.id}
              onClick={() => setSelectedKb(kb.id)}
              className={`px-2 py-0.5 rounded-md shrink-0 transition-all ${
                selectedKb === kb.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {kb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                  isUser
                    ? 'bg-amber-600 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Sparkles className="w-3 h-3" />
                      {msg.source === 'gemini-flash' ? 'NOMAD CLOUD / FLASH' : 'NOMAD LOCAL INFERENCE'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                  {msg.text}
                </div>

                {!isUser && (
                  <div className="flex items-center justify-end gap-2 pt-2 mt-1.5 border-t border-slate-800/60">
                    <button
                      onClick={() => speakText(msg.text, msg.id)}
                      className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
                      title="Ouvir resposta (Voz sintetizada)"
                    >
                      {speakingId === msg.id ? (
                        <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(msg.text, msg.id)}
                      className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none w-fit text-xs text-amber-400 font-mono">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{lang === 'pt' ? 'Processando inferência tática...' : 'Processing tactical inference...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 shrink-0 no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-amber-300 rounded-full shrink-0 transition-colors active:scale-95 whitespace-nowrap"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Bar */}
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
            placeholder={
              lang === 'pt' 
                ? 'Consulte triagem, água, rádio ou envie instruções...' 
                : 'Ask about triage, water, radio or instructions...'
            }
            className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
