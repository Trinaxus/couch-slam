import { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
}

export function YouTubePlayer({ videoId, className = '' }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!videoId) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    (window as any).onYouTubeIframeAPIReady = () => {
      if (playerRef.current) {
        new (window as any).YT.Player(playerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
          },
        });
      }
    };

    return () => {
      delete (window as any).onYouTubeIframeAPIReady;
    };
  }, [videoId]);

  if (!videoId) {
    return (
      <div className={`bg-slate-800 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-slate-400">Kein YouTube-Video verknüpft</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={playerRef} className="w-full h-full" />
    </div>
  );
}
