import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  QrCode, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  ExternalLink,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { generateQrSvgUri } from '../utils/qrCode';
import { Language } from '../types';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({
  isOpen,
  onClose,
  lang
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'DOWNLOAD' | 'GUIDE'>('DOWNLOAD');

  if (!isOpen) return null;

  // Resolve absolute URL for mobile QR scanning
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://projectnomad.app';
  const downloadUrl = `${origin}/download/ProjectNOMAD-Mobile.apk`;
  const qrUri = generateQrSvgUri(downloadUrl);

  const copyUrl = () => {
    navigator.clipboard?.writeText(downloadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3.5 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs text-slate-100 font-mono tracking-wide">
                  {lang === 'pt' ? 'DOWNLOAD DIRETO DO APK ANDROID' : 'DIRECT ANDROID APK DOWNLOAD'}
                </h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                  OFFLINE 100%
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                ProjectNOMAD-Mobile.apk • v1.35.1 • 1.3 MB
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-mono p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('DOWNLOAD')}
            className={`pb-2 px-2 border-b-2 font-bold transition-all ${
              activeTab === 'DOWNLOAD'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'pt' ? 'Download & QR Code' : 'Download & QR'}
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`pb-2 px-2 border-b-2 font-bold transition-all ${
              activeTab === 'GUIDE'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'pt' ? 'Guia de Instalação' : 'Install Guide'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans">
          
          {activeTab === 'DOWNLOAD' ? (
            <>
              {/* Primary Download Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center text-center space-y-3">
                
                {/* QR Code for direct mobile scan */}
                <div className="p-2.5 bg-[#090d16] border border-amber-500/40 rounded-xl shadow-inner flex flex-col items-center">
                  <img 
                    src={qrUri} 
                    alt="QR Code para download do APK" 
                    className="w-44 h-44 rounded-lg object-contain bg-[#090d16]"
                    loading="eager"
                  />
                  <div className="text-[10px] text-amber-400/90 font-mono mt-1 flex items-center gap-1">
                    <QrCode className="w-3 h-3" />
                    <span>{lang === 'pt' ? 'Aponte a câmera do celular' : 'Scan with mobile camera'}</span>
                  </div>
                </div>

                <div className="w-full space-y-1.5">
                  <a
                    href="/download/ProjectNOMAD-Mobile.apk"
                    download="ProjectNOMAD-Mobile.apk"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-mono font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>{lang === 'pt' ? 'BAIXAR APK NO CELULAR (1.3 MB)' : 'DOWNLOAD APK (1.3 MB)'}</span>
                  </a>

                  <p className="text-[10px] text-slate-400 font-mono">
                    {lang === 'pt'
                      ? 'Compatível com Android 7.0 até Android 15.0 (ARM & x86_64)'
                      : 'Compatible with Android 7.0 through Android 15.0'}
                  </p>
                </div>
              </div>

              {/* Direct Link Copy Box */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  {lang === 'pt' ? 'Link direto para compartilhar / WhatsApp / Telegram:' : 'Direct link to share:'}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={downloadUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-200 select-all"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 flex items-center gap-1 shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? (lang === 'pt' ? 'Copiado!' : 'Copied!') : (lang === 'pt' ? 'Copiar' : 'Copy')}</span>
                  </button>
                </div>
              </div>

              {/* Security & Offline Guarantee */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'pt' ? 'ASSINADO & PRÉ-CONFIGURADO' : 'SIGNED & CONFIGURED'}</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                  {lang === 'pt' 
                    ? 'O APK contém os 6 módulos embutidos na pasta de assets locais. Funciona em Modo Avião sem conexão de dados.'
                    : 'The APK includes all 6 modules packaged in local assets. Works in Airplane Mode zero-data.'}
                </p>
              </div>
            </>
          ) : (
            /* Installation Guide Tab */
            <div className="space-y-3 font-sans">
              <div className="text-[11px] font-mono font-bold text-slate-200">
                {lang === 'pt' ? 'COMO INSTALAR NO CELULAR ANDROID:' : 'HOW TO INSTALL ON ANDROID:'}
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    1
                  </span>
                  <div className="text-slate-300">
                    <strong className="text-slate-100">{lang === 'pt' ? 'Baixe o Arquivo' : 'Download the File'}</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'pt' 
                        ? 'Toque no botão "BAIXAR APK" no navegador do celular ou aponte a câmera para o QR Code.' 
                        : 'Tap Download APK on your mobile browser or point your camera to the QR Code.'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    2
                  </span>
                  <div className="text-slate-300">
                    <strong className="text-slate-100">{lang === 'pt' ? 'Confirme o Aviso de Segurança' : 'Confirm Security Prompt'}</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'pt' 
                        ? 'O Android exibirá "O arquivo pode ser nocivo". Toque em "Fazer o download mesmo assim" (aviso padrão do Google para APKs instalados fora da Play Store).' 
                        : 'Android will show "File might be harmful". Tap "Download anyway".'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    3
                  </span>
                  <div className="text-slate-300">
                    <strong className="text-slate-100">{lang === 'pt' ? 'Toque em Instalar' : 'Tap Install'}</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'pt' 
                        ? 'Ao concluir o download, abra o arquivo e confirme a instalação. Se solicitado, permita a instalação a partir do navegador.' 
                        : 'Open the downloaded file and confirm installation.'}
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    4
                  </span>
                  <div className="text-slate-300">
                    <strong className="text-slate-100">{lang === 'pt' ? 'Pronto para Uso Off-Grid' : 'Ready for Off-Grid Use'}</strong>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {lang === 'pt' 
                        ? 'O Project NOMAD Mobile aparecerá com o ícone tático na tela inicial, rodando em tela cheia sem barras de navegação.' 
                        : 'Project NOMAD Mobile will launch in full screen with zero network bars.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>SHA-256 Verificado</span>
          </div>

          <div className="flex gap-2">
            <a
              href="/download/ProjectNOMAD-Mobile.apk"
              download="ProjectNOMAD-Mobile.apk"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{lang === 'pt' ? 'Baixar Arquivo' : 'Download File'}</span>
            </a>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700"
            >
              {lang === 'pt' ? 'Fechar' : 'Close'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
