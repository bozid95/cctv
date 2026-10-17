import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { CctvCamera } from "@/types/cctv";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Plus, Minus, Navigation } from "lucide-react";

interface CctvMapProps {
  cameras: CctvCamera[];
  onSelectCamera: (cam: CctvCamera) => void;
  selectedCamera: CctvCamera | null;
}

// Iconic Google Maps Teardrop Pin
function createGooglePin(src: string, isSelected: boolean) {
  // Google Maps color palette for pin categories
  const getPinColor = () => {
    if (isSelected) return "#1a73e8"; // Google Blue when active
    switch (src) {
      case "tol":
        return "#ea4335"; // Google Red (iconic for highway/traffic)
      case "dki":
        return "#1a73e8"; // Google Blue
      case "bks":
      case "bgr":
      case "tgr":
        return "#f9ab00"; // Google Yellow/Orange
      default:
        return "#34a853"; // Google Green
    }
  };

  const pinColor = getPinColor();
  const scale = isSelected ? "scale(1.25)" : "scale(1)";
  const zIndex = isSelected ? "z-index: 1000 !important;" : "";

  return L.divIcon({
    className: "custom-cctv-pin",
    html: `
      <div style="
        position: relative;
        width: 28px;
        height: 38px;
        transform: ${scale};
        transform-origin: bottom center;
        transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        filter: drop-shadow(0 2px 5px rgba(60,64,67,0.4));
        cursor: pointer;
        ${zIndex}
      ">
        <svg viewBox="0 0 28 38" width="28" height="38" fill="none">
          <!-- Teardrop pin body -->
          <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 24 14 24s14-13.5 14-24c0-7.732-6.268-14-14-14z" fill="${pinColor}"/>
          <!-- Inner white circle -->
          <circle cx="14" cy="13.5" r="7.5" fill="#ffffff"/>
          <!-- Camera icon inside pin -->
          <path d="M11 11h6a1 1 0 0 1 1 1v.7l1.7-1.1c.4-.2.8.1.8.5v4.8c0 .4-.4.7-.8.5L18 15.3V16a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" fill="${pinColor}"/>
        </svg>
      </div>
    `,
    iconSize: [28, 38],
    iconAnchor: [14, 38],
    popupAnchor: [0, -38],
  });
}

// Controller component to smoothly fly to coordinates when needed
export const MapController: React.FC<{
  center: [number, number];
  zoom?: number;
}> = ({ center, zoom }) => {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 15, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Google Maps floating vertical zoom & navigation controls
const GoogleMapControls: React.FC = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-4 z-20 flex flex-col items-center gap-3">
      {/* Zoom stack */}
      <div className="bg-white rounded-lg border border-[#dadce0] shadow-md shadow-black/10 overflow-hidden flex flex-col">
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
          onClick={() => map.zoomIn()}
          title="Perbesar"
        >
          <Plus className="w-5 h-5" />
        </button>
        <div className="h-[1px] bg-[#dadce0] w-full"></div>
        <button
          type="button"
          className="h-9 w-9 flex items-center justify-center text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
          onClick={() => map.zoomOut()}
          title="Perkecil"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Recenter button */}
      <button
        type="button"
        className="h-10 w-10 bg-white rounded-full border border-[#dadce0] shadow-md shadow-black/10 flex items-center justify-center text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f8f9fa] transition-colors cursor-pointer"
        onClick={() => map.flyTo([-6.2088, 106.8456], 12)}
        title="Pusatkan Peta"
      >
        <Navigation className="w-4 h-4" />
      </button>
    </div>
  );
};

export const CctvMap: React.FC<CctvMapProps> = ({
  cameras,
  onSelectCamera,
  selectedCamera,
}) => {
  const defaultCenter: [number, number] = [-6.2088, 106.8456]; // Jakarta Center

  // Cache marker icons by source
  const icons = useMemo(() => {
    return {
      dki: createGooglePin("dki", false),
      tol: createGooglePin("tol", false),
      bks: createGooglePin("bks", false),
      bgr: createGooglePin("bgr", false),
      tgr: createGooglePin("tgr", false),
      default: createGooglePin("other", false),
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
        {/* OpenStreetMap Standard (100% Free & Open Source) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {selectedCamera && (
          <MapController
            center={[selectedCamera.lat, selectedCamera.lng]}
            zoom={15}
          />
        )}

        <GoogleMapControls />

        {/* Render CCTV Markers */}
        {cameras.map((cam) => {
          const isSelected = selectedCamera?.id === cam.id;
          const icon = isSelected
            ? createGooglePin(cam.src, true)
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
              <Popup className="cctv-google-popup">
                <div className="p-1 min-w-[210px] text-[#202124]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-semibold px-1.5 py-0 h-4 border-[#dadce0] bg-[#f8f9fa] text-[#5f6368]"
                    >
                      {cam.src}
                    </Badge>
                    <span className="text-[11px] text-[#5f6368] font-medium">
                      {cam.views ? cam.views.length : 1} Kamera
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#202124] leading-snug mb-1">
                    {cam.name}
                  </h4>
                  {cam.sub && (
                    <p className="text-[11px] text-[#5f6368] line-clamp-2 mb-2.5 leading-relaxed">
                      {cam.sub}
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="w-full h-8 text-xs bg-[#1a73e8] hover:bg-[#174ea6] text-white font-medium flex items-center justify-center gap-1.5 rounded-full shadow-xs"
                    onClick={() => onSelectCamera(cam)}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Tonton Live
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
