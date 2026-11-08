import test from 'node:test';
import assert from 'node:assert/strict';
import {
  offlineMarbleGlobeManager,
  AVAILABLE_MARBLE_PACKAGES,
  GlobeDownloadProgress
} from './offlineMarbleGlobeManager.ts';

test('AVAILABLE_MARBLE_PACKAGES defines at least embedded and Blue Marble datasets', () => {
  assert.ok(AVAILABLE_MARBLE_PACKAGES.length >= 2, 'Should have multiple Marble datasets');
  const embedded = AVAILABLE_MARBLE_PACKAGES.find(p => p.id === 'marble-tactical-embedded');
  assert.ok(embedded, 'Should contain embedded package');
  assert.equal(embedded?.sizeMb, 0, 'Embedded package is 0MB because it is built-in');
  assert.equal(embedded?.isDownloaded, true, 'Embedded package is marked downloaded by default');

  const blueMarble = AVAILABLE_MARBLE_PACKAGES.find(p => p.id === 'marble-blue-marble-satellite');
  assert.ok(blueMarble, 'Should contain NASA Blue Marble package');
  assert.ok((blueMarble?.sizeMb ?? 0) > 0, 'Satellite pack has realistic dataset size');
});

test('offlineMarbleGlobeManager tracks active package correctly', () => {
  const initial = offlineMarbleGlobeManager.getActivePackage();
  assert.ok(initial, 'Active package exists');

  offlineMarbleGlobeManager.setActivePackage('marble-tactical-embedded');
  assert.equal(offlineMarbleGlobeManager.getActivePackage().id, 'marble-tactical-embedded');

  // Change to another valid package
  offlineMarbleGlobeManager.setActivePackage('marble-blue-marble-satellite');
  assert.equal(offlineMarbleGlobeManager.getActivePackage().id, 'marble-blue-marble-satellite');

  // Reset back to embedded
  offlineMarbleGlobeManager.setActivePackage('marble-tactical-embedded');
  assert.equal(offlineMarbleGlobeManager.getActivePackage().id, 'marble-tactical-embedded');
});

test('offlineMarbleGlobeManager handles download of embedded package immediately', async () => {
  const progressReports: GlobeDownloadProgress[] = [];
  const success = await offlineMarbleGlobeManager.downloadPackage(
    'marble-tactical-embedded',
    (p) => progressReports.push(p)
  );

  assert.equal(success, true, 'Embedded package download should succeed immediately');
  assert.ok(progressReports.length > 0, 'Progress should report completion');
  const last = progressReports[progressReports.length - 1];
  assert.equal(last.status, 'ready');
  assert.equal(last.percentage, 100);
});

test('offlineMarbleGlobeManager allows marking and querying package status', () => {
  const testPkgId = 'marble-mgrs-military-grid';
  offlineMarbleGlobeManager.markPackageDownloaded(testPkgId, true);
  assert.equal(offlineMarbleGlobeManager.isPackageDownloaded(testPkgId), true);

  offlineMarbleGlobeManager.markPackageDownloaded(testPkgId, false);
  assert.equal(offlineMarbleGlobeManager.isPackageDownloaded(testPkgId), false);
});
