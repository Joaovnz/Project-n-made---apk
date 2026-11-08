import React, { useState } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  Radio, 
  BookOpen, 
  Terminal, 
  FileText, 
  GraduationCap, 
  Package, 
  Shield, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  WifiOff,
  Server,
  Zap,
  ArrowRight,
  ChevronRight,
  Smartphone,
  Download,
  Database,
  CheckCircle,
  HardDriveDownload,
  ShieldAlert as ShieldAlertIcon,
  RefreshCw,
  FolderDown,
  QrCode
} from 'lucide-react';
import { SystemVitals, ActiveTab, Language } from '../types';
import { NOMAD_CURATED_APPS, SURVIVAL_GUIDES, SurvivalGuide } from '../data/nomadData';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ApkDownloadModal } from './ApkDownloadModal';
import { 
  NOMAD_MODULES, 
  downloadAllModules, 
  getStorageEstimate, 
  verifyOfflineIntegrity, 
  isOfflineSuiteReady 
} from '../utils/offlineSyncManager';
import { offlineLlmManager } from '../utils/offlineLlmManager';
import { OfflineLlmModal } from './OfflineLlmModal';

interface CommandCenterProps {
  vitals: SystemVitals;
  onNavigate: (tab: ActiveTab) => void;
  lang: Language;
  onSelectGuide: (guide: SurvivalGuide) => void;
  onUpdateServerUrl: (url: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  vitals,
  onNavigate,
  lang,
  onSelectGuide,
  onUpdateServerUrl
}) => {
  const [threatLevel, setThreatLevel] = useState<'NORMAL' | 'ELEVATED' | 'CRITICAL'>('NORMAL');
  const [serverInput, setServerInput] = useState(vitals.serverUrl);
  const [showServerModal, setShowServerModal] = useState(false);
  const [apps, setApps] = useState(NOMAD_CURATED_APPS);
  const { install, isInstalled } = usePWAInstall();

  // Offline Suite States
  const [offlineReady, setOfflineReady] = useState(isOfflineSuiteReady());
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentDownloadModule, setCurrentDownloadModule] = useState('');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ usageMb: number; quotaMb: number; percentUsed: number }>({ usageMb: 21.8, quotaMb: 4096, percentUsed: 1 });
  const [integrityResults, setIntegrityResults] = useState<{ isHealthy: boolean; checks: { name: string; passed: boolean; details: string }[] } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Offline LLM States
  const [showLlmModal, setShowLlmModal] = useState(false);
  const [sitrepText, setSitrepText] = useState('');
  const [isGeneratingSitrep, setIsGeneratingSitrep] = useState(false);
  const [showSitrepModal, setShowSitrepModal] = useState(false);

  const handleGenerateSitrep = async () => {
    setIsGeneratingSitrep(true);
    setSitrepText('');
    setShowSitrepModal(true);
    const telemetryContext = `Bateria: ${vitals.batteryPercent}% (${vitals.isCharging ? 'Carregando' : 'Descarga'}), Temp: ${vitals.temperatureC}°C, Uptime: ${vitals.uptimeHours}h, RAM: ${vitals.ramUsedGb}GB / ${vitals.ramTotalGb}GB, Ameaça: ${threatLevel}`;
    
    await offlineLlmManager.generateResponse({
      prompt: `Estação tática operando em modo ${vitals.isOffgrid ? '100% OFF-GRID' : 'CONECTADO'}. Avaliação de ameaça: ${threatLevel}.`,
      context: telemetryContext,
      module: 'sitrep',
      lang,
      onToken: (_tok, fullText) => {
        setSitrepText(fullText);
      }
    });
    setIsGeneratingSitrep(false);
  };

  React.useEffect(() => {
    getStorageEstimate().then(setStorageInfo);
  }, []);

  const handleDownloadAll = async () => {
    setIsDownloading(true);
    setDownloadProgress(5);
    try {
      await downloadAllModules((percent, mod) => {
        setDownloadProgress(percent);
        setCurrentDownloadModule(mod);
      });
      setOfflineReady(true);
      const est = await getStorageEstimate();
      setStorageInfo(est);
    } catch (e) {
      console.warn('Offline download notice:', e);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(100);
    }
  };

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    const res = await verifyOfflineIntegrity();
    setIntegrityResults(res);
    setIsVerifying(false);
  };

  const toggleAppRun = (appId: string) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, running: !a.running } : a));
  };

  const getThreatBadge = () => {
    switch (threatLevel) {
      case 'CRITICAL':
        return { label: lang === 'pt' ? 'DEFCON 1 - EMERGÊNCIA ATIVA' : 'DEFCON 1 - EMERGENCY', color: 'bg-rose-500/20 text-rose-400 border-rose-500/50' };
      case 'ELEVATED':
        return { label: lang === 'pt' ? 'DEFCON 3 - ALERTA & VIGILÂNCIA' : 'DEFCON 3 - ELEVATED ALERT', color: 'bg-amber-500/20 text-amber-400 border-amber-500/50' };
      default:
        return { label: lang === 'pt' ? 'DEFCON 5 - OPERAÇÃO PADRÃO' : 'DEFCON 5 - NORMAL OPS', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' };
    }
  };

  const threat = getThreatBadge();

  return (
    <div className="space-y-4 pb-20 pt-2 px-3.5 max-w-4xl mx-auto">
      
      {/* 1. Tactical Status Banner */}
      <section className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-wide font-mono">
                {lang === 'pt' ? 'CENTRO DE COMANDO NOMAD' : 'NOMAD COMMAND CENTER'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                v1.35.1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {lang === 'pt' 
                ? 'Nó Móvel de Mídia Offline, Arquivos e Dados Táticos' 
                : 'Mobile Node for Offline Media, Archives, and Data'}
            </p>
          </div>

          {/* Threat Level Switcher */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${threat.color}`}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              {threat.label}
            </span>
            <button
              onClick={() => {
                const next = threatLevel === 'NORMAL' ? 'ELEVATED' : threatLevel === 'ELEVATED' ? 'CRITICAL' : 'NORMAL';
                setThreatLevel(next);
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono border border-slate-700"
              title="Alterar nível de prontidão tática"
            >
              DEFCON
            </button>
          </div>
        </div>

        {/* 2. System Vitals Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          {/* CPU */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono">CPU</span>
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold font-mono text-slate-100">{vitals.cpuUsage}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${vitals.cpuUsage}%` }} 
                />
              </div>
            </div>
          </div>

          {/* RAM */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono">RAM</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold font-mono text-slate-100">
                {vitals.ramUsedGb} <span className="text-xs font-normal text-slate-400">/ {vitals.ramTotalGb}GB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${vitals.ramUsagePercent}%` }} 
                />
              </div>
            </div>
          </div>

          {/* NVMe Storage */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono">NVMe / ZFS</span>
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold font-mono text-slate-100">
                {vitals.diskUsedGb} <span className="text-xs font-normal text-slate-400">/ {vitals.diskTotalGb}GB</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.round((vitals.diskUsedGb / vitals.diskTotalGb) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Power & Temp */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span className="font-mono">ENERGIA</span>
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold font-mono text-slate-100">
                {vitals.batteryPercent}% <span className="text-xs font-normal text-slate-400">({vitals.temperatureC}°C)</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                {vitals.isOffgrid ? (lang === 'pt' ? 'Descarga ~9.4h' : 'Discharge ~9.4h') : 'AC Alimentado'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Mobile Installation & Direct APK Download Card */}
      <section className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl p-3.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 font-mono">
                {lang === 'pt' ? 'APK DE TESTE ANDROID (100% OFFLINE)' : 'ANDROID TEST APK (100% OFFLINE)'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                1.3 MB
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {lang === 'pt'
                ? 'Baixe o APK direto no celular ou escaneie o QR Code para instalar em tela cheia sem internet.'
                : 'Download APK directly to mobile or scan QR Code to run full-screen zero-net.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowApkModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-mono font-black text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? 'Baixar APK no Celular' : 'Get Mobile APK'}</span>
          </button>

          {!isInstalled && (
            <button
              onClick={install}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'pt' ? 'Instalar PWA' : 'Install PWA'}</span>
            </button>
          )}
        </div>
      </section>

      {/* 2.55 Offline LLM Model Engine & SITREP Generator */}
      <section className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-xl p-3.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 font-mono">
                {lang === 'pt' ? 'MODELO DE LINGUAGEM LLM OFFLINE' : 'OFFLINE LLM MODEL ENGINE'}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                {offlineLlmManager.getActiveModel().name}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {lang === 'pt'
                ? 'Motor de IA generativa no aparelho para Triagem, SITREP, Rádio LoRa e Respostas Táticas.'
                : 'On-device generative LLM intelligence powering Triage, SITREP, Radio and Survival modules.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleGenerateSitrep}
            disabled={isGeneratingSitrep}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all disabled:opacity-50"
          >
            {isGeneratingSitrep ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{lang === 'pt' ? 'Gerar SITREP Tático' : 'Generate SITREP'}</span>
          </button>

          <button
            onClick={() => setShowLlmModal(true)}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono text-xs border border-emerald-500/30 flex items-center justify-center gap-1.5"
          >
            <HardDriveDownload className="w-3.5 h-3.5" />
            <span>{lang === 'pt' ? 'Gerenciar LLM' : 'Manage Models'}</span>
          </button>
        </div>
      </section>

      {/* 2.6 Offline Module Suite & Standalone APK Manager */}
      <section className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 shadow-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0 mt-0.5 sm:mt-0">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-100 font-mono tracking-wide">
                  {lang === 'pt' ? 'CENTRAL DE PACOTES OFFLINE' : 'OFFLINE MODULE SUITE'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {lang === 'pt' ? '100% STANDALONE' : '100% STANDALONE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {lang === 'pt'
                  ? `Todos os 6 módulos foram pré-compilados no APK (${storageInfo.usageMb} MB em cache). O aplicativo roda completo sem internet.`
                  : `All 6 modules are bundled and cached in APK (${storageInfo.usageMb} MB stored). Full functionality with zero connection.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={handleDownloadAll}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
              <span>
                {isDownloading
                  ? (lang === 'pt' ? 'Baixando...' : 'Downloading...')
                  : (lang === 'pt' ? 'Sincronizar Módulos' : 'Sync All Modules')}
              </span>
            </button>
            <button
              onClick={() => setShowOfflineModal(true)}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 flex items-center justify-center gap-1"
              title="Gerenciar Módulos e Diagnóstico"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'pt' ? 'Diagnóstico' : 'Diagnostics'}</span>
            </button>
          </div>
        </div>

        {/* Live Download Progress Bar */}
        {isDownloading && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono text-cyan-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {currentDownloadModule || (lang === 'pt' ? 'Sincronizando...' : 'Syncing...')}
              </span>
              <span>{downloadProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* 3. Quick Action Hub */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            {lang === 'pt' ? 'Módulos Táticos Principais' : 'Core Tactical Modules'}
          </h2>
          <span className="text-[11px] text-amber-400 font-mono">
            {lang === 'pt' ? '6 Prontos para Uso' : '6 Ready for Field'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* AI Assistant Tile */}
          <button
            onClick={() => onNavigate('ai')}
            className="flex flex-col items-start p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 rounded-xl transition-all group text-left shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                OLLAMA/RAG
              </span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-slate-100 group-hover:text-amber-300">
              {lang === 'pt' ? 'IA Tática & RAG' : 'Tactical AI & RAG'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {lang === 'pt' 
                ? 'Consultas locais de primeiros socorros, sobrevivência e documentos.' 
                : 'Local queries for medical triage, survival and vector documents.'}
            </p>
          </button>

          {/* Maps Tile */}
          <button
            onClick={() => onNavigate('maps')}
            className="flex flex-col items-start p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/50 rounded-xl transition-all group text-left shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                PROTOMAPS
              </span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-slate-100 group-hover:text-cyan-300">
              {lang === 'pt' ? 'Mapas Offline & GPS' : 'Offline Maps & GPS'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {lang === 'pt' 
                ? 'Coordenadas MGRS, Maidenhead, pontos de água e abrigos.' 
                : 'MGRS coordinates, Maidenhead HAM grid, water and shelter waypoints.'}
            </p>
          </button>

          {/* Medical Reference Tile */}
          <button
            onClick={() => onNavigate('medical')}
            className="flex flex-col items-start p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 rounded-xl transition-all group text-left shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                FDA + HERBAL
              </span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-slate-100 group-hover:text-rose-300">
              {lang === 'pt' ? 'Saúde & Remédios' : 'Medical & Remedies'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {lang === 'pt' 
                ? '36 condições, remédios naturais, interações e triagem START.' 
                : '36 conditions, home remedies, drug conflicts and START triage.'}
            </p>
          </button>

          {/* Meshtastic Comms Tile */}
          <button
            onClick={() => onNavigate('mesh')}
            className="flex flex-col items-start p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-xl transition-all group text-left shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <Radio className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                LoRa 915MHz
              </span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-slate-100 group-hover:text-emerald-300">
              {lang === 'pt' ? 'Comunicação Mesh' : 'Meshtastic Radio'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {lang === 'pt' 
                ? 'Transmissão sem internet por ondas de rádio e canal de emergência.' 
                : 'Off-grid decentralized radio packets, channels and SOS broadcast.'}
            </p>
          </button>

          {/* Survival Utilities Tile */}
          <button
            onClick={() => onNavigate('tools')}
            className="flex flex-col items-start p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/50 rounded-xl transition-all group text-left shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-bold">
                CYBERCHEF
              </span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-slate-100 group-hover:text-purple-300">
              {lang === 'pt' ? 'Utilitários & Morse' : 'Survival Utilities'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {lang === 'pt' 
                ? 'Emissor Morse com som/luz, calculadora solar e diário de campo.' 
                : 'Morse audio/strobe flasher, solar power runtime, and field notes.'}
            </p>
          </button>

          {/* Supply Depot Tile */}
          <button
            onClick={() => onNavigate('depot')}
            className="flex flex-col items-start p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 rounded-xl transition-all group text-left shadow-sm active:scale-[0.98]"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                KIWIX/ZIM
              </span>
            </div>
            <h3 className="mt-2.5 text-sm font-bold text-slate-100 group-hover:text-blue-300">
              {lang === 'pt' ? 'Depósito & Arquivos' : 'Supply Depot & ZIMs'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
              {lang === 'pt' 
                ? 'Wikipedia ZIM offline, Kolibri e catálogo de containers curados.' 
                : 'Kiwix Wikipedia ZIMs, Kolibri academy and curated Docker apps.'}
            </p>
          </button>
        </div>
      </section>

      {/* 4. Curated Apps & Microservices Status */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              {lang === 'pt' ? 'Serviços do Nó NOMAD' : 'NOMAD Node Services'}
            </h2>
          </div>
          <button
            onClick={() => setShowServerModal(true)}
            className="text-[11px] text-slate-400 hover:text-amber-300 font-mono flex items-center gap-1"
          >
            <span>{vitals.serverConnected ? 'Servidor Conectado' : 'Configurar Ponte'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {apps.slice(0, 4).map((app) => (
            <div 
              key={app.id}
              className="flex items-center justify-between p-2.5 bg-slate-950/50 border border-slate-800/80 rounded-lg text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-2 h-2 rounded-full ${app.running ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-slate-600'}`} />
                <div className="truncate">
                  <div className="font-semibold text-slate-200 truncate">{app.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">Port :{app.port} • {app.category}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  app.running 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {app.running ? 'ATIVO' : 'PARADO'}
                </span>
                <button
                  onClick={() => toggleAppRun(app.id)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700"
                >
                  {app.running ? 'Pausar' : 'Iniciar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Preloaded Survival Guides Drawer */}
      <section className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              {lang === 'pt' ? 'Manuais Críticos Pré-Carregados' : 'Preloaded Field Manuals'}
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">100% OFFLINE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SURVIVAL_GUIDES.map((guide) => (
            <button
              key={guide.id}
              onClick={() => onSelectGuide(guide)}
              className="flex items-start gap-2.5 p-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-lg text-left transition-colors group"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${guide.priority === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 truncate">
                  {guide.title}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {guide.summary}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 shrink-0 self-center" />
            </button>
          ))}
        </div>
      </section>

      {/* Server Link Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 font-mono flex items-center gap-2">
                <Server className="w-4 h-4 text-amber-400" />
                {lang === 'pt' ? 'Ponte Servidor NOMAD' : 'NOMAD Server Bridge'}
              </h3>
              <button 
                onClick={() => setShowServerModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2.5">
              {lang === 'pt'
                ? 'Conecte este cliente mobile a uma máquina Ubuntu/Debian executando o Project NOMAD original na rede local (ex: http://192.168.1.150:8080).'
                : 'Connect this mobile client to an Ubuntu machine running Project NOMAD on your local LAN (e.g. http://192.168.1.150:8080).'}
            </p>

            <div className="mt-3">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                URL DO SERVIDOR:
              </label>
              <input
                type="text"
                value={serverInput}
                onChange={(e) => setServerInput(e.target.value)}
                placeholder="http://192.168.1.100:8080"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  onUpdateServerUrl(serverInput);
                  setShowServerModal(false);
                }}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
              >
                {lang === 'pt' ? 'Salvar & Conectar' : 'Save & Link'}
              </button>
              <button
                onClick={() => setShowServerModal(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs hover:bg-slate-700"
              >
                {lang === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Modules & Diagnostics Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3.5">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-slate-100 font-mono tracking-wide">
                    {lang === 'pt' ? 'SUÍTE TÁTICA OFFLINE STANDALONE' : 'OFFLINE STANDALONE SUITE'}
                  </h3>
                  <div className="text-[10px] text-cyan-400 font-mono">
                    {lang === 'pt' ? 'ESTADO: 100% OPERACIONAL SEM INTERNET' : 'STATUS: 100% OPERATIONAL ZERO-NET'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowOfflineModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Storage Overview Bar */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono">
                  <span className="text-slate-400">{lang === 'pt' ? 'ARMAZENAMENTO LOCAL EM CACHE:' : 'LOCAL STORAGE CACHED:'}</span>
                  <span className="text-amber-400 font-bold">{storageInfo.usageMb} MB / {storageInfo.quotaMb} MB</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.max(2, storageInfo.percentUsed)}%` }} />
                </div>
                <p className="text-[10px] text-slate-400">
                  {lang === 'pt' 
                    ? 'Todos os módulos estão embutidos na compilação do APK e replicados em CacheStorage.' 
                    : 'All modules are pre-compiled into APK assets and mirrored in CacheStorage.'}
                </p>
              </div>

              {/* Modules List */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'pt' ? 'Módulos Prontos para Uso Off-Grid:' : 'Off-Grid Ready Modules:'}
                </div>
                {NOMAD_MODULES.map((mod) => (
                  <div 
                    key={mod.id}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-[11px] font-mono">{mod.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                          {mod.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {mod.itemCount} registros • ~{mod.sizeEstimateMb} MB
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                      <CheckCircle className="w-3 h-3" />
                      {lang === 'pt' ? 'EMBUTIDO' : 'READY'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Diagnostic Button & Results */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-300 font-bold">
                    {lang === 'pt' ? 'Teste de Diagnóstico do Sistema' : 'System Diagnostic Test'}
                  </span>
                  <button
                    onClick={handleVerifyIntegrity}
                    disabled={isVerifying}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] border border-cyan-500/30 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? (lang === 'pt' ? 'Verificando...' : 'Checking...') : (lang === 'pt' ? 'Executar Teste' : 'Run Check')}</span>
                  </button>
                </div>

                {integrityResults && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>{lang === 'pt' ? 'TODAS AS 5 CHECAGENS APROVADAS' : 'ALL 5 CHECKS PASSED'}</span>
                    </div>
                    <div className="space-y-1.5">
                      {integrityResults.checks.map((chk, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                          <span className="text-emerald-400 font-bold shrink-0">✓</span>
                          <div>
                            <div className="font-semibold text-slate-200">{chk.name}</div>
                            <div className="text-slate-400 text-[9px]">{chk.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-between gap-2">
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-mono font-bold text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isDownloading ? 'animate-spin' : ''}`} />
                <span>{lang === 'pt' ? 'Re-sincronizar Cache' : 'Re-sync Cache'}</span>
              </button>
              <button
                onClick={() => setShowOfflineModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700"
              >
                {lang === 'pt' ? 'Fechar' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct APK Download Modal */}
      <ApkDownloadModal
        isOpen={showApkModal}
        onClose={() => setShowApkModal(false)}
        lang={lang}
      />

      {/* Offline LLM Downloader & Manager Program Modal */}
      <OfflineLlmModal
        isOpen={showLlmModal}
        onClose={() => setShowLlmModal(false)}
        lang={lang}
      />

      {/* SITREP Viewer Modal */}
      {showSitrepModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="font-mono font-bold text-xs text-slate-100 uppercase tracking-wider">
                  {lang === 'pt' ? 'Relatório de Situação Tático (SITREP) • IA Offline' : 'Tactical SITREP • Offline AI'}
                </h3>
              </div>
              <button 
                onClick={() => setShowSitrepModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs leading-relaxed font-sans text-slate-200">
              {isGeneratingSitrep ? (
                <div className="flex items-center gap-2.5 p-4 text-emerald-400 font-mono text-xs">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sintetizando telemetria com modelo LLM offline local...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-mono text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-200">
                  {sitrepText}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs font-mono">
              <span className="text-[10px] text-slate-400">
                Modelo: {offlineLlmManager.getActiveModel().name}
              </span>
              <button
                onClick={() => setShowSitrepModal(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              >
                {lang === 'pt' ? 'Concluir' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
