import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CctvCamera } from '@/types/cctv';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Plus, Minus, Compass } from 'lucide-react';

interface CctvMapProps {
  cameras: CctvCamera[];
  onSelectCamera: (cam: CctvCamera) => void;
  selectedCamera: CctvCamera | null;
}

// Clean minimal SVG camera pin with Sky accent
function createCameraIcon(src: string, isSelected: boolean) {
  const getBadgeColor = () => {
    switch (src) {
      case 'dki':
        return '#0284c7'; // Sky 600
      case 'tol':
        return '#10b981'; // Emerald
      case 'bks':
      case 'bgr':
      case 'tgr':
        return '#f59e0b'; // Amber
      default:
        return '#0ea5e9'; // Sky 500
    }
  };

  const accentColor = getBadgeColor();
  const ring = isSelected
    ? 'ring-2 ring-sky-400 scale-125 z-50 shadow-lg shadow-sky-500/30'
    : 'hover:scale-115 shadow-md';

  return L.divIcon({
    className: 'custom-cctv-pin',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        background: #0b0f19;
        border: 1.5px solid ${isSelected ? '#38bdf8' : '#1e293b'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        transition: transform 0.15s ease;
      " class="${ring}">
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${accentColor};
          border: 1px solid #0b0f19;
        "></div>
        <svg style="width: 13px; height: 13px; color: #f8fafc;" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4.5 6h9A2.5 2.5 0 0 1 16 8.5v1.3l3.4-2.2c.7-.4 1.6.1 1.6.9v7c0 .8-.9 1.3-1.6.9L16 14.2v1.3a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 2 15.5v-7A2.5 2.5 0 0 1 4.5 6Z"/>
        </svg>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
  });
}

// Controller component to smoothly fly to coordinates when needed
export const MapController: React.FC<{ center: [number, number]; zoom?: number }> = ({
  center,
  zoom,
}) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Floating map zoom controls
const FloatingControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-xl p-1 shadow-2xl">
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
        onClick={() => map.zoomIn()}
        title="Perbesar"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
      <div className="h-[1px] bg-slate-800 mx-1"></div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
        onClick={() => map.zoomOut()}
        title="Perkecil"
      >
        <Minus className="w-3.5 h-3.5" />
      </Button>
      <div className="h-[1px] bg-slate-800 mx-1"></div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 text-slate-300 hover:text-sky-400 hover:bg-slate-800 rounded-lg"
        onClick={() => map.flyTo([-6.2088, 106.8456], 12)}
        title="Pusatkan Jakarta"
      >
        <Compass className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export const CctvMap: React.FC<CctvMapProps> = ({
  cameras,
  onSelectCamera,
  selectedCamera,
}) => {
  const defaultCenter: [number, number] = [-6.2088, 106.8456]; // Jakarta Center
  const mapTilerKey = import.meta.env.VITE_MAPTILER_API_KEY || 'UZoRbGNmqJsmrvrfNZC3';

  // Cache marker icons by source
  const icons = useMemo(() => {
    return {
      dki: createCameraIcon('dki', false),
      tol: createCameraIcon('tol', false),
      bks: createCameraIcon('bks', false),
      bgr: createCameraIcon('bgr', false),
      tgr: createCameraIcon('tgr', false),
      default: createCameraIcon('other', false),
    };
  }, []);

  return (
    <div className="relative w-full h-full flex-1">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="w-full h-full z-0"
        zoomControl={false}
      >
        {/* MapTiler Streets v2 with user API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${mapTilerKey}`}
          maxZoom={19}
          tileSize={512}
          zoomOffset={-1}
        />

        {selectedCamera && (
          <MapController
            center={[selectedCamera.lat, selectedCamera.lng]}
            zoom={15}
          />
        )}

        <FloatingControls />

        {/* Render CCTV Markers */}
        {cameras.map((cam) => {
          const isSelected = selectedCamera?.id === cam.id;
          const icon = isSelected
            ? createCameraIcon(cam.src, true)
            : icons[cam.src as keyof typeof icons] || icons.default;

          return (
            <Marker
              key={cam.id}
              position={[cam.lat, cam.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectCamera(cam),
              }}
            >
              <Popup className="cctv-minimal-popup">
                <div className="p-1 min-w-[210px] text-slate-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge variant="sky" className="text-[9px] uppercase font-mono px-1 py-0 h-4">
                      {cam.src}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {cam.views ? cam.views.length : 1} Kamera
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-100 leading-snug mb-1">
                    {cam.name}
                  </h4>
                  {cam.sub && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {cam.sub}
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs bg-sky-500 hover:bg-sky-600 text-white font-medium flex items-center justify-center gap-1.5 rounded-lg shadow-sm"
                    onClick={() => onSelectCamera(cam)}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Putar Live
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
