"use client";

import { useMemo, useState } from "react";

type Props = {
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  copyable?: boolean;
  shorten?: boolean; // show as 0x1234…12345 for long hex values
  external?: boolean; // show external link arrow icon on action
};

function shortenHex(value: string): string {
  if (!value) return "";
  if (value.startsWith("0x") && value.length > 14) {
    const head = value.slice(0, 6); // 0x + 4
    const tail = value.slice(-5); // last 5
    return `${head}…${tail}`;
  }
  if (value.length > 28) {
    return `${value.slice(0, 10)}…${value.slice(-7)}`;
  }
  return value;
}

export default function IdentifierBar({ label, value, actionLabel = "View", onAction, className, copyable = false, shorten = false, external = false }: Props) {
  const [copied, setCopied] = useState(false);
  const display = useMemo(() => (shorten ? shortenHex(value) : value), [shorten, value]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  }

  return (
    <div className={`w-full rounded-2xl bg-vulcan-700 outline outline-1 outline-vulcan-700 px-2 md:px-4 py-3 flex items-center gap-2 ${className || ''}`}>
      <div className="flex-1 min-w-0">
        <div className="text-vulcan-300 text-sm">{label}</div>
        <div className="text-white text-base font-bold truncate" title={value}>{display || '—'}</div>
      </div>
      {copyable && (
        <button
          type="button"
          aria-label="Copy identifier"
          onClick={handleCopy}
          className="p-2 rounded-xl bg-vulcan-700 hover:bg-vulcan-600 text-flamingo-200"
          title={copied ? 'Copied' : 'Copy'}
        >
          <i className="f7-icons text-base">{copied ? 'checkmark_alt' : 'doc_on_doc'}</i>
        </button>
      )}
      <button
        type="button"
        onClick={onAction}
        className="px-4 py-2 rounded-2xl bg-vulcan-700 hover:bg-vulcan-600 text-flamingo-200 font-bold gap-2"
      >
        {actionLabel}
        {external && <i className="f7-icons text-base">arrow_up_right</i>}
      </button>
    </div>
  );
}
