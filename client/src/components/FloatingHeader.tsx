import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Crosshair,
  Video,
  List,
  X,
} from 'lucide-react';

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
  { id: 'all', label: 'Semua' },
  { id: 'dki', label: 'Jakarta' },
  { id: 'tol', label: 'Jalan Tol' },
  { id: 'bks', label: 'Bekasi' },
  { id: 'bgr', label: 'Bogor' },
  { id: 'tgr', label: 'Tangerang' },
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
    <header className="fixed top-3 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-20 pointer-events-none">
      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-2.5 shadow-2xl pointer-events-auto flex flex-col gap-2 transition-all">
        {/* Main Bar */}
        <div className="flex items-center gap-2">
          {/* Logo Badge */}
          <div className="flex items-center gap-2 px-1">
            <div className="h-7 w-7 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20 shrink-0">
              <Video className="w-3.5 h-3.5" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-100 leading-tight">
                CCTV Live
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari jalan, tol, atau lokasi..."
              className="pl-8 pr-7 h-8 text-xs bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 rounded-lg focus-visible:ring-sky-500 focus-visible:border-sky-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action: Open Camera List Drawer */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 gap-1.5 shrink-0 hover:border-sky-500/40"
            onClick={onOpenList}
            title="Buka daftar kamera"
          >
            <List className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline text-xs">Daftar</span>
            <Badge variant="sky" className="px-1 py-0 text-[10px] h-4">
              {filteredCount}
            </Badge>
          </Button>

          {/* Action: Locate Me */}
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 hover:border-sky-500/40"
            onClick={onLocateMe}
            disabled={isLocating}
            title="Lokasi Saya"
          >
            <Crosshair
              className={`w-3.5 h-3.5 text-slate-300 ${
                isLocating ? 'animate-spin text-sky-400' : ''
              }`}
            />
          </Button>
        </div>

        {/* Filter Pills with Sky Theme */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
          {CATEGORIES.map((cat) => {
            const isActive = selectedSource === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectSource(cat.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-sky-500 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
