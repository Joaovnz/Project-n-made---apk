/**
 * Project NOMAD Tactical & Survival Pure Logic Algorithms
 * Decoupled for unit testing and offline field utility.
 */

// --- 1. COORDINATES & FIELD NAVIGATION ---

/**
 * Calculates distance in kilometers and bearing in degrees between two GPS coordinates using Haversine formula.
 */
export function calculateDistanceAndBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceKm: number; bearingDeg: number; compassDirection: string } {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = Math.round(R * c * 100) / 100;

  // Bearing calculation
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);

  let bearingDeg = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);

  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const dirIndex = Math.round(bearingDeg / 22.5) % 16;
  const compassDirection = directions[dirIndex];

  return { distanceKm, bearingDeg, compassDirection };
}

/**
 * Converts Latitude and Longitude to Amateur Radio Maidenhead Grid Locator (6-character QTH locator).
 * Essential for HAM radio, LoRa Meshtastic, and off-grid emergency localization.
 */
export function coordToMaidenhead(lat: number, lon: number): string {
  // Constrain bounds
  lat = Math.max(-90, Math.min(90, lat));
  lon = Math.max(-180, Math.min(180, lon));

  let adjLon = lon + 180;
  let adjLat = lat + 90;

  const fieldA = String.fromCharCode(65 + Math.floor(adjLon / 20));
  const fieldB = String.fromCharCode(65 + Math.floor(adjLat / 10));

  adjLon = adjLon % 20;
  adjLat = adjLat % 10;

  const squareA = Math.floor(adjLon / 2);
  const squareB = Math.floor(adjLat / 1);

  adjLon = (adjLon % 2) * 60;
  adjLat = (adjLat % 1) * 60;

  const subsquareA = String.fromCharCode(97 + Math.floor(adjLon / 5));
  const subsquareB = String.fromCharCode(97 + Math.floor(adjLat / 2.5));

  return `${fieldA}${fieldB}${squareA}${squareB}${subsquareA}${subsquareB}`;
}

/**
 * Converts Decimal Degrees to approximate Military Grid Reference System (MGRS/UTM zone + square).
 */
export function coordToMGRS(lat: number, lon: number): string {
  // Determine UTM Zone
  const zone = Math.floor((lon + 180) / 6) + 1;
  const letters = 'CDEFGHJKLMNPQRSTUVWX';
  const latIndex = Math.min(letters.length - 1, Math.max(0, Math.floor((lat + 80) / 8)));
  const band = letters[latIndex] || 'M';

  // Simplified 100km square identifier approximation
  const easting = Math.abs(Math.round(((lon % 6) + 3) * 100000)) % 100000;
  const northing = Math.abs(Math.round(((lat % 8) + 4) * 100000)) % 100000;

  const pad5 = (n: number) => n.toString().padStart(5, '0');
  return `${zone}${band} ${pad5(easting).slice(0, 4)} ${pad5(northing).slice(0, 4)}`;
}

// --- 2. MORSE CODE & SIGNALING ---

const MORSE_MAP: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.',
  G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..',
  M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
  S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..',
  '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
  '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.',
  '-': '-....-', '(': '-.--.', ')': '-.--.-', ':': '---...',
  '=': '-...-', '+': '.-.-.', '@': '.--.-.', ' ': '/'
};

