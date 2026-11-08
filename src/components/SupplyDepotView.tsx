import React, { useState } from 'react';
import { 
  Package, 
  Download, 
  CheckCircle, 
  BookOpen, 
  HardDrive, 
  Search, 
  ExternalLink, 
  Play, 
  Cpu, 
  FileText, 
  Radio, 
  ShieldCheck,
  Server
} from 'lucide-react';
import { NOMAD_CURATED_APPS, NomadCuratedApp } from '../data/nomadData';
import { Language } from '../types';

interface SupplyDepotViewProps {
  lang: Language;
}

export const SupplyDepotView: React.FC<SupplyDepotViewProps> = ({ lang }) => {
  const [activeCatalog, setActiveCatalog] = useState<'APPS' | 'ZIM' | 'PACKS'>('APPS');
  const [searchQuery, setSearchQuery] = useState('');
  const [apps, setApps] = useState<NomadCuratedApp[]>(NOMAD_CURATED_APPS);

  const zimArchives = [
    {
      id: 'wiki-pt',
      title: 'Wikipédia em Português (Seleção Essencial)',
      size: '4.2 GB',
      articles: '120.000 artigos',
      category: 'Enciclopédia Geral',
      installed: true
    },
    {
      id: 'wiki-med',
      title: 'WikiMed - Enciclopédia Médica Offline',
      size: '1.8 GB',
      articles: '75.000 verbetes',
      category: 'Saúde & Emergência',
      installed: true
    },
    {
      id: 'wikivoyage',
      title: 'Wikivoyage - Rotas, Cidades & Geografia',
      size: '950 MB',
      articles: '30.000 destinos',
      category: 'Geografia & Abrigo',
      installed: false
    },
    {
      id: 'survival-manuals',
      title: 'Manuais Militares de Campo (US Army FM 21-76)',
      size: '480 MB',
      articles: '18 volumes completos',
      category: 'Sobrevivência Tática',
      installed: true
    }
  ];

  const creatorPacks = [
    {
      title: 'Pacote de Comunicação de Emergência & Rádio',
      curator: 'Crosstalk Solutions',
      items: 'Manuais Baofeng, diagramas de antenas dipolo, repetidoras estaduais',
      installed: true
    },
    {
      title: 'Guia de Segurança Alimentar & Tratamento Hídrico',
      curator: 'Comunidade NOMAD',
      items: 'Plantas comestíveis da América do Sul, filtros de carvão e desidratação',
      installed: false
    }
  ];

  const filteredApps = apps.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-3.5 pb-20 pt-2 px-3.5 max-w-4xl mx-auto">
      
      {/* 1. Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
                {lang === 'pt' ? 'DEPÓSITO DE SUPRIMENTOS (SUPPLY DEPOT)' : 'NOMAD SUPPLY DEPOT'}
              </h2>
              <div className="text-[10px] text-slate-400 font-mono">
                CATÁLOGO DE APLICATIVOS CURADOS & ARQUIVOS ZIM
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Selector */}
        <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
          <button
            onClick={() => setActiveCatalog('APPS')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeCatalog === 'APPS'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Apps Docker' : 'Curated Apps'}
          </button>
          <button
            onClick={() => setActiveCatalog('ZIM')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeCatalog === 'ZIM'
                ? 'bg-amber-600 text-black shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Arquivos ZIM' : 'Kiwix ZIMs'}
          </button>
          <button
            onClick={() => setActiveCatalog('PACKS')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              activeCatalog === 'PACKS'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Creator Packs' : 'Creator Packs'}
          </button>
        </div>
      </div>

      {/* --- APPS CATALOG --- */}
      {activeCatalog === 'APPS' && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredApps.map((app) => (
              <div 
                key={app.id} 
                className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{app.name}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      app.running 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {app.running ? 'PORT :' + app.port : 'PARADO'}
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">{app.category}</div>
                  <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex gap-1 font-mono text-[9px] text-slate-400">
                    {app.tags.map((t, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded bg-slate-800">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setApps(prev => prev.map(a => a.id === app.id ? { ...a, running: !a.running } : a));
                    }}
                    className={`px-3 py-1 rounded font-mono text-[10px] font-bold ${
                      app.running 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                        : 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {app.running ? 'Reiniciar' : 'Iniciar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- ZIM ARCHIVES --- */}
      {activeCatalog === 'ZIM' && (
        <div className="space-y-2">
          {zimArchives.map((zim) => (
            <div 
              key={zim.id}
              className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  {zim.title}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {zim.category} • {zim.articles} • Tamanho: <strong className="text-slate-200">{zim.size}</strong>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold shrink-0 ${
                zim.installed 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {zim.installed ? 'DISPONÍVEL OFFLINE' : 'DISPONÍVEL DOWNLOAD'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* --- CREATOR PACKS --- */}
      {activeCatalog === 'PACKS' && (
        <div className="space-y-2">
          {creatorPacks.map((pack, idx) => (
            <div 
              key={idx}
              className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300 text-sm">{pack.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  {pack.curator}
                </span>
              </div>
              <p className="text-slate-300 text-xs">
                {pack.items}
              </p>
              <div className="flex justify-end pt-1">
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Pronto para uso
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
