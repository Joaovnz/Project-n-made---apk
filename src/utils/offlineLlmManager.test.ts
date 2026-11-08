/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  offlineLlmManager, 
  AVAILABLE_OFFLINE_MODELS, 
  LlmDownloadProgress 
} from './offlineLlmManager';

test('AVAILABLE_OFFLINE_MODELS lists at least 3 model options', () => {
  assert.ok(AVAILABLE_OFFLINE_MODELS.length >= 3);
  const smollm = AVAILABLE_OFFLINE_MODELS.find(m => m.id === 'smollm-135m-tactical');
  assert.ok(smollm);
  assert.strictEqual(smollm.sizeMb, 48);
  assert.strictEqual(smollm.quantization, 'INT4 / Q4_K_M');
});

test('offlineLlmManager downloads model and tracks progress to 100%', async () => {
  const progressLogs: number[] = [];
  const success = await offlineLlmManager.downloadModel('smollm-135m-tactical', (p: LlmDownloadProgress) => {
    progressLogs.push(p.percentage);
  });

  assert.strictEqual(success, true);
  assert.ok(progressLogs.length > 0);
  assert.strictEqual(progressLogs[progressLogs.length - 1], 100);
  assert.strictEqual(offlineLlmManager.isModelDownloaded('smollm-135m-tactical'), true);
});

test('offlineLlmManager generates universal response for AI Assistant', async () => {
  const res = await offlineLlmManager.generateResponse({
    prompt: 'Como purificar água de rio com cloro?',
    module: 'assistant',
    lang: 'pt'
  });

  assert.ok(res.text.includes('Água Segura') || res.text.includes('Desinfecção'));
  assert.ok(res.inferenceTimeMs >= 0);
});

test('offlineLlmManager generates clinical response for Medical module', async () => {
  const res = await offlineLlmManager.generateResponse({
    prompt: 'Vítima inconsciente com hemorragia intensa na coxa',
    module: 'medical',
    lang: 'pt'
  });

  assert.ok(res.text.includes('PARECER CLÍNICO'));
  assert.ok(res.text.includes('Torniquete') || res.text.includes('VERMELHO'));
});

test('offlineLlmManager generates military SITREP for Command Center', async () => {
  const res = await offlineLlmManager.generateResponse({
    prompt: 'Tempestade severa com queda de rede celular comercial',
    module: 'sitrep',
    lang: 'pt'
  });

  assert.ok(res.text.includes('SITREP'));
  assert.ok(res.text.includes('SITUAÇÃO GERAL'));
});

test('offlineLlmManager synthesizes compact LoRa packet for Mesh Radio', async () => {
  const res = await offlineLlmManager.generateResponse({
    prompt: 'Fratura exposta e hipotermia grave',
    context: '-15.7801,-47.9292',
    module: 'mesh',
    lang: 'pt'
  });

  assert.ok(res.text.includes('SOS NOMAD'));
  assert.ok(res.text.length <= 256, 'LoRa packet must be strictly within 256 bytes');
});

test('offlineLlmManager streams tokens progressively via onToken callback', async () => {
  const tokens: string[] = [];
  let finalAccumulated = '';

  await offlineLlmManager.generateResponse({
    prompt: 'Teste rápido de streaming',
    module: 'tools',
    lang: 'pt',
    onToken: (tok, acc) => {
      tokens.push(tok);
      finalAccumulated = acc;
    }
  });

  assert.ok(tokens.length > 3);
  assert.ok(finalAccumulated.length > 10);
});
