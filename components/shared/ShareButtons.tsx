"use client";

import { useCallback } from "react";

type Props = {
  url: string;
  text?: string;
  variant?: "buttons" | "icons";
  className?: string;
  // Icon variant customization (when variant="icons")
  iconSize?: "sm" | "md" | "lg"; // 40 | 48 | 56 px
  iconRoundedClassName?: string;    // e.g., "rounded-lg"
  iconBgClassName?: string;         // e.g., "bg-white text-black"
  iconsGapClassName?: string;       // e.g., "gap-2"
  iconClassName?: string;           // extra class on each icon
};

export default function ShareButtons({ url, text, variant = "buttons", className, iconSize = "md", iconRoundedClassName, iconBgClassName, iconsGapClassName, iconClassName }: Props) {
  const defaultText = "I have attested my coral restoration action on the Reef.Regen";
  const shareText = text && text.trim().length > 0 ? text : defaultText;

  const twitter = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}&hashtags=ReefRegen`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  const onNativeShare = useCallback(() => {
    const shareData = { title: "Reef.Regen", text: shareText, url } as any;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share(shareData).catch(() => {
        window.open(twitter, '_blank', 'noopener,noreferrer');
      });
    } else {
      window.open(twitter, '_blank', 'noopener,noreferrer');
    }
  }, [shareText, url, twitter]);

  if (variant === "icons") {
    const sizeCls = iconSize === "sm" ? "h-10 w-10" : iconSize === "lg" ? "h-14 w-14" : "h-12 w-12";
    const iconBase = `inline-flex ${sizeCls} items-center justify-center ${iconRoundedClassName || 'rounded-md'} ${iconBgClassName || 'bg-white text-black'} hover:opacity-90 ${iconClassName || ''}`;
    return (
      <div className={`flex items-center ${iconsGapClassName || 'gap-3'} ${className || ''}`}> 
        <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" title="Share on Facebook" className={iconBase}>
          {/* f7 icon */}
          <i className="f7-icons text-[20px]" aria-hidden>logo_facebook</i>
        </a>
        <a href={li} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" title="Share on LinkedIn" className={iconBase}>
          {/* f7 icon */}
          <i className="f7-icons text-[20px]" aria-hidden>logo_linkedin</i>
        </a>
        <a href={twitter} target="_blank" rel="noopener noreferrer" aria-label="Share on X" title="Share on X" className={iconBase}>
          {/* X icon (placeholder SVG) – can replace with provided asset */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3 3h4.6l5.2 6.9L18 3h3l-7.3 9.6L21.5 21h-4.6l-5.4-7.2L7 21H4l7.6-10.1L3 3z"/>
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className={"flex items-center gap-3 " + (className || "")}> 
      <button
        type="button"
        onClick={onNativeShare}
        className="px-6 py-3 bg-orange rounded-2xl text-white font-bold"
      >
        Share this action
      </button>
      <a
        href={twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-3 rounded-2xl outline outline-2 outline-vulcan-600 text-white hover:bg-white/5"
      >
        Share on X
      </a>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="px-5 py-3 rounded-2xl outline outline-2 outline-vulcan-600 text-white hover:bg-white/5"
      >
        Facebook
      </a>
    </div>
  );
}
