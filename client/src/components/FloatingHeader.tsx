import React from "react";
import { Button } from "@/components/ui/button";
import { Search, Crosshair, List, X, Camera } from "lucide-react";

interface FloatingHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSource: string;
  onSelectSource: (src: string) => void;
  totalCameras: number;
  filteredCount: number;
  onLocateMe: () => void;
  isLocating: boolean;
  onOpenList: () => void;
}

const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "dki", label: "Jakarta" },
  { id: "tol", label: "Tol" },
  { id: "bks", label: "Bekasi" },
  { id: "bgr", label: "Bogor" },
  { id: "tgr", label: "Tangerang" },
];

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedSource,
  onSelectSource,
  filteredCount,
  onLocateMe,
  isLocating,
  onOpenList,
}) => {
  return (
    <header className="fixed top-3 left-3 right-3 sm:left-4 sm:w-[480px] sm:max-w-[calc(100vw-32px)] z-20 pointer-events-none">
      <div className="bg-white rounded-2xl border border-[#dadce0] shadow-md shadow-black/10 p-2 pointer-events-auto flex flex-col gap-2 transition-all">
        {/* Google Maps Search Bar */}
        <div className="flex items-center gap-1 px-1">
          {/* Google Camera / Menu Icon */}
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#1a73e8] shrink-0 hover:bg-[#f1f3f4] transition-colors cursor-pointer"
            onClick={onOpenList}
            title="Buka Daftar Kamera"
          >
            <Camera className="w-5 h-5" />
          </div>

          {/* Search Input Field */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari jalan, tol, atau CCTV..."
              className="w-full h-9 bg-transparent border-none outline-none text-sm text-[#202124] placeholder-[#5f6368] font-normal pr-6 truncate"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#5f6368] hover:text-[#202124] p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Magnifier Button */}
          <button
            type="button"
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors shrink-0 cursor-pointer"
            title="Cari"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-[#dadce0] my-auto mx-0.5"></div>

          {/* Locate Me Button */}
          <button
            type="button"
            className="h-8 w-8 rounded-full flex items-center justify-center text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] transition-colors shrink-0 cursor-pointer"
            onClick={onLocateMe}
            disabled={isLocating}
            title="Lokasi Anda"
          >
            <Crosshair
              className={`w-4 h-4 ${
                isLocating ? "animate-spin text-[#1a73e8]" : ""
              }`}
            />
          </button>

          {/* List Drawer Button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-[#f1f3f4] rounded-lg shrink-0 gap-1 text-xs font-medium"
            onClick={onOpenList}
            title="Buka daftar kamera"
          >
            <List className="w-4 h-4" />
            <span className="text-[11px] font-semibold text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.2 rounded-full">
              {filteredCount}
            </span>
          </Button>
        </div>

        {/* Google Maps Style Category Filter Chips with Smooth Scroll & Right Padding */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 px-1 border-t border-[#f1f3f4] scroll-smooth">
          {CATEGORIES.map((cat) => {
            const isActive = selectedSource === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectSource(cat.id)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium shrink-0 ${
                  isActive
                    ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#aecbfa] font-semibold shadow-xs"
                    : "bg-white text-[#3c4043] border border-[#dadce0] hover:bg-[#f1f3f4]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          {/* Trailing space for smooth scroll end */}
          <div className="w-2 shrink-0"></div>
        </div>
      </div>
    </header>
  );
};