const REVERSE_MORSE_MAP: Record<string, string> = Object.entries(MORSE_MAP).reduce(
  (acc, [char, code]) => {
    acc[code] = char;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Translates Latin alphanumeric text into international Morse code with timing units.
 * Dot = 1 unit, Dash = 3 units, Symbol space = 1 unit, Letter space = 3 units, Word space = 7 units.
 */
export function textToMorse(text: string): { morse: string; timingUnits: number[] } {
  const upper = text.toUpperCase().trim();
  const words = upper.split(/\s+/);
  const morseWords: string[] = [];
  const timingUnits: number[] = [];

  for (let w = 0; w < words.length; w++) {
    const word = words[w];
    const morseChars: string[] = [];

    for (let c = 0; c < word.length; c++) {
      const char = word[c];
      const code = MORSE_MAP[char];
      if (code) {
        morseChars.push(code);
        // Build timing pulses
        for (let i = 0; i < code.length; i++) {
          timingUnits.push(code[i] === '.' ? 1 : 3); // Tone on
          if (i < code.length - 1) timingUnits.push(-1); // Intra-character space off
        }
        if (c < word.length - 1) timingUnits.push(-3); // Inter-character space off
      }
    }

    if (morseChars.length > 0) {
      morseWords.push(morseChars.join(' '));
    }
    if (w < words.length - 1) {
      timingUnits.push(-7); // Inter-word space off
    }
  }

  return {
    morse: morseWords.join(' / '),
    timingUnits
  };
}

/**
 * Decodes Morse code into readable plain text.
 */
export function morseToText(morse: string): string {
  const words = morse.trim().split(/\s*\/\s*|\s{3,}/);
  const resultWords = words.map(word => {
    const letters = word.trim().split(/\s+/);
    return letters.map(code => REVERSE_MORSE_MAP[code] || '?').join('');
  });
  return resultWords.join(' ');
}

// --- 3. SOLAR & FIELD ENERGY CALCULATOR ---

export interface SolarCalculationResult {
  currentStoredWh: number;
  netPowerWatts: number;
  runtimeHours: number;
  willDeplete: boolean;
  dailySolarGenWh: number;
  dailyConsumptionWh: number;
  dailySurplusWh: number;
  status: 'SURPLUS' | 'DEFICIT' | 'CRITICAL';
}

/**
 * Calculates battery autonomy and solar energy budget in field operations.
 */
export function estimateSolarRuntime(
  batteryWh: number,
  chargePercent: number,
  loadWatts: number,
  solarWatts: number,
  sunlightHours: number = 5.5
): SolarCalculationResult {
  const currentStoredWh = (batteryWh * Math.max(0, Math.min(100, chargePercent))) / 100;
  const netPowerWatts = solarWatts - loadWatts;

  // 24-hour cycle estimation
  const dailySolarGenWh = solarWatts * sunlightHours * 0.85; // 85% real-world derating
  const dailyConsumptionWh = loadWatts * 24;
  const dailySurplusWh = Math.round(dailySolarGenWh - dailyConsumptionWh);

  let runtimeHours = 0;
  let willDeplete = false;

  if (loadWatts <= 0) {
    runtimeHours = Infinity;
  } else if (netPowerWatts >= 0 && dailySurplusWh >= 0) {
    // Solar covers continuous load with surplus
    runtimeHours = 999;
    willDeplete = false;
  } else {
    // Depletion from battery
    willDeplete = true;
    runtimeHours = Math.round((currentStoredWh / loadWatts) * 10) / 10;
  }

  let status: 'SURPLUS' | 'DEFICIT' | 'CRITICAL' = 'SURPLUS';
  if (dailySurplusWh < 0) {
    status = runtimeHours < 12 ? 'CRITICAL' : 'DEFICIT';
  }

  return {
    currentStoredWh: Math.round(currentStoredWh),
    netPowerWatts: Math.round(netPowerWatts * 10) / 10,
    runtimeHours,
    willDeplete,
    dailySolarGenWh: Math.round(dailySolarGenWh),
    dailyConsumptionWh: Math.round(dailyConsumptionWh),
    dailySurplusWh,
    status
  };
}

// --- 4. START EMERGENCY TRIAGE ---

export interface TriageEvaluation {
  category: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
  label: string;
  color: string;
  action: string;
}

/**
 * Simple Triage and Rapid Treatment (START) algorithm for mass casualty triage.
 */
export function evaluateSTARTTriage(params: {
  canWalk: boolean;
  breathingRate: number; // 0 = not breathing
  airwayRepositionBreathing?: boolean;
  radialPulsePresent: boolean;
  capillaryRefillSec: number;
  obeysCommands: boolean;
}): TriageEvaluation {
  // Step 1: Walking wounded
  if (params.canWalk) {
    return {
      category: 'GREEN',
      label: 'Menor / Verde',
      color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40',
      action: 'Vítima ambulatorial. Encaminhe para posto de atendimento secundário ou auxílio a outros.'
    };
  }

  // Step 2: Respiration check
  if (params.breathingRate === 0) {
    if (params.airwayRepositionBreathing) {
      return {
        category: 'RED',
        label: 'Imediato / Vermelho',
        color: 'text-rose-400 bg-rose-950/40 border-rose-500/40',
        action: 'Via aérea pérvia apenas com suporte. Risco crítico de asfixia. Mantenha posição e evacue.'
      };
    }
    return {
      category: 'BLACK',
      label: 'Óbito / Preto',
      color: 'text-slate-400 bg-slate-900 border-slate-700',
      action: 'Sem ventilação espontânea após manobra de vias aéreas. Não responsivo.'
    };
  }

  if (params.breathingRate > 30 || params.breathingRate < 10) {
    return {
      category: 'RED',
      label: 'Imediato / Vermelho',
      color: 'text-rose-400 bg-rose-950/40 border-rose-500/40',
      action: 'Taquipneia ou bradipneia severa (>30 ou <10 rpm). Choque ou insuficiência respiratória iminente.'
    };
  }

  // Step 3: Perfusion check
  if (!params.radialPulsePresent || params.capillaryRefillSec > 2) {
    return {
      category: 'RED',
      label: 'Imediato / Vermelho',
      color: 'text-rose-400 bg-rose-950/40 border-rose-500/40',
      action: 'Sinais de choque hipovolêmico/hemorrágico (pulso radial ausente ou perfusão > 2s). Aplique torniquete/pressão e eleve pernas.'
    };
  }

  // Step 4: Mental status check
  if (!params.obeysCommands) {
    return {
      category: 'RED',
      label: 'Imediato / Vermelho',
      color: 'text-rose-400 bg-rose-950/40 border-rose-500/40',
      action: 'Estado mental rebaixado (não obedece comandos simples). Risco neurológico grave.'
    };
  }

  // Delayed / Yellow
  return {
    category: 'YELLOW',
    label: 'Urgente / Amarelo',
    color: 'text-amber-400 bg-amber-950/40 border-amber-500/40',
    action: 'Grave porém estável no momento. Não deambula mas RPM preservado. Reavaliar a cada 15 minutos.'
  };
}

// --- 5. DRUG INTERACTION DETECTION ---

export interface InteractionAlert {
  drugA: string;
  drugB: string;
  severity: 'CRITICAL' | 'WARNING' | 'NOTICE';
  mechanism: string;
}

const DRUG_PAIRS = [
  { a: ['aspirin', 'aspirina', 'aas'], b: ['warfarin', 'varfarina', 'heparin', 'heparina'], severity: 'CRITICAL', mechanism: 'Alto risco de sangramento fatal espontâneo por efeito antiplaquetário sinérgico.' },
  { a: ['ibuprofen', 'ibuprofeno', 'diclofenac', 'diclofenaco', 'naproxen'], b: ['enalapril', 'losartan', 'captopril'], severity: 'WARNING', mechanism: 'AINEs anulam o efeito anti-hipertensivo e podem precipitar insuficiência renal aguda.' },
  { a: ['paracetamol', 'acetaminophen'], b: ['alcohol', 'alcool', 'álcool'], severity: 'CRITICAL', mechanism: 'Depleção severa de glutationa levando a necrose hepática centrolobular.' },
  { a: ['metronidazole', 'metronidazol'], b: ['alcohol', 'alcool', 'álcool'], severity: 'CRITICAL', mechanism: 'Efeito dissulfiram: taquicardia extrema, vômitos profusos, hipotensão severa.' },
  { a: ['ciprofloxacin', 'ciprofloxacino', 'tetracycline', 'doxycycline'], b: ['antacid', 'antiacido', 'antiácido', 'calcium', 'calcio', 'cálcio'], severity: 'WARNING', mechanism: 'Quelação cátion-antibiótico: reduz absorção oral do antibiótico em 80-90%.' },
  { a: ['tramadol', 'fentanyl'], b: ['fluoxetine', 'fluoxetina', 'sertraline', 'sertralina'], severity: 'CRITICAL', mechanism: 'Síndrome serotoninérgica potencialmente fatal (hipertermia, mioclonia, instabilidade autonômica).' }
];

export function findDrugInteractions(selectedMeds: string[]): InteractionAlert[] {
  const alerts: InteractionAlert[] = [];
  const normalized = selectedMeds.map(m => m.toLowerCase().trim());

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const med1 = normalized[i];
      const med2 = normalized[j];

      for (const pair of DRUG_PAIRS) {
        const matchesA = pair.a.some(alias => med1.includes(alias));
        const matchesB = pair.b.some(alias => med2.includes(alias));
        const reverseA = pair.a.some(alias => med2.includes(alias));
        const reverseB = pair.b.some(alias => med1.includes(alias));

        if ((matchesA && matchesB) || (reverseA && reverseB)) {
          alerts.push({
            drugA: selectedMeds[i],
            drugB: selectedMeds[j],
            severity: pair.severity as 'CRITICAL' | 'WARNING' | 'NOTICE',
            mechanism: pair.mechanism
          });
        }
      }
    }
  }

  return alerts;
}
