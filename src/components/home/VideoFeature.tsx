"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Play } from "lucide-react";

interface VideoFeatureProps {
  videoId: string;
  title: string;
  poster?: string;
}

/**
 * 视频特性组件
 *
 * 自动播放策略：
 * - 使用 IntersectionObserver 监测视频区域进入视口时自动加载并播放 iframe
 *   （autoplay=1&mute=1&loop=1，静音是浏览器自动播放策略的必要条件）
 * - 同时保留点击播放按钮作为后备：用户点击后立即加载 iframe 播放
 * - 进入视口前显示主题封面 poster + 播放按钮，避免首屏即加载重型 iframe
 */
export function VideoFeature({
  videoId,
  title,
  poster = "/images/hero.webp",
}: VideoFeatureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activated, setActivated] = useState(false);

  const watchUrl = useMemo(
    () => `https://www.youtube.com/watch?v=${videoId}`,
    [videoId],
  );

  // autoplay + mute + loop（loop 需 playlist 参数指向同 videoId 才生效）
  const embedUrl = useMemo(
    () =>
      `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&playsinline=1&rel=0`,
    [videoId],
  );

  const thumbUrl = useMemo(
    () => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    [videoId],
  );

  useEffect(() => {
    if (activated) return;
    const node = containerRef.current;
    if (!node) return;

    // 不支持 IntersectionObserver 的环境回退为点击播放
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActivated(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [activated]);

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ paddingBottom: "56.25%" }}
      >
        {activated ? (
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setActivated(true)}
            aria-label={`Play ${title}`}
            className="group absolute inset-0 h-full w-full"
          >
            {/* 封面图：优先 YouTube 缩略图，poster 作为底图兜底 */}
            <img
              src={poster}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
            <img
              src={thumbUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            {/* 暗化遮罩 + 播放按钮 */}
            <span className="absolute inset-0 bg-black/40 transition-opacity group-hover:opacity-80" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[hsl(var(--nav-theme))] shadow-lg transition-transform group-hover:scale-110 md:h-20 md:w-20">
                <Play className="h-7 w-7 fill-white text-white md:h-9 md:w-9" />
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
        >
          Watch on YouTube
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
