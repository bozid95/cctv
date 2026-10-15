import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { CctvCamera } from '@/types/cctv';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ExternalLink,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Tv,
} from 'lucide-react';

interface CctvPlayerProps {
  camera: CctvCamera | null;
  isOpen: boolean;
  onClose: () => void;
}

const isEmbedUrl = (url: string) => {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtube-nocookie.com') ||
    url.includes('youtu.be') ||
    url.endsWith('.html') ||
    url.includes('.html?') ||
    url.includes('stream.html')
  );
};

export const CctvPlayer: React.FC<CctvPlayerProps> = ({
  camera,
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [useIframe, setUseIframe] = useState(false);
  const [useProxy, setUseProxy] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeView = camera?.views?.[currentViewIndex] || null;
  const viewTitle = activeView ? activeView[0] : 'Kamera 1';
  const rawStreamUrl = activeView ? activeView[1] : '';
  const embedUrl = activeView ? activeView[2] : '';

  useEffect(() => {
    setCurrentViewIndex(0);
    const shouldEmbed = isEmbedUrl(rawStreamUrl);
    setUseIframe(shouldEmbed);
    setUseProxy(true);
    setErrorMessage(null);
    setIsLoading(true);
  }, [camera]);

  useEffect(() => {
    if (isEmbedUrl(rawStreamUrl)) {
      setUseIframe(true);
      setIsLoading(false);
    }
  }, [currentViewIndex, rawStreamUrl]);

  useEffect(() => {
    if (!isOpen || !camera || !rawStreamUrl || useIframe) return;

    let hls: Hls | null = null;
    let isCancelled = false;
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setErrorMessage(null);

    async function initStream() {
      let finalStreamUrl = rawStreamUrl;

      // Special handling for Jasa Marga Tol cameras (fetch fresh dynamic token)
      if (camera && camera.src === 'tol' && embedUrl) {
        try {
          let idRuas = '';
          try {
            idRuas = new URL(embedUrl).searchParams.get('id_ruas') || '';
          } catch {}

          if (idRuas) {
            const tokenRes = await fetch(
              `/api/cctv/live-token?r=${encodeURIComponent(idRuas)}&n=${encodeURIComponent(camera.name)}&v=${encodeURIComponent(viewTitle)}`
            );
            if (tokenRes.ok) {
              const tokenData = await tokenRes.json();
              if (tokenData.hls) {
                finalStreamUrl = tokenData.hls;
              }
            }
          }
        } catch (e) {
          console.warn('Could not refresh Jasa Marga token:', e);
        }
      }

      if (isCancelled) return;

      const targetUrl = useProxy
        ? `/api/proxy/stream?url=${encodeURIComponent(finalStreamUrl)}`
        : finalStreamUrl;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 30,
        });

        hls.loadSource(targetUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isCancelled) return;
          setIsLoading(false);
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (isCancelled) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                if (embedUrl) {
                  setUseIframe(true);
                  setIsLoading(false);
                } else {
                  setErrorMessage('Kamera offline atau koneksi server gagal.');
                  setIsLoading(false);
                }
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                if (embedUrl) {
                  setUseIframe(true);
                  setIsLoading(false);
                } else {
                  setErrorMessage('Format streaming tidak didukung saat ini.');
                  setIsLoading(false);
                }
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = targetUrl;
        video.addEventListener('loadedmetadata', () => {
          if (isCancelled) return;
          setIsLoading(false);
          video.play().catch(() => {});
        });
        video.addEventListener('error', () => {
          if (isCancelled) return;
          if (embedUrl) {
            setUseIframe(true);
          } else {
            setErrorMessage('Gagal memutar video di browser ini.');
          }
          setIsLoading(false);
        });
      }
    }

    initStream();

    return () => {
      isCancelled = true;
      if (hls) {
        hls.destroy();
      }
    };
  }, [isOpen, camera, currentViewIndex, useProxy, useIframe, rawStreamUrl, embedUrl, viewTitle]);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      } else {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    }
  };

  if (!camera) return null;

  const currentEmbedSource = isEmbedUrl(rawStreamUrl) ? rawStreamUrl : embedUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-slate-950 border-slate-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 pr-12 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="sky" className="uppercase text-[9px] px-1.5 py-0 h-4 font-mono">
              {camera.src}
            </Badge>
            <DialogTitle className="text-sm font-semibold text-slate-100 line-clamp-1">
              {camera.name}
            </DialogTitle>
          </div>
          {camera.sub && (
            <DialogDescription className="text-xs text-slate-400 line-clamp-1">
              {camera.sub}
            </DialogDescription>
          )}
        </div>

        {/* Video Player */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Live Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[10px] font-medium text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            LIVE
          </div>

          {/* Fullscreen Button */}
          <div className="absolute top-3 right-3 z-20">
            <Button
              size="icon"
              variant="outline"
              className="h-7 w-7 rounded-lg bg-slate-950/80 backdrop-blur-md border-slate-800 text-slate-300 hover:text-sky-300 hover:border-sky-500/40"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>

          {/* Loading */}
          {isLoading && !errorMessage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-slate-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-400" />
              <p className="text-xs text-slate-300">Memuat tayangan...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/95 text-slate-400 gap-3 p-6 text-center">
              <AlertCircle className="w-8 h-8 text-amber-500/80" />
              <div className="text-xs font-medium text-slate-300">{errorMessage}</div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setErrorMessage(null);
                    setIsLoading(true);
                  }}
                >
                  <RefreshCw className="w-3 h-3 mr-1" /> Coba Lagi
                </Button>
                {currentEmbedSource && (
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                    onClick={() => {
                      setUseIframe(true);
                      setErrorMessage(null);
                      setIsLoading(false);
                    }}
                  >
                    <Tv className="w-3 h-3 mr-1" /> Mode Portal
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Stream Video or Iframe */}
          {useIframe && currentEmbedSource ? (
            <iframe
              src={currentEmbedSource}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              title={camera.name}
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              muted
              controls
            />
          )}
        </div>

        {/* Footer: Multi-view angle tabs & external links */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          {camera.views && camera.views.length > 1 ? (
            <Tabs
              value={String(currentViewIndex)}
              onValueChange={(val) => {
                const idx = Number(val);
                setCurrentViewIndex(idx);
                const shouldEmbed = isEmbedUrl(camera.views[idx]?.[1]);
                setUseIframe(shouldEmbed);
              }}
            >
              <TabsList className="h-7 bg-slate-900 border-slate-800">
                {camera.views.map((v, idx) => (
                  <TabsTrigger
                    key={idx}
                    value={String(idx)}
                    className="text-[11px] px-2.5 py-0.5 h-6 data-[state=active]:bg-sky-500 data-[state=active]:text-white"
                  >
                    {v[0] || `Sudut ${idx + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              {viewTitle}
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {currentEmbedSource && !isEmbedUrl(rawStreamUrl) && (
              <button
                type="button"
                onClick={() => setUseIframe(!useIframe)}
                className="text-xs text-slate-400 hover:text-sky-300 transition-colors cursor-pointer"
              >
                {useIframe ? 'Mode HLS' : 'Mode Portal'}
              </button>
            )}
            {embedUrl && (
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-slate-400 hover:text-sky-400 transition-colors gap-1"
              >
                <span>Situs Resmi</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
