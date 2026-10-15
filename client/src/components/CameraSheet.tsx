import React from 'react';
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
import { Button } from '@/components/ui/button';
import { Video, MapPin, Play } from 'lucide-react';

interface CameraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cameras: CctvCamera[];
  onSelectCamera: (cam: CctvCamera) => void;
  selectedCameraId?: string;
}

export const CameraSheet: React.FC<CameraSheetProps> = ({
  isOpen,
  onClose,
  cameras,
  onSelectCamera,
  selectedCameraId,
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md p-0 flex flex-col bg-slate-950 border-slate-800"
      >
        <SheetHeader className="p-4 border-b border-slate-800/80 pr-10">
          <div className="flex items-center gap-2">
            <SheetTitle className="text-sm font-semibold text-slate-100">
              Daftar Kamera CCTV
            </SheetTitle>
            <Badge variant="sky" className="text-[10px] h-4 px-1.5">
              {cameras.length} Titik
            </Badge>
          </div>
          <SheetDescription className="text-xs text-slate-400">
            Pilih kamera untuk memutar live streaming dan memusatkan peta.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 p-2">
          {cameras.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada kamera yang cocok dengan pencarian Anda.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {cameras.map((cam) => {
                const isSelected = selectedCameraId === cam.id;
                return (
                  <div
                    key={cam.id}
                    className={`group p-2.5 rounded-xl border transition-all text-left flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-slate-900 border-sky-500/50 shadow-xs'
                        : 'bg-slate-950/60 hover:bg-slate-900/80 border-slate-800/60 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge
                          variant={isSelected ? 'sky' : 'outline'}
                          className="uppercase text-[9px] px-1 py-0 h-4 font-mono"
                        >
                          {cam.src}
                        </Badge>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Video className="w-2.5 h-2.5" />
                          {cam.views?.length || 1} Sudut
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1 group-hover:text-sky-300 transition-colors">
                        {cam.name}
                      </div>
                      {cam.sub && (
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                          <span className="truncate">{cam.sub}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={isSelected ? 'default' : 'secondary'}
                      className={`h-7 px-2 shrink-0 text-[11px] ${
                        isSelected ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''
                      }`}
                      onClick={() => {
                        onSelectCamera(cam);
                        onClose();
                      }}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Tonton
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
