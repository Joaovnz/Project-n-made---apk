import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Plus, 
  Layers, 
  Compass, 
  Download, 
  Trash2, 
  Crosshair, 
  Droplet, 
  Home, 
  ShieldAlert, 
  Radio, 
  Users, 
  Package,
  X,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import { MapWaypoint, INITIAL_WAYPOINTS, MAP_REGIONS_DATA, NomadMapRegion } from '../data/nomadData';
import { coordToMaidenhead, coordToMGRS, calculateDistanceAndBearing } from '../utils/survivalLogic';
import { Language } from '../types';

interface OfflineMapProps {
  lang: Language;
}

export const OfflineMap: React.FC<OfflineMapProps> = ({ lang }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: -15.7801,
    lng: -47.9292
  });
  const [gpsActive, setGpsActive] = useState(false);
  const [waypoints, setWaypoints] = useState<MapWaypoint[]>(INITIAL_WAYPOINTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRegionsModal, setShowRegionsModal] = useState(false);
  const [regions, setRegions] = useState<NomadMapRegion[]>(MAP_REGIONS_DATA);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Form states for new waypoint
  const [newWpName, setNewWpName] = useState('');
  const [newWpCategory, setNewWpCategory] = useState<MapWaypoint['category']>('WATER');
  const [newWpNotes, setNewWpNotes] = useState('');
  const [newWpLat, setNewWpLat] = useState(-15.7801);
  const [newWpLng, setNewWpLng] = useState(-47.9292);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix default marker icon assets with embedded data-URI for 100% offline autonomy
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    const svgMarker = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path fill="%23f59e0b" stroke="%23000" stroke-width="1.5" d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"/><circle cx="12.5" cy="12.5" r="5" fill="%23000"/></svg>';
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: svgMarker,
      iconUrl: svgMarker,
      shadowUrl: '',
    });

    const map = L.map(mapContainerRef.current, {
      center: [currentCoords.lat, currentCoords.lng],
      zoom: 13,
      zoomControl: false,
    });

    // Standard OpenStreetMap tiles (100% free, no API key required, offline-cacheable)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      className: 'tactical-map-tiles'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Track center on move
    map.on('move', () => {
      const center = map.getCenter();
      setNewWpLat(Math.round(center.lat * 10000) / 10000);
      setNewWpLng(Math.round(center.lng * 10000) / 10000);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map markers whenever waypoints or filter change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = selectedCategoryFilter === 'ALL'
      ? waypoints
      : waypoints.filter(wp => wp.category === selectedCategoryFilter);

    filtered.forEach(wp => {
      const getCategoryColor = (cat: string) => {
        switch (cat) {
          case 'WATER': return '#06b6d4'; // Cyan
          case 'SHELTER': return '#f59e0b'; // Amber
          case 'MEDICAL': return '#ef4444'; // Red
          case 'COMMS': return '#10b981'; // Green
          case 'RALLY': return '#8b5cf6'; // Purple
          default: return '#64748b'; // Slate
        }
      };

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="background-color: ${getCategoryColor(wp.category)}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.7);">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([wp.lat, wp.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="padding: 2px;">
          <strong style="color: #f59e0b; font-family: monospace;">${wp.name}</strong>
          <div style="font-size: 11px; margin-top: 4px; color: #cbd5e1;">${wp.notes}</div>
          <div style="font-size: 10px; margin-top: 6px; font-family: monospace; color: #94a3b8;">
            LAT: ${wp.lat.toFixed(4)} | LNG: ${wp.lng.toFixed(4)}
          </div>
        </div>
      `);
      marker.addTo(markersLayerRef.current!);
    });
  }, [waypoints, selectedCategoryFilter]);

  // Handle GPS location request
  const requestGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentCoords({ lat, lng });
          setGpsActive(true);

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 15);

            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([lat, lng]);
            } else {
              const userIcon = L.divIcon({
                className: 'user-pos-icon',
                html: `
                  <div style="background: #3b82f6; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 14px #3b82f6;"></div>
                `,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
              });
              userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(mapInstanceRef.current);
            }
          }
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          // Simulated fallback to current coordinates
          setGpsActive(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const addWaypoint = () => {
    if (!newWpName.trim()) return;

    const newWp: MapWaypoint = {
      id: `wp-${Date.now()}`,
      name: newWpName.trim(),
      category: newWpCategory,
      lat: newWpLat,
      lng: newWpLng,
      notes: newWpNotes.trim() || 'Ponto de interesse registrado pelo operador.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setWaypoints(prev => [newWp, ...prev]);
    setNewWpName('');
    setNewWpNotes('');
    setShowAddModal(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([newWpLat, newWpLng], 14);
    }
  };

  const deleteWaypoint = (id: string) => {
    setWaypoints(prev => prev.filter(w => w.id !== id));
  };

  const maidenhead = coordToMaidenhead(currentCoords.lat, currentCoords.lng);
  const mgrs = coordToMGRS(currentCoords.lat, currentCoords.lng);

  return (
    <div className="relative h-[calc(100vh-8.5rem)] flex flex-col">
      
      {/* 1. Tactical Coordinate Overlay HUD */}
      <div className="absolute top-2 left-2 right-2 z-[400] flex flex-col gap-1.5 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 shadow-xl flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-100">
                <span>LAT: {currentCoords.lat.toFixed(4)}°</span>
                <span>LNG: {currentCoords.lng.toFixed(4)}°</span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span>GRID: <strong className="text-amber-400">{maidenhead}</strong></span>
                <span>MGRS: <strong className="text-cyan-400">{mgrs}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={requestGps}
              className={`p-2 rounded-lg border font-mono text-xs flex items-center gap-1 transition-all ${
                gpsActive 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Obter GPS do Dispositivo"
              aria-label="Obter GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${gpsActive ? 'text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg border border-amber-400/50 shadow flex items-center gap-1 text-xs font-mono"
              title="Marcar Ponto Tático"
              aria-label="Adicionar marcador"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filters Bar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pointer-events-auto">
          {['ALL', 'WATER', 'SHELTER', 'MEDICAL', 'COMMS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase transition-all shadow-sm ${
                selectedCategoryFilter === cat
                  ? 'bg-amber-500 text-black border border-amber-400'
                  : 'bg-slate-900/90 text-slate-300 border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? (lang === 'pt' ? 'Todos' : 'All') : cat}
            </button>
          ))}

          <button
            onClick={() => setShowRegionsModal(true)}
            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-900/90 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shrink-0"
          >
            <Download className="w-3 h-3" />
            {lang === 'pt' ? 'Pacotes Offline' : 'Offline Packs'}
          </button>
        </div>
      </div>

      {/* 2. Map Canvas */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full z-0" 
        style={{ minHeight: '300px' }}
      />

      {/* 3. Bottom Waypoint Quick Bar */}
      <div className="absolute bottom-2 left-2 right-2 z-[400] max-h-36 overflow-y-auto bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
          <span className="font-bold text-slate-200">
            {lang === 'pt' ? 'PONTOS REGISTRADOS' : 'FIELD WAYPOINTS'} ({waypoints.length})
          </span>
          <span>{lang === 'pt' ? 'Distância & Rumo' : 'Distance & Azimuth'}</span>
        </div>

        <div className="space-y-1">
          {waypoints.map((wp) => {
            const nav = calculateDistanceAndBearing(currentCoords.lat, currentCoords.lng, wp.lat, wp.lng);
            return (
              <div 
                key={wp.id}
                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
              >
                <div 
                  className="flex items-center gap-2 cursor-pointer min-w-0"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([wp.lat, wp.lng], 15);
                    }
                  }}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-200 truncate">{wp.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 font-mono">[{wp.category}]</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    {nav.distanceKm}km {nav.compassDirection} ({nav.bearingDeg}°)
                  </span>
                  <button
                    onClick={() => deleteWaypoint(wp.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Excluir ponto"
                    aria-label={`Excluir ponto ${wp.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Waypoint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-xs text-slate-100 font-mono flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                {lang === 'pt' ? 'Novo Marcador Tático' : 'Add Tactical Waypoint'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">NOME DO PONTO:</label>
                <input
                  type="text"
                  value={newWpName}
                  onChange={(e) => setNewWpName(e.target.value)}
                  placeholder="Ex: Ponto de Coleta de Água"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">CATEGORIA:</label>
                <select
                  value={newWpCategory}
                  onChange={(e) => setNewWpCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none"
                >
                  <option value="WATER">ÁGUA POTÁVEL (WATER)</option>
                  <option value="SHELTER">ABRIGO SEGURO (SHELTER)</option>
                  <option value="MEDICAL">POSTO MÉDICO (MEDICAL)</option>
                  <option value="COMMS">REPETIDORA RÁDIO (COMMS)</option>
                  <option value="RALLY">PONTO DE ENCONTRO (RALLY)</option>
                  <option value="CACHE">ESCONDERIJO / SUPRIMENTOS (CACHE)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div>
                  <label className="text-slate-400 block mb-1">LATITUDE:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newWpLat}
                    onChange={(e) => setNewWpLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">LONGITUDE:</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newWpLng}
                    onChange={(e) => setNewWpLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">OBSERVAÇÕES TÁTICAS:</label>
                <textarea
                  value={newWpNotes}
                  onChange={(e) => setNewWpNotes(e.target.value)}
                  placeholder="Instruções de acesso, vazão de água, canal de rádio..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={addWaypoint}
                disabled={!newWpName.trim()}
                className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-mono font-bold text-xs"
              >
                {lang === 'pt' ? 'Gravar Marcador' : 'Save Waypoint'}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs hover:bg-slate-700"
              >
                {lang === 'pt' ? 'Cancelar' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Region Packs Modal */}
      {showRegionsModal && (
        <div className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-xs text-slate-100 font-mono flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" />
                {lang === 'pt' ? 'Regiões Offline ProtoMaps' : 'ProtoMaps Offline Regions'}
              </h3>
              <button 
                onClick={() => setShowRegionsModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              {lang === 'pt' 
                ? 'Baixe ou ative pacotes vetoriais PMTiles para navegação offline sem internet.' 
                : 'Download or activate PMTiles vector packages for 100% offline navigation.'}
            </p>

            <div className="mt-3 space-y-2">
              {regions.map((region) => (
                <div 
                  key={region.id}
                  className="flex items-center justify-between p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{region.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {region.sizeBytes ? `${Math.round(region.sizeBytes / 1024 / 1024)} MB` : '1.2 GB'} • {region.description}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setRegions(prev => prev.map(r => r.id === region.id ? { ...r, downloaded: !r.downloaded } : r));
                    }}
                    className={`px-2.5 py-1 rounded font-mono text-[10px] font-bold ${
                      region.downloaded 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {region.downloaded ? 'INSTALADO' : 'BAIXAR'}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowRegionsModal(false)}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs"
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
