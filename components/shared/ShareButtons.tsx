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

  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}&hashtags=ReefRegen`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  const li = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent("Reef.Regen")}&summary=${encodeURIComponent(shareText)}`;

  const onNativeShare = useCallback(() => {
    const shareData = { title: "Reef.Regen", text: shareText, url } as any;
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share(shareData).catch(() => {
        window.open(x, '_blank', 'noopener,noreferrer');
      });
    } else {
      window.open(x, '_blank', 'noopener,noreferrer');
    }
  }, [shareText, url, x]);

  if (variant === "icons") {
    const sizeCls = iconSize === "sm" ? "h-10 w-10" : iconSize === "lg" ? "h-14 w-14" : "h-12 w-12";
    const iconBase = `inline-flex ${sizeCls} items-center justify-center ${iconRoundedClassName || 'rounded-md'} ${iconBgClassName || 'bg-white text-black'} hover:opacity-90 ${iconClassName || ''}`;
    return (
      <div className={`flex items-center ${iconsGapClassName || 'gap-3'} ${className || ''}`}> 
        <a href={fb} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" title="Share on Facebook" className={iconBase}>
          {/* Facebook logo */}
          <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M28.6895 22.2136L29.726 15.3883H23.242V10.9612C23.242 9.09345 24.1461 7.27184 27.0502 7.27184H30V1.46117C30 1.46117 27.3242 1 24.7671 1C19.4247 1 15.9361 4.26966 15.9361 10.1864V15.3883H10V22.2136H15.9361V38.7141C17.1279 38.9032 18.347 39 19.589 39C20.8311 39 22.0502 38.9032 23.242 38.7141V22.2136H28.6895Z" fill="currentColor"/>
          </svg>
        </a>
        <a href={li} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" title="Share on LinkedIn" className={iconBase}>
          {/* LinkedIn logo */}
          <svg width="22" height="22" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <g transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
              <path d="M 1.48 29.91 h 18.657 v 60.01 H 1.48 V 29.91 z M 10.809 0.08 c 5.963 0 10.809 4.846 10.809 10.819 c 0 5.967 -4.846 10.813 -10.809 10.813 C 4.832 21.712 0 16.866 0 10.899 C 0 4.926 4.832 0.08 10.809 0.08" fill="currentColor"/>
              <path d="M 31.835 29.91 h 17.89 v 8.206 h 0.255 c 2.49 -4.72 8.576 -9.692 17.647 -9.692 C 86.514 28.424 90 40.849 90 57.007 V 89.92 H 71.357 V 60.737 c 0 -6.961 -0.121 -15.912 -9.692 -15.912 c -9.706 0 -11.187 7.587 -11.187 15.412 V 89.92 H 31.835 V 29.91 z" fill="currentColor"/>
            </g>
          </svg>
        </a>
        <a href={x} target="_blank" rel="noopener noreferrer" aria-label="Share on X" title="Share on X" className={iconBase}>
          {/* X logo */}
          <svg width="22" height="22" viewBox="0 0 1200 1227" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z" fill="currentColor"/>
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
        href={x}
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
