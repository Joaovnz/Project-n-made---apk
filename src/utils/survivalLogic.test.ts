import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceAndBearing,
  coordToMaidenhead,
  coordToMGRS,
  textToMorse,
  morseToText,
  estimateSolarRuntime,
  evaluateSTARTTriage,
  findDrugInteractions
} from './survivalLogic.ts';

test('calculateDistanceAndBearing accurately computes distance and bearing', () => {
  // Distance between Brasilia (-15.7801, -47.9292) and Rio de Janeiro (-22.9068, -43.1729) is ~930-940 km
  const result = calculateDistanceAndBearing(-15.7801, -47.9292, -22.9068, -43.1729);
  assert.ok(result.distanceKm > 900 && result.distanceKm < 960, `Distance was ${result.distanceKm} km`);
  assert.ok(result.bearingDeg >= 130 && result.bearingDeg <= 170, `Bearing was ${result.bearingDeg} deg`);
  assert.ok(typeof result.compassDirection === 'string' && result.compassDirection.length > 0);
});

test('calculateDistanceAndBearing returns 0 distance for identical points', () => {
  const result = calculateDistanceAndBearing(10, 20, 10, 20);
  assert.equal(result.distanceKm, 0);
});

test('coordToMaidenhead converts latitude and longitude to 6-char locator', () => {
  // Greenwich (51.48, 0.0) -> IO91wk or similar
  const londonLocator = coordToMaidenhead(51.4779, -0.0015);
  assert.equal(londonLocator.length, 6);
  assert.equal(londonLocator.slice(0, 2), 'IO');

  // Brasilia (-15.7801, -47.9292) -> GH54.. or similar
  const brasiliaLocator = coordToMaidenhead(-15.7801, -47.9292);
  assert.equal(brasiliaLocator.length, 6);
  assert.equal(typeof brasiliaLocator, 'string');
});

test('coordToMGRS produces valid zone and band format', () => {
  const mgrs = coordToMGRS(-15.7801, -47.9292);
  assert.ok(mgrs.length > 5);
  // UTM zone for -47.9292 is zone 22 or 23
  assert.ok(mgrs.startsWith('22') || mgrs.startsWith('23'));
});

test('textToMorse encodes SOS accurately', () => {
  const result = textToMorse('SOS');
  assert.equal(result.morse, '... --- ...');
  assert.ok(result.timingUnits.length > 0);
});

test('morseToText decodes Morse code back to text', () => {
  const decoded = morseToText('... --- ...');
  assert.equal(decoded, 'SOS');
  
  const decodedMsg = morseToText('-. --- -- .- -..');
  assert.equal(decodedMsg, 'NOMAD');
});

test('estimateSolarRuntime calculates battery discharge correctly', () => {
  // 500Wh battery at 100%, 50W draw, 0W solar -> exactly 10 hours runtime
  const result = estimateSolarRuntime(500, 100, 50, 0, 5);
  assert.equal(result.runtimeHours, 10);
  assert.equal(result.willDeplete, true);
  assert.equal(result.currentStoredWh, 500);
  assert.equal(result.netPowerWatts, -50);
});

test('estimateSolarRuntime identifies power surplus', () => {
  // 1000Wh battery at 80%, 20W load, 100W solar panel with 6h sun -> strong daily surplus
  const result = estimateSolarRuntime(1000, 80, 20, 100, 6);
  assert.equal(result.willDeplete, false);
  assert.equal(result.status, 'SURPLUS');
  assert.ok(result.dailySurplusWh > 0);
});

test('evaluateSTARTTriage categorizes walking wounded as GREEN', () => {
  const triage = evaluateSTARTTriage({
    canWalk: true,
    breathingRate: 20,
    radialPulsePresent: true,
    capillaryRefillSec: 1.5,
    obeysCommands: true
  });
  assert.equal(triage.category, 'GREEN');
});

test('evaluateSTARTTriage categorizes severe respiratory distress as RED', () => {
  const triage = evaluateSTARTTriage({
    canWalk: false,
    breathingRate: 36, // > 30 rpm
    radialPulsePresent: true,
    capillaryRefillSec: 1.5,
    obeysCommands: true
  });
  assert.equal(triage.category, 'RED');
});

test('evaluateSTARTTriage categorizes non-breathing without response as BLACK', () => {
  const triage = evaluateSTARTTriage({
    canWalk: false,
    breathingRate: 0,
    airwayRepositionBreathing: false,
    radialPulsePresent: false,
    capillaryRefillSec: 5,
    obeysCommands: false
  });
  assert.equal(triage.category, 'BLACK');
});

test('findDrugInteractions detects critical drug interactions', () => {
  const conflicts = findDrugInteractions(['Aspirina infantil', 'Varfarina sódica 5mg', 'Vitamina C']);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].severity, 'CRITICAL');
});

test('findDrugInteractions detects alcohol and paracetamol interaction', () => {
  const conflicts = findDrugInteractions(['Paracetamol 750mg', 'Álcool']);
  assert.equal(conflicts.length, 1);
});

test('queryOfflineAiEngine returns instant water purification protocol without network', async () => {
  const { queryOfflineAiEngine } = await import('./offlineAiEngine.ts');
  const result = queryOfflineAiEngine('Como purificar água de rio com cloro?');
  assert.equal(result.source, 'nomad-local-edge');
  assert.equal(result.category, 'WATER');
  assert.ok(result.reply.includes('hipoclorito'));
  assert.ok(result.reply.includes('Fervura'));
});

test('queryOfflineAiEngine returns START triage steps offline', async () => {
  const { queryOfflineAiEngine } = await import('./offlineAiEngine.ts');
  const result = queryOfflineAiEngine('Como fazer triagem START em feridos?');
  assert.equal(result.source, 'nomad-local-edge');
  assert.equal(result.category, 'TRIAGE');
  assert.ok(result.reply.includes('Torniquete'));
  assert.ok(result.reply.includes('VERMELHO'));
});

test('queryOfflineAiEngine returns LoRa emergency radio channels offline', async () => {
  const { queryOfflineAiEngine } = await import('./offlineAiEngine.ts');
  const result = queryOfflineAiEngine('Qual a frequencia do canal de emergencia e lora?');
  assert.equal(result.source, 'nomad-local-edge');
  assert.equal(result.category, 'COMMS');
  assert.ok(result.reply.includes('146.520 MHz'));
  assert.ok(result.reply.includes('915.000 MHz'));
});

test('NOMAD_MODULES has all 6 standalone modules verified', async () => {
  const { NOMAD_MODULES } = await import('./offlineSyncManager.ts');
  assert.equal(NOMAD_MODULES.length, 6);
  assert.ok(NOMAD_MODULES.every(m => m.sizeEstimateMb > 0));
  assert.ok(NOMAD_MODULES.every(m => m.isDownloaded === true));
});

