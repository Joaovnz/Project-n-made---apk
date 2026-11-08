/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Globe, 
  Compass, 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  RotateCw, 
  Download, 
  X, 
  Navigation,
  Eye,
  Info
} from 'lucide-react';
import { MapWaypoint } from '../data/nomadData';
import { coordToMaidenhead, coordToMGRS, calculateDistanceAndBearing } from '../utils/survivalLogic';
import { offlineMarbleGlobeManager } from '../utils/offlineMarbleGlobeManager';
import { Language } from '../types';

interface MarbleVirtualGlobeProps {
  waypoints: MapWaypoint[];
  currentCoords: { lat: number; lng: number };
  onSelectWaypoint?: (wp: MapWaypoint) => void;
  onOpenGlobeDownloadModal?: () => void;
  lang: Language;
}

export const MarbleVirtualGlobe: React.FC<MarbleVirtualGlobeProps> = ({
  waypoints,
  currentCoords,
  onSelectWaypoint,
  onOpenGlobeDownloadModal,
  lang
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const reqAnimRef = useRef<number | null>(null);

  // Interaction controls
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0.2, y: 2.1 });
  const zoomDistanceRef = useRef(2.5);
  const targetZoomRef = useRef(2.5);
  const pinchDistRef = useRef<number | null>(null);

  // UI state
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showAtmosphere, setShowAtmosphere] = useState(true);
  const [selectedWp, setSelectedWp] = useState<MapWaypoint | null>(null);
  const [hudCoords, setHudCoords] = useState<{ lat: number; lng: number }>({
    lat: currentCoords.lat,
    lng: currentCoords.lng
  });

  const activePackage = offlineMarbleGlobeManager.getActivePackage();

  // Procedural high-resolution Marble texture generator (Coastlines, topography, elevation bands)
  const createMarbleTexture = (): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep ocean base
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    oceanGrad.addColorStop(0, '#06101e');
    oceanGrad.addColorStop(0.5, '#0b1d33');
    oceanGrad.addColorStop(1, '#06101e');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ocean bathymetric contour waves
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.08)';
    ctx.lineWidth = 1;
    for (let y = 40; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // High-resolution landmass approximation (Continents and Major Land Relief)
    // Americas
    ctx.fillStyle = '#1c382b'; // Dark tactical forest/terrain
    // North America
    ctx.beginPath();
    ctx.ellipse(450, 260, 260, 160, -0.2, 0, Math.PI * 2);
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.ellipse(650, 680, 140, 220, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Eurasia
    ctx.fillStyle = '#223c2d';
    ctx.beginPath();
    ctx.ellipse(1350, 280, 420, 190, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Africa
    ctx.fillStyle = '#3a3826'; // Savanna/arid relief
    ctx.beginPath();
    ctx.ellipse(1120, 560, 160, 200, 0, 0, Math.PI * 2);
    ctx.fill();

    // Australia
    ctx.fillStyle = '#3d2e1e';
    ctx.beginPath();
    ctx.ellipse(1720, 720, 130, 95, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Polar ice caps (Antarctica & Arctic)
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, canvas.width, 45);
    ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

    // Mountain ridges (Andes, Rockies, Himalayas) in lighter topography
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 3;
    // Andes
    ctx.beginPath();
    ctx.moveTo(560, 520);
    ctx.lineTo(590, 840);
    ctx.stroke();
    // Rockies
    ctx.beginPath();
    ctx.moveTo(330, 180);
    ctx.lineTo(390, 360);
    ctx.stroke();
    // Himalayas
    ctx.beginPath();
    ctx.moveTo(1400, 320);
    ctx.lineTo(1580, 340);
    ctx.stroke();

    // Equator golden tactical line
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    // Prime meridian
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Convert GPS (lat, lng) to 3D Cartesian coordinates on sphere
  const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
  };

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060911);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = zoomDistanceRef.current;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    // Stars background particles
    const starsCount = 400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 50;
      starPos[i + 1] = (Math.random() - 0.5) * 50;
      starPos[i + 2] = -10 - Math.random() * 30;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.08, transparent: true, opacity: 0.7 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Lighting (Tactical Sun Irradiance)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 1.4);
    sunLight.position.set(5, 3, 4);
    scene.add(sunLight);

    // Globe Group
    const globeGroup = new THREE.Group();
    globeGroupRef.current = globeGroup;
    scene.add(globeGroup);

    // Earth Sphere (Marble dataset texture)
    const globeRadius = 1.0;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const globeTexture = createMarbleTexture();
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTexture,
      roughness: 0.7,
      metalness: 0.1,
    });
    const globeMesh = new THREE.Mesh(globeGeo, globeMat);
    globeGroup.add(globeMesh);

    // Atmosphere Glow Mesh
    const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.03, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Tactical Wireframe Grid overlay (Lat/Lon graticule)
    const gridGeo = new THREE.SphereGeometry(globeRadius * 1.002, 24, 16);
    const gridMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      wireframe: true,
      transparent: true,
      opacity: 0.16
    });
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    globeGroup.add(gridMesh);

    // Pins Group
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    globeGroup.add(pinsGroup);

    // Render loop
    const animate = () => {
      reqAnimRef.current = requestAnimationFrame(animate);

      // Smooth zoom damping
      zoomDistanceRef.current += (targetZoomRef.current - zoomDistanceRef.current) * 0.1;
      camera.position.z = zoomDistanceRef.current;

      // Smooth rotation damping
      if (autoRotate && !isDraggingRef.current) {
        targetRotationRef.current.y += 0.0015;
      }

      globeGroup.rotation.y += (targetRotationRef.current.y - globeGroup.rotation.y) * 0.1;
      globeGroup.rotation.x += (targetRotationRef.current.x - globeGroup.rotation.x) * 0.1;

      // Update HUD coords based on camera center
      const currentLon = -((globeGroup.rotation.y * 180) / Math.PI) % 360;
      const currentLat = (globeGroup.rotation.x * 180) / Math.PI;
      setHudCoords({
        lat: Math.round(currentLat * 10) / 10,
        lng: Math.round(currentLon * 10) / 10
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
      if (renderer.domElement && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update 3D pins on the globe
  useEffect(() => {
    if (!pinsGroupRef.current) return;
    const group = pinsGroupRef.current;

    // Clear existing pins
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }

    const radius = 1.0;

    // 1. User Location Pin (Pulsing amber marker)
    const userPos = latLngToVector3(currentCoords.lat, currentCoords.lng, radius * 1.015);
    const userPinGeo = new THREE.CylinderGeometry(0.015, 0.002, 0.08, 12);
    const userPinMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const userPin = new THREE.Mesh(userPinGeo, userPinMat);
    userPin.position.copy(userPos);
    userPin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), userPos.clone().normalize());
    group.add(userPin);

    // 2. Waypoint Pins
    waypoints.forEach((wp) => {
      const pos = latLngToVector3(wp.lat, wp.lng, radius * 1.01);
      
      let color = 0x38bdf8; // water
      if (wp.category === 'SHELTER') color = 0xf59e0b;
      if (wp.category === 'MEDICAL') color = 0xf43f5e;
      if (wp.category === 'RADIO') color = 0x10b981;

      const pinGeo = new THREE.ConeGeometry(0.016, 0.06, 8);
      const pinMat = new THREE.MeshBasicMaterial({ color });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pos.clone().normalize());
      pinMesh.userData = { waypoint: wp };
      group.add(pinMesh);
    });
  }, [waypoints, currentCoords]);

  // Touch and Mouse handlers for smooth 3D globe manipulation
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;

    targetRotationRef.current.y += deltaX * 0.005;
    targetRotationRef.current.x = Math.max(
      -Math.PI / 2.2,
      Math.min(Math.PI / 2.2, targetRotationRef.current.x + deltaY * 0.005)
    );

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.0015;
    targetZoomRef.current = Math.max(1.3, Math.min(4.5, targetZoomRef.current + zoomDelta));
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const delta = direction === 'in' ? -0.4 : 0.4;
    targetZoomRef.current = Math.max(1.3, Math.min(4.5, targetZoomRef.current + delta));
  };

  const handleCenterOnUser = () => {
    // Smoothly rotate globe to face the operator's current GPS location
    const targetY = -(currentCoords.lng * Math.PI) / 180;
    const targetX = (currentCoords.lat * Math.PI) / 180;
    targetRotationRef.current = { x: targetX, y: targetY };
    targetZoomRef.current = 1.8;
  };

  const mgrsCode = coordToMGRS(hudCoords.lat, hudCoords.lng);
  const maidenheadCode = coordToMaidenhead(hudCoords.lat, hudCoords.lng);

  return (
    <div className="relative w-full h-[calc(100vh-8.5rem)] bg-[#060911] overflow-hidden select-none">
      
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Top Tactical HUD Bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-none">
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg pointer-events-auto flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Globe className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-xs text-slate-100 uppercase tracking-wider">
                GLOBO MARBLE 3D (OPEN-SOURCE)
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                OFFLINE
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
              <span>MGRS: <strong className="text-amber-400">{mgrsCode}</strong></span>
              <span>GRID: <strong className="text-cyan-400">{maidenheadCode}</strong></span>
            </div>
          </div>
        </div>

        {/* Package & Download Manager Button */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={onOpenGlobeDownloadModal}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 backdrop-blur-md shadow-md active:scale-95 transition-all"
            title="Gerenciar e Baixar Pacotes do Globo Marble"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pacote Marble</span>
          </button>
        </div>
      </div>

      {/* Tactical Floating Controls (Right) */}
      <div className="absolute right-3 top-16 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleCenterOnUser}
          className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/40 backdrop-blur-md shadow-lg active:scale-90 transition-all"
          title="Centrar no meu GPS"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all ${
            autoRotate
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-900/90 text-slate-400 border-slate-700'
          }`}
          title="Giro orbital automático"
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin-slow' : ''}`} />
        </button>

        <div className="flex flex-col bg-slate-900/90 border border-slate-700 rounded-xl overflow-hidden shadow-lg backdrop-blur-md">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition-colors border-b border-slate-800"
            title="Aproximar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 text-slate-200 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            title="Afastar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Crosshair Coordinate Center Marker */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-6 h-6 border border-amber-500/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-amber-400 rounded-full" />
        </div>
      </div>

      {/* Waypoint Quick Carousel (Bottom overlay) */}
      <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex flex-col gap-1.5">
        
        {/* Selected Waypoint Card */}
        {selectedWp && (
          <div className="pointer-events-auto p-3 rounded-xl bg-slate-900/95 border border-amber-500/60 backdrop-blur-md shadow-2xl flex items-center justify-between gap-3 max-w-md mx-auto w-full animate-fadeIn">
            <div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono font-bold text-xs text-slate-100">{selectedWp.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {selectedWp.category}
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                {selectedWp.lat.toFixed(4)}, {selectedWp.lng.toFixed(4)} • Dist: {
                  calculateDistanceAndBearing(currentCoords.lat, currentCoords.lng, selectedWp.lat, selectedWp.lng).distanceKm
                } km
              </div>
            </div>
            <button
              onClick={() => setSelectedWp(null)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Waypoints horizontally scrollable badges */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {waypoints.map((wp) => (
            <button
              key={wp.id}
              onClick={() => {
                setSelectedWp(wp);
                // Rotate globe directly to this waypoint
                const targetY = -(wp.lng * Math.PI) / 180;
                const targetX = (wp.lat * Math.PI) / 180;
                targetRotationRef.current = { x: targetX, y: targetY };
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-mono text-slate-300 hover:text-amber-300 backdrop-blur-md shrink-0 flex items-center gap-1 shadow"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                wp.category === 'WATER' ? 'bg-cyan-400' :
                wp.category === 'SHELTER' ? 'bg-amber-400' :
                wp.category === 'MEDICAL' ? 'bg-rose-400' : 'bg-emerald-400'
              }`} />
              <span>{wp.name}</span>
            </button>
          ))}
        </div>

      </div>

    </div>
  );
};
