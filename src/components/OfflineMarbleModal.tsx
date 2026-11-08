/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Download, 
  CheckCircle2, 
  Trash2, 
  HardDrive, 
  Layers, 
  X, 
  Loader2, 
  ShieldCheck, 
  Compass,
  ExternalLink,
  MapPin
} from 'lucide-react';
import { 
  offlineMarbleGlobeManager, 
  AVAILABLE_MARBLE_PACKAGES, 
  MarbleGlobePackage, 
  GlobeDownloadProgress 
} from '../utils/offlineMarbleGlobeManager';
import { getStorageEstimate } from '../utils/offlineSyncManager';
import { Language } from '../types';

interface OfflineMarbleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const OfflineMarbleModal: React.FC<OfflineMarbleModalProps> = ({ isOpen, onClose, lang }) => {
  const [activePkg, setActivePkg] = useState<MarbleGlobePackage>(offlineMarbleGlobeManager.getActivePackage());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, GlobeDownloadProgress>>({});
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});
  const [storageInfo, setStorageInfo] = useState<{ usageMb: number; quotaMb: number; percentUsed: number }>({
    usageMb: 24,
    quotaMb: 4096,
    percentUsed: 1
  });

  useEffect(() => {
    refreshStatus();
  }, [isOpen]);

  const refreshStatus = async () => {
    const statusMap: Record<string, boolean> = {};
    for (const p of AVAILABLE_MARBLE_PACKAGES) {
      statusMap[p.id] = offlineMarbleGlobeManager.isPackageDownloaded(p.id);
    }
    setDownloadedMap(statusMap);
    setActivePkg(offlineMarbleGlobeManager.getActivePackage());
    const est = await getStorageEstimate();
    setStorageInfo(est);
  };

  const handleStartDownload = async (pkg: MarbleGlobePackage) => {
    setDownloadProgress(prev => ({
      ...prev,
      [pkg.id]: {
        packageId: pkg.id,
        bytesDownloaded: 0,
        totalBytes: pkg.sizeMb * 1024 * 1024,
        percentage: 0,
        speedMbps: 0,
        status: 'downloading'
      }
    }));

    const ok = await offlineMarbleGlobeManager.downloadPackage(pkg.id, (prog) => {
      setDownloadProgress(prev => ({
        ...prev,
        [pkg.id]: prog
      }));
    });

    if (ok) {
      await refreshStatus();
    }
  };

  const handleDeletePackage = async (packageId: string) => {
    await offlineMarbleGlobeManager.deletePackage(packageId);
    await refreshStatus();
  };

  const handleSelectActive = (pkg: MarbleGlobePackage) => {
    offlineMarbleGlobeManager.setActivePackage(pkg.id);
    setActivePkg(pkg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Globe className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
                {lang === 'pt' ? 'GLOBO MARBLE 3D OFFLINE (OPEN-SOURCE)' : 'MARBLE 3D OFFLINE VIRTUAL GLOBE'}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  KDE / MARBLE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {lang === 'pt'
                  ? 'Camadas esféricas de relevo global, batimetria e grade militar para navegação sem internet'
                  : 'Spherical global relief, bathymetry and military grid for zero-net tactical operations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Diagnostics & Storage */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Armazenamento:</span>
            <span className="text-slate-200 font-bold">{storageInfo.usageMb} MB / {storageInfo.quotaMb} MB</span>
            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
              <div 
                className="h-full bg-cyan-500 rounded-full" 
                style={{ width: `${Math.max(2, storageInfo.percentUsed)}%` }} 
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-[11px]">Three.js WebGL 3D Ativo</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase">
                {lang === 'pt' ? 'Pacotes do Globo Marble' : 'Marble Globe Packages'}
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Ativo: <strong className="text-cyan-400">{activePkg.name}</strong>
              </span>
            </div>

            {AVAILABLE_MARBLE_PACKAGES.map((pkg) => {
              const isDownloaded = downloadedMap[pkg.id] ?? false;
              const isActive = activePkg.id === pkg.id;
              const prog = downloadProgress[pkg.id];
              const isDownloading = prog && prog.status === 'downloading';

              return (
                <div
                  key={pkg.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-cyan-950/20 border-cyan-500/60 shadow-lg'
                      : isDownloaded
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-100">{pkg.name}</span>
                        {pkg.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                            Nativo Embutido
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                            Em Uso no Globo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>Tamanho: <strong className="text-slate-300">{pkg.sizeMb > 0 ? `${pkg.sizeMb} MB` : 'Embutido no APK'}</strong></span>
                        <span>Resolução: <strong className="text-slate-300">{pkg.resolution}</strong></span>
                        <span>Versão: <strong className="text-slate-300">{pkg.version}</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {isDownloaded ? (
                        <>
                          <button
                            onClick={() => handleSelectActive(pkg)}
                            disabled={isActive}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isActive ? 'Selecionado' : 'Carregar no Globo'}
                          </button>
                          {pkg.id !== 'marble-tactical-embedded' && (
                            <button
                              onClick={() => handleDeletePackage(pkg.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Remover pacote"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartDownload(pkg)}
                          disabled={isDownloading}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-60"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{prog?.percentage || 0}%</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar ({pkg.sizeMb} MB)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress bar if downloading */}
                  {isDownloading && (
                    <div className="mt-2.5 p-2 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span className="text-cyan-400 font-bold">Transferindo texturas Marble e batimetria...</span>
                        <span>{Math.round((prog?.bytesDownloaded || 0) / (1024 * 1024))} MB / {pkg.sizeMb} MB ({prog?.speedMbps || 0} MB/s)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-150" 
                          style={{ width: `${prog?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {pkg.features.map((feat, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* About Marble Open-Source Card */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs font-mono text-slate-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
              <Compass className="w-4 h-4" />
              <span>Sobre o Projeto Marble & NASA Blue Marble:</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
              O <strong>Marble</strong> é o atlas e globo virtual de código aberto desenvolvido sob licença livre (LGPL), amplamente utilizado por agências espaciais e operações de resgate. Os dados fotogramétricos combinam topografia SRTM e imagens NASA Blue Marble, compactados para renderização sem conexão à internet.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-500 text-[11px]">
            Pacote Ativo: <strong className="text-slate-300">{activePkg.name}</strong>
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors"
          >
            {lang === 'pt' ? 'Fechar' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
