import React, { useState } from 'react';
import { 
  Cross, 
  Search, 
  Leaf, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  Info, 
  Plus, 
  X, 
  CheckCircle2, 
  ChevronRight,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { 
  CONDITIONS_DATA, 
  NATURAL_REMEDIES_DATA, 
  HOME_REMEDIES_DATA, 
  NomadCondition, 
  NomadNaturalRemedy, 
  NomadHomeRemedy 
} from '../data/nomadData';
import { findDrugInteractions, evaluateSTARTTriage, TriageEvaluation } from '../utils/survivalLogic';
import { Language } from '../types';

interface MedicalReferenceProps {
  lang: Language;
}

export const MedicalReference: React.FC<MedicalReferenceProps> = ({ lang }) => {
  const [subTab, setSubTab] = useState<'CONDITIONS' | 'REMEDIES' | 'INTERACTIONS' | 'TRIAGE'>('CONDITIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<NomadCondition | null>(null);
  
  // Drug Interaction checker states
  const [selectedMeds, setSelectedMeds] = useState<string[]>(['Aspirina', 'Varfarina']);
  const [customMedInput, setCustomMedInput] = useState('');

  // Triage state
  const [canWalk, setCanWalk] = useState(false);
  const [breathingRate, setBreathingRate] = useState<number>(24);
  const [radialPulsePresent, setRadialPulsePresent] = useState(true);
  const [capillaryRefillSec, setCapillaryRefillSec] = useState<number>(1.5);
  const [obeysCommands, setObeysCommands] = useState(true);
  const [airwayRepositionBreathing, setAirwayRepositionBreathing] = useState(false);

  // Common quick add meds
  const commonMeds = ['Aspirina', 'Varfarina', 'Ibuprofeno', 'Enalapril', 'Paracetamol', 'Álcool', 'Metronidazol', 'Ciprofloxacino', 'Antiácido', 'Tramadol', 'Fluoxetina'];

  // Filter conditions
  const filteredConditions = CONDITIONS_DATA.filter(c => {
    const q = searchQuery.toLowerCase();
    return c.label.toLowerCase().includes(q) || 
           c.category.toLowerCase().includes(q) || 
           c.searchTerms.some(st => st.toLowerCase().includes(q));
  });

  // Filter natural remedies
  const filteredNaturalRemedies = NATURAL_REMEDIES_DATA.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || 
           r.uses.toLowerCase().includes(q) ||
           r.conditions.some(c => c.toLowerCase().includes(q));
  });

  // Filter home remedies
  const filteredHomeRemedies = HOME_REMEDIES_DATA.filter(r => {
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || 
           (r.how && r.how.toLowerCase().includes(q)) ||
           r.conditions.some(c => c.toLowerCase().includes(q));
  });

  // Evaluate triage
  const triageResult: TriageEvaluation = evaluateSTARTTriage({
    canWalk,
    breathingRate,
    airwayRepositionBreathing,
    radialPulsePresent,
    capillaryRefillSec,
    obeysCommands
  });

  // Drug conflicts
  const drugConflicts = findDrugInteractions(selectedMeds);

  return (
    <div className="space-y-3.5 pb-20 pt-2 px-3.5 max-w-4xl mx-auto">
      
      {/* 1. Header & Tabs */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-100 font-mono tracking-wide">
                {lang === 'pt' ? 'MÉDICO & REMÉDIOS OFFLINE' : 'OFFLINE MEDICAL & REMEDIES'}
              </h2>
              <div className="text-[10px] text-slate-400 font-mono">
                BASE FDA + NCCIH (36 CONDIÇÕES • REMÉDIOS NATURAIS)
              </div>
            </div>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-4 gap-1 text-[11px] font-mono">
          <button
            onClick={() => setSubTab('CONDITIONS')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              subTab === 'CONDITIONS'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Condições' : 'Conditions'}
          </button>
          <button
            onClick={() => setSubTab('REMEDIES')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              subTab === 'REMEDIES'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Remédios' : 'Remedies'}
          </button>
          <button
            onClick={() => setSubTab('INTERACTIONS')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              subTab === 'INTERACTIONS'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Interações' : 'Conflicts'}
          </button>
          <button
            onClick={() => setSubTab('TRIAGE')}
            className={`py-1.5 px-1 rounded-lg text-center font-bold transition-all ${
              subTab === 'TRIAGE'
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {lang === 'pt' ? 'Triagem' : 'Triage'}
          </button>
        </div>
      </div>

      {/* SEARCH BAR (For Conditions and Remedies) */}
      {(subTab === 'CONDITIONS' || subTab === 'REMEDIES') && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subTab === 'CONDITIONS'
                ? (lang === 'pt' ? 'Buscar sintoma ou condição (ex: dor, febre, tosse, queimadura)...' : 'Search condition or symptom (e.g. pain, fever, cough)...')
                : (lang === 'pt' ? 'Buscar remédio natural (ex: aloe vera, mel, gengibre)...' : 'Search remedy (e.g. aloe vera, honey, ginger)...')
            }
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      )}

      {/* --- SUBTAB 1: CONDITIONS LIST --- */}
      {subTab === 'CONDITIONS' && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-slate-400">
            {filteredConditions.length} {lang === 'pt' ? 'condições encontradas' : 'conditions found'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredConditions.map((cond) => (
              <div
                key={cond.slug}
                onClick={() => setSelectedCondition(cond)}
                className="p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 rounded-xl cursor-pointer transition-all flex items-start justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <Cross className="w-3.5 h-3.5 text-rose-400" />
                    {cond.label}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                    {cond.category}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {cond.searchTerms.slice(0, 3).map((term, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 self-center" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUBTAB 2: REMEDIES LIST --- */}
      {subTab === 'REMEDIES' && (
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase mb-2 flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" />
              {lang === 'pt' ? 'Remédios Naturais & Fitoterápicos' : 'Natural Herbal Remedies'}
            </h3>
            <div className="space-y-2">
              {filteredNaturalRemedies.map((rem) => (
                <div key={rem.slug} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm text-emerald-300">{rem.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      FITOTERÁPICO
                    </span>
                  </div>
                  {rem.commonNames && (
                    <div className="text-[11px] text-slate-400 italic">
                      {rem.commonNames.join(', ')}
                    </div>
                  )}
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-slate-100">Uso:</strong> {rem.uses}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    <strong className="text-slate-100">Aplicação:</strong> {rem.how}
                  </p>
                  {rem.cautions && (
                    <div className="p-2 rounded bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-300">
                      <strong>CUIDADOS:</strong> {rem.cautions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-amber-400 font-mono uppercase mb-2 flex items-center gap-1.5">
              <Cross className="w-3.5 h-3.5" />
              {lang === 'pt' ? 'Remédios Caseiros & Primeiros Socorros' : 'Home Preparations & First Aid'}
            </h3>
            <div className="space-y-2">
              {filteredHomeRemedies.map((rem) => (
                <div key={rem.slug} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm text-amber-300">{rem.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      CASEIRO
                    </span>
                  </div>
                  {rem.how && (
                    <p className="text-slate-300 text-xs leading-relaxed">
                      <strong className="text-slate-100">Como Preparar/Usar:</strong> {rem.how}
                    </p>
                  )}
                  {rem.evidence && (
                    <p className="text-slate-400 text-[11px]">
                      <strong className="text-slate-300">Evidência:</strong> {rem.evidence}
                    </p>
                  )}
                  {rem.cautions && (
                    <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-[11px] text-amber-300">
                      <strong>ATENÇÃO:</strong> {rem.cautions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB 3: DRUG INTERACTIONS --- */}
      {subTab === 'INTERACTIONS' && (
        <div className="space-y-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-xs space-y-2.5">
            <h3 className="font-bold text-slate-100 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              {lang === 'pt' ? 'Detector de Conflitos & Interações Medicamentosas' : 'Drug Conflict & Interaction Checker'}
            </h3>
            <p className="text-slate-400 text-xs">
              {lang === 'pt' 
                ? 'Selecione ou digite os medicamentos que o paciente está tomando para detectar reações cruzadas de alto risco.' 
                : 'Select or enter patient medications to identify critical contraindications.'}
            </p>

            {/* Selected Meds Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedMeds.map((med, idx) => (
                <span key={idx} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono">
                  {med}
                  <button 
                    onClick={() => setSelectedMeds(prev => prev.filter((_, i) => i !== idx))}
                    className="hover:text-rose-400 ml-0.5"
                    aria-label={`Remover ${med}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Quick add med selector */}
            <div className="pt-2">
              <span className="text-[10px] font-mono text-slate-500 block mb-1">ADICIONAR RAPIDAMENTE:</span>
              <div className="flex flex-wrap gap-1">
                {commonMeds.map((med) => (
                  <button
                    key={med}
                    onClick={() => {
                      if (!selectedMeds.includes(med)) {
                        setSelectedMeds(prev => [...prev, med]);
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-amber-300 text-[10px] font-mono"
                  >
                    + {med}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-400">
              {lang === 'pt' ? 'Relatório de Segurança' : 'Safety Report'} ({drugConflicts.length} alertas)
            </h4>

            {drugConflicts.length === 0 ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nenhuma interação grave conhecida detectada entre os medicamentos selecionados.</span>
              </div>
            ) : (
              drugConflicts.map((alert, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border text-xs space-y-1 ${
                    alert.severity === 'CRITICAL' 
                      ? 'bg-rose-950/40 border-rose-500/50 text-rose-200' 
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>{alert.drugA} + {alert.drugB}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed pt-1">
                    {alert.mechanism}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- SUBTAB 4: START TRIAGE CALCULATOR --- */}
      {subTab === 'TRIAGE' && (
        <div className="space-y-3">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 font-mono flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                {lang === 'pt' ? 'Calculadora de Triagem Tática START' : 'Tactical START Triage Calculator'}
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">ALGORITMO RPM</span>
            </div>

            {/* Step 1: Walking */}
            <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">1. Deambulação (Capacidade de andar)</div>
                  <div className="text-[10px] text-slate-400">A vítima consegue se levantar e caminhar até você?</div>
                </div>
                <button
                  onClick={() => setCanWalk(!canWalk)}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                    canWalk ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {canWalk ? 'SIM (Andando)' : 'NÃO'}
                </button>
              </div>
            </div>

            {/* Step 2: Respiration */}
            {!canWalk && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">2. Respiração (Frequência por minuto)</div>
                    <div className="text-[10px] text-slate-400">Normal: 12-20 rpm • Alarme: &gt;30 ou 0</div>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-400">{breathingRate} rpm</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="45"
                  value={breathingRate}
                  onChange={(e) => setBreathingRate(parseInt(e.target.value))}
                  className="w-full accent-amber-500"
                />

                {breathingRate === 0 && (
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-300">Voltou a respirar após abrir via aérea?</span>
                    <button
                      onClick={() => setAirwayRepositionBreathing(!airwayRepositionBreathing)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        airwayRepositionBreathing ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {airwayRepositionBreathing ? 'SIM' : 'NÃO'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Perfusion */}
            {!canWalk && breathingRate > 0 && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">3. Perfusão & Pulso Radial</div>
                    <div className="text-[10px] text-slate-400">Pulso no punho e tempo de enchimento capilar</div>
                  </div>
                  <button
                    onClick={() => setRadialPulsePresent(!radialPulsePresent)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                      radialPulsePresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {radialPulsePresent ? 'Pulso Presente' : 'Pulso Ausente'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">Enchimento capilar (segundos):</span>
                  <div className="flex gap-1 font-mono">
                    {[1, 2, 3, 4].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => setCapillaryRefillSec(sec)}
                        className={`px-2 py-0.5 rounded ${
                          capillaryRefillSec === sec 
                            ? 'bg-amber-500 text-black font-bold' 
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Mental Status */}
            {!canWalk && breathingRate > 0 && radialPulsePresent && (
              <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">4. Estado Mental / Resposta</div>
                  <div className="text-[10px] text-slate-400">Obedece a comandos simples ('aperte minha mão')?</div>
                </div>
                <button
                  onClick={() => setObeysCommands(!obeysCommands)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                    obeysCommands ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {obeysCommands ? 'Obedece' : 'Não responsivo'}
                </button>
              </div>
            )}
          </div>

          {/* TRIAGE RESULT CARD */}
          <div className={`p-3.5 rounded-xl border shadow-lg ${triageResult.color}`}>
            <div className="flex items-center justify-between font-mono font-black text-sm">
              <span className="tracking-wider uppercase">CLASSIFICAÇÃO: {triageResult.label}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-black/40 border border-white/20">
                {triageResult.category}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed font-sans font-medium">
              <strong>Conduta Imediata:</strong> {triageResult.action}
            </p>
          </div>
        </div>
      )}

      {/* Selected Condition Details Modal */}
      {selectedCondition && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-4 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 font-mono flex items-center gap-2">
                <Cross className="w-4 h-4 text-rose-400" />
                {selectedCondition.label}
              </h3>
              <button 
                onClick={() => setSelectedCondition(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2">
              <div>
                <span className="text-slate-400 font-mono text-[11px] block">CATEGORIA CLÍNICA:</span>
                <span className="text-amber-400 font-bold">{selectedCondition.category}</span>
              </div>

              <div>
                <span className="text-slate-400 font-mono text-[11px] block">TERMOS DE BUSCA & SINTOMAS RELACIONADOS:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedCondition.searchTerms.map((st, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                      {st}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                <p className="text-[11px] leading-relaxed">
                  Para tratamento complementar desta condição, consulte os <strong>Remédios Naturais</strong> na aba ao lado ou acione a <strong>IA Tática</strong> para dosagens de emergência.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCondition(null)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
