import { useEffect, useState, useMemo } from "react";
import { CctvCamera, CctvApiResponse } from "@/types/cctv";
import { FloatingHeader } from "@/components/FloatingHeader";
import { CameraSheet } from "@/components/CameraSheet";
import { CctvMap } from "@/components/CctvMap";
import { CctvPlayer } from "@/components/CctvPlayer";
import { RefreshCw } from "lucide-react";

export function App() {
  const [cameras, setCameras] = useState<CctvCamera[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedCamera, setSelectedCamera] = useState<CctvCamera | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Fetch CCTV cameras from Express API
  useEffect(() => {
    async function loadCameras() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/cctv");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: CctvApiResponse = await res.json();
        setCameras(data.cameras || []);
      } catch (err) {
        console.error("Failed to load CCTV data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadCameras();
  }, []);

  // Filter cameras by search query and category
  const filteredCameras = useMemo(() => {
    let list = cameras;

    if (selectedSource !== "all") {
      list = list.filter((cam) => cam.src === selectedSource);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (cam) =>
          cam.name?.toLowerCase().includes(q) ||
          cam.sub?.toLowerCase().includes(q) ||
          cam.id?.toLowerCase().includes(q),
      );
    }

    return list;
  }, [cameras, selectedSource, searchQuery]);

  const handleSelectCamera = (cam: CctvCamera) => {
    setSelectedCamera(cam);
    setIsPlayerOpen(true);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung geolokasi");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        let nearest: CctvCamera | null = null;
        let minDist = Infinity;

        cameras.forEach((c) => {
          const dist = Math.hypot(c.lat - latitude, c.lng - longitude);
          if (dist < minDist) {
            minDist = dist;
            nearest = c;
          }
        });

        if (nearest) {
          setSelectedCamera(nearest);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation error:", err.message);
        alert("Tidak dapat mendeteksi lokasi: " + err.message);
      },
      { timeout: 10000 },
    );
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-50 font-sans antialiased text-slate-900">
      {/* Floating Island Header */}
      <FloatingHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedSource={selectedSource}
        onSelectSource={setSelectedSource}
        totalCameras={cameras.length}
        filteredCount={filteredCameras.length}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        onOpenList={() => setIsSheetOpen(true)}
      />

      {/* Main Fullscreen Interactive Map */}
      <main className="w-full h-full">
        {isLoading ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/85 backdrop-blur-xs text-slate-600 gap-2.5">
            <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
            <p className="text-xs font-medium text-slate-700">
              Menyiapkan peta kamera...
            </p>
          </div>
        ) : (
          <CctvMap
            cameras={filteredCameras}
            onSelectCamera={handleSelectCamera}
            selectedCamera={selectedCamera}
          />
        )}
      </main>

      {/* Camera List Drawer (Sheet) */}
      <CameraSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        cameras={filteredCameras}
        onSelectCamera={handleSelectCamera}
        selectedCameraId={selectedCamera?.id}
      />

      {/* Video Player Modal (Dialog) */}
      <CctvPlayer
        camera={selectedCamera}
        isOpen={isPlayerOpen}
        onClose={() => setIsPlayerOpen(false)}
      />
    </div>
  );
}

export default App;
