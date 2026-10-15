import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Use state callback ref so mounting in portal triggers immediate stream initialization
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [useIframe, setUseIframe] = useState(false);
  const [useProxy, setUseProxy] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeView = camera?.views?.[currentViewIndex] || null;
  const viewTitle = activeView ? activeView[0] : 'Kamera 1';
  const rawStreamUrl = activeView ? activeView[1] : '';
  const embedUrl = activeView ? activeView[2] : '';

  // Callback ref for <video> element
  const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
    if (node !== null) {
      setVideoElement(node);
    }
  }, []);

  // Reset state when camera changes
  useEffect(() => {
    setCurrentViewIndex(0);
    const shouldEmbed = isEmbedUrl(rawStreamUrl);
    setUseIframe(shouldEmbed);
    setUseProxy(true);
    setErrorMessage(null);
    setIsLoading(true);
  }, [camera]);

  // Handle embed URLs
  useEffect(() => {
    if (isEmbedUrl(rawStreamUrl)) {
      setUseIframe(true);
      setIsLoading(false);
    }
  }, [currentViewIndex, rawStreamUrl]);

  // Stream initialization: triggers automatically when videoElement is ready
  useEffect(() => {
    if (!isOpen || !camera || !rawStreamUrl || useIframe || !videoElement) return;

    let hls: Hls | null = null;
    let isCancelled = false;

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

      if (isCancelled || !videoElement) return;

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
        hls.attachMedia(videoElement);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (isCancelled) return;
          videoElement.play().catch(() => {
            videoElement.muted = true;
            videoElement.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.FRAG_BUFFERED, () => {
          if (!isCancelled) setIsLoading(false);
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          if (!isCancelled) setIsLoading(false);
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
      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        videoElement.src = targetUrl;
        videoElement.addEventListener('loadeddata', () => {
          if (!isCancelled) setIsLoading(false);
        });
        videoElement.addEventListener('loadedmetadata', () => {
          if (isCancelled) return;
          videoElement.play().catch(() => {});
        });
        videoElement.addEventListener('error', () => {
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
  }, [isOpen, camera, currentViewIndex, useProxy, useIframe, rawStreamUrl, embedUrl, viewTitle, videoElement]);

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
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white border-[#dadce0] text-[#202124] rounded-2xl shadow-2xl">
        {/* Google Maps Style Header */}
        <div className="p-4 border-b border-[#dadce0] pr-12 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="uppercase text-[10px] px-2 py-0.5 h-5 font-mono font-bold bg-[#f1f3f4] text-[#3c4043] border-[#dadce0]">
              {camera.src}
            </Badge>
            <DialogTitle className="text-sm sm:text-base font-bold text-[#202124] line-clamp-1">
              {camera.name}
            </DialogTitle>
          </div>
          {camera.sub && (
            <DialogDescription className="text-xs text-[#5f6368] line-clamp-1">
              {camera.sub}
            </DialogDescription>
          )}
        </div>

        {/* Video Player Container */}
        <div
          ref={containerRef}
          className="relative w-full aspect-video bg-[#000000] flex items-center justify-center overflow-hidden"
        >
          {/* Live Badge */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#ea4335] animate-pulse"></span>
            LIVE
          </div>

          {/* Fullscreen Button */}
          <div className="absolute top-3 right-3 z-20">
            <button
              type="button"
              className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Instant Disappearing Loading Overlay */}
          {isLoading && !errorMessage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] text-white gap-2 transition-opacity duration-150 pointer-events-none">
              <RefreshCw className="w-6 h-6 animate-spin text-[#1a73e8]" />
              <p className="text-xs text-[#dadce0] font-medium">Menghubungkan ke siaran...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 text-[#202124] gap-3 p-6 text-center">
              <AlertCircle className="w-9 h-9 text-[#ea4335]" />
              <div className="text-xs font-semibold text-[#202124] max-w-sm">{errorMessage}</div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-[#dadce0] text-[#3c4043] hover:bg-[#f1f3f4]"
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
                    className="bg-[#1a73e8] hover:bg-[#174ea6] text-white rounded-full font-medium"
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
              ref={videoRefCallback}
              className="w-full h-full object-contain"
              playsInline
              autoPlay
              muted
              controls
              onPlaying={() => setIsLoading(false)}
              onPlay={() => setIsLoading(false)}
              onCanPlay={() => setIsLoading(false)}
              onTimeUpdate={() => {
                if (videoElement && videoElement.currentTime > 0) {
                  setIsLoading(false);
                }
              }}
            />
          )}
        </div>

        {/* Footer: Multi-view angle tabs & external links */}
        <div className="p-3 bg-white border-t border-[#dadce0] flex flex-wrap items-center justify-between gap-2">
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
              <TabsList className="h-8 bg-[#f1f3f4] border-none rounded-full p-1">
                {camera.views.map((v, idx) => (
                  <TabsTrigger
                    key={idx}
                    value={String(idx)}
                    className="text-[11px] px-3 py-1 h-6 rounded-full data-[state=active]:bg-[#1a73e8] data-[state=active]:text-white font-medium"
                  >
                    {v[0] || `Kamera ${idx + 1}`}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : (
            <span className="text-xs text-[#5f6368] font-medium">
              {viewTitle}
            </span>
          )}

          <div className="flex items-center gap-3 ml-auto">
            {currentEmbedSource && !isEmbedUrl(rawStreamUrl) && (
              <button
                type="button"
                onClick={() => setUseIframe(!useIframe)}
                className="text-xs text-[#1a73e8] hover:underline font-medium cursor-pointer"
              >
                {useIframe ? 'Mode HLS' : 'Mode Portal'}
              </button>
            )}
            {embedUrl && (
              <a
                href={embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-[#1a73e8] hover:underline font-medium gap-1"
              >
                <span>Buka Sumber</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
