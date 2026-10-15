import React, { useState, useMemo } from 'react';
import { CctvCamera } from '@/types/cctv';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Video, MapPin, Play, Search, X } from 'lucide-react';

interface CameraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: CctvCamera[];
  onSelectCamera: (cam: CctvCamera) => void;
  selectedCameraId?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'dki', label: 'Jakarta' },
  { id: 'tol', label: 'Tol' },
  { id: 'bks', label: 'Bekasi' },
  { id: 'bgr', label: 'Bogor' },
  { id: 'tgr', label: 'Tangerang' },
];

export const CameraSheet: React.FC<CameraSheetProps> = ({
  isOpen,
  onClose,
  cameras,
  onSelectCamera,
  selectedCameraId,
}) => {
  const [sheetSearch, setSheetSearch] = useState('');
  const [sheetCategory, setSheetCategory] = useState('all');

  // Filter cameras based on search and category inside sheet
  const displayCameras = useMemo(() => {
    let list = cameras;

    if (sheetCategory !== 'all') {
      list = list.filter((c) => c.src === sheetCategory);
    }

    if (sheetSearch.trim()) {
      const q = sheetSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.sub?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [cameras, sheetCategory, sheetSearch]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col h-full bg-white border-[#dadce0] text-[#202124] shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-4 pb-2 border-b-0 pr-10 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-base font-bold text-[#202124]">
              Titik Kamera CCTV
            </SheetTitle>
            <Badge className="text-[11px] h-5 px-2 bg-[#e8f0fe] text-[#1a73e8] border border-[#aecbfa] font-semibold">
              {displayCameras.length} Titik
            </Badge>
          </div>
          <SheetDescription className="text-xs text-[#5f6368]">
            Pilih kamera untuk memutar live streaming dan memusatkan peta.
          </SheetDescription>
        </SheetHeader>

        {/* Dedicated Search Box inside Drawer */}
        <div className="px-4 pb-3 pt-1 shrink-0 flex flex-col gap-2 border-b border-[#dadce0] bg-white">
          {/* Search Input Bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#1a73e8]" />
            <input
              type="text"
              value={sheetSearch}
              onChange={(e) => setSheetSearch(e.target.value)}
              placeholder="Cari jalan, tol, atau lokasi..."
              className="w-full h-9 pl-9 pr-8 bg-[#f8f9fa] hover:bg-[#f1f3f4] focus:bg-white border border-[#dadce0] focus:border-[#1a73e8] rounded-xl text-xs text-[#202124] placeholder-[#5f6368] outline-none transition-colors"
            />
            {sheetSearch && (
              <button
                type="button"
                onClick={() => setSheetSearch('')}
                className="absolute right-2.5 text-[#5f6368] hover:text-[#202124] p-0.5 cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Chips inside Drawer */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
            {CATEGORIES.map((cat) => {
              const isActive = sheetCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSheetCategory(cat.id)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full whitespace-nowrap transition-all cursor-pointer font-medium shrink-0 ${
                    isActive
                      ? 'bg-[#e8f0fe] text-[#1a73e8] border border-[#aecbfa] font-semibold'
                      : 'bg-[#f8f9fa] text-[#5f6368] border border-[#dadce0] hover:bg-[#e8eaed]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Card List with Bottom Padding */}
        <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
          <div className="p-3 pb-16 flex flex-col gap-2.5">
            {displayCameras.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center gap-2 text-xs text-[#5f6368]">
                <Search className="w-6 h-6 text-[#dadce0]" />
                <p>Tidak ada kamera yang cocok dengan kata kunci <strong>"{sheetSearch}"</strong>.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSheetSearch('');
                    setSheetCategory('all');
                  }}
                  className="text-xs text-[#1a73e8] font-medium hover:underline mt-1"
                >
                  Reset Pencarian
                </button>
              </div>
            ) : (
              displayCameras.map((cam) => {
                const isSelected = selectedCameraId === cam.id;
                return (
                  <div
                    key={cam.id}
                    onClick={() => {
                      onSelectCamera(cam);
                      onClose();
                    }}
                    className={`group p-3 rounded-xl border transition-all text-left flex items-center justify-between gap-3 cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#e8f0fe] border-[#aecbfa] shadow-xs'
                        : 'bg-white hover:bg-[#f8f9fa] border-[#dadce0]'
                    }`}
                  >
                    {/* Left Text Info */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant="outline"
                          className={`uppercase text-[10px] px-1.5 py-0 h-4 font-mono font-medium ${
                            isSelected
                              ? 'bg-[#e8f0fe] text-[#1a73e8] border-[#aecbfa]'
                              : 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]'
                          }`}
                        >
                          {cam.src}
                        </Badge>
                        <span className="text-[11px] text-[#5f6368] flex items-center gap-1 font-medium">
                          <Video className="w-3 h-3 text-[#5f6368]" />
                          {cam.views?.length || 1} Sudut
                        </span>
                      </div>

                      {/* Title: 2 lines allowed so names aren't cut off */}
                      <div className="text-xs font-bold text-[#202124] line-clamp-2 leading-snug group-hover:text-[#1a73e8] transition-colors">
                        {cam.name}
                      </div>

                      {/* Location Subtitle: clean 2 lines */}
                      {cam.sub && (
                        <div className="text-[11px] text-[#5f6368] line-clamp-2 mt-1 flex items-start gap-1 leading-relaxed">
                          <MapPin className="w-3 h-3 text-[#5f6368] shrink-0 mt-0.5" />
                          <span>{cam.sub}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Play Action Circle */}
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-110 ${
                        isSelected
                          ? 'bg-[#1a73e8] text-white'
                          : 'bg-[#f1f3f4] text-[#5f6368] group-hover:bg-[#1a73e8] group-hover:text-white'
                      }`}
                      title="Putar Live"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
