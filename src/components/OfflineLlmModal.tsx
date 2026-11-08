/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Download, 
  CheckCircle2, 
  Trash2, 
  HardDrive, 
  Sparkles, 
  Zap, 
  X, 
  Play, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  offlineLlmManager, 
  AVAILABLE_OFFLINE_MODELS, 
  OfflineLlmModel, 
  LlmDownloadProgress 
} from '../utils/offlineLlmManager';
import { getStorageEstimate } from '../utils/offlineSyncManager';
import { Language } from '../types';

interface OfflineLlmModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const OfflineLlmModal: React.FC<OfflineLlmModalProps> = ({ isOpen, onClose, lang }) => {
  const [activeModel, setActiveModel] = useState<OfflineLlmModel>(offlineLlmManager.getActiveModel());
  const [downloadProgress, setDownloadProgress] = useState<Record<string, LlmDownloadProgress>>({});
  const [downloadedMap, setDownloadedMap] = useState<Record<string, boolean>>({});
  const [storageInfo, setStorageInfo] = useState<{ usageMb: number; quotaMb: number; percentUsed: number }>({
    usageMb: 24,
    quotaMb: 4096,
    percentUsed: 1
  });

  // Test arena state
  const [testPrompt, setTestPrompt] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isInferencing, setIsInferencing] = useState(false);
  const [inferenceTime, setInferenceTime] = useState<number | null>(null);

  useEffect(() => {
    refreshStatus();
  }, [isOpen]);

  const refreshStatus = async () => {
    const statusMap: Record<string, boolean> = {};
    for (const m of AVAILABLE_OFFLINE_MODELS) {
      statusMap[m.id] = offlineLlmManager.isModelDownloaded(m.id);
    }
    setDownloadedMap(statusMap);
    setActiveModel(offlineLlmManager.getActiveModel());
    const est = await getStorageEstimate();
    setStorageInfo(est);
  };

  const handleStartDownload = async (model: OfflineLlmModel) => {
    setDownloadProgress(prev => ({
      ...prev,
      [model.id]: {
        modelId: model.id,
        bytesDownloaded: 0,
        totalBytes: model.sizeMb * 1024 * 1024,
        percentage: 0,
        speedMbps: 0,
        status: 'downloading'
      }
    }));

    const ok = await offlineLlmManager.downloadModel(model.id, (prog) => {
      setDownloadProgress(prev => ({
        ...prev,
        [model.id]: prog
      }));
    });

    if (ok) {
      await refreshStatus();
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    await offlineLlmManager.deleteModel(modelId);
    await refreshStatus();
  };

  const handleSelectActive = (model: OfflineLlmModel) => {
    offlineLlmManager.setActiveModel(model.id);
    setActiveModel(model);
  };

  const handleRunTest = async () => {
    if (!testPrompt.trim() || isInferencing) return;
    setIsInferencing(true);
    setTestResponse('');
    setInferenceTime(null);

    const res = await offlineLlmManager.generateResponse({
      prompt: testPrompt,
      module: 'assistant',
      lang,
      onToken: (_tok, acc) => {
        setTestResponse(acc);
      }
    });

    setIsInferencing(false);
    setInferenceTime(res.inferenceTimeMs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-mono tracking-wide flex items-center gap-2">
                {lang === 'pt' ? 'PROGRAMA GERENCIADOR DE LLM OFFLINE' : 'NOMAD OFFLINE LLM MANAGER'}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  ON-DEVICE
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {lang === 'pt' 
                  ? 'Modelos neurais compactados para rodar 100% no celular sem internet' 
                  : 'Quantized neural models running 100% on-device with zero internet'}
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

        {/* Storage & Engine Diagnostics Banner */}
        <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Armazenamento:</span>
            <span className="text-slate-200 font-bold">{storageInfo.usageMb} MB / {storageInfo.quotaMb} MB</span>
            <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
              <div 
                className="h-full bg-amber-500 rounded-full" 
                style={{ width: `${Math.max(2, storageInfo.percentUsed)}%` }} 
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-400 text-[11px]">WebGPU / WASM SIMD Pronto</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-4">
          
          {/* Models List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 font-mono tracking-wider uppercase">
                {lang === 'pt' ? 'Modelos Disponíveis para o APK' : 'Available Models for APK'}
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                Ativo: <strong className="text-amber-400">{activeModel.name}</strong>
              </span>
            </div>

            {AVAILABLE_OFFLINE_MODELS.map((model) => {
              const isDownloaded = downloadedMap[model.id] ?? false;
              const isActive = activeModel.id === model.id;
              const prog = downloadProgress[model.id];
              const isDownloading = prog && prog.status === 'downloading';

              return (
                <div
                  key={model.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-amber-950/20 border-amber-500/60 shadow-lg'
                      : isDownloaded
                      ? 'bg-slate-900/90 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-100">{model.name}</span>
                        {model.isRecommended && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                            Recomendado
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                            Ativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span>Tam: <strong className="text-slate-300">{model.sizeMb > 0 ? `${model.sizeMb} MB` : 'Embutido'}</strong></span>
                        <span>Quant: <strong className="text-slate-300">{model.quantization}</strong></span>
                        <span>Parâmetros: <strong className="text-slate-300">{model.parameters}</strong></span>
                        <span>RAM mín: <strong className="text-slate-300">{model.minRamGb} GB</strong></span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      {isDownloaded ? (
                        <>
                          <button
                            onClick={() => handleSelectActive(model)}
                            disabled={isActive}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                              isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isActive ? 'Selecionado' : 'Usar no APK'}
                          </button>
                          {model.id !== 'nomad-embedded-rules' && (
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Remover do celular"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartDownload(model)}
                          disabled={isDownloading}
                          className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-60"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>{prog?.percentage || 0}%</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Baixar Modelo ({model.sizeMb} MB)</span>
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
                        <span className="text-amber-400 font-bold">Baixando pesos neurais...</span>
                        <span>{Math.round((prog?.bytesDownloaded || 0) / (1024 * 1024))} MB / {model.sizeMb} MB ({prog?.speedMbps || 0} MB/s)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-150" 
                          style={{ width: `${prog?.percentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {model.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {model.capabilities.map((cap, idx) => (
                      <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Test Arena: Try out the offline LLM */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'pt' ? 'Testar Resposta do Modelo no Dispositivo' : 'Test Model On-Device'}
              </span>
              {inferenceTime !== null && (
                <span className="text-[10px] font-mono text-emerald-400">
                  Tempo: {inferenceTime}ms • 100% Offline
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Ex: Como fazer torniquete improvisado ou canal LoRa..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-sans"
              />
              <button
                onClick={handleRunTest}
                disabled={!testPrompt.trim() || isInferencing}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5"
              >
                {isInferencing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Testar</span>
              </button>
            </div>

            {testResponse && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {testResponse}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Integrado em: IA Tática, Triagem START, SITREP e Rádio LoRa</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors"
          >
            {lang === 'pt' ? 'Fechar Gerenciador' : 'Close Manager'}
          </button>
        </div>

      </div>
    </div>
  );
};
