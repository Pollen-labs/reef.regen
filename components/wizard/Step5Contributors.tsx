"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Textarea from "@/components/ui/Textarea";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";

const MAX_NAMES = 100;

function parseContributorsDetailed(input: string) {
  const rawTokens = input.split(/[;,\n]/g);
  let skipped = 0;
  // Normalize tokens
  const cleaned = rawTokens
    .map((t) => t.trim().replace(/\s+/g, " "))
    .filter((t) => {
      if (t.length === 0) { skipped++; return false; }
      if (t.length < 2 || t.length > 80) { skipped++; return false; }
      return true;
    });
  // Dedupe case-insensitively while preserving original casing
  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const name of cleaned) {
    const key = name.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(name);
    }
  }
  const limited = deduped.slice(0, MAX_NAMES);
  const limitedDropped = deduped.length - limited.length;
  return { list: limited, skipped, limitedDropped };
}

export function Step5Contributors() {
  const { contributors = [], contributorsInput = "", setPatch } = useAttestationWizard();
  const [value, setValue] = useState<string>(contributorsInput || "");
  const [meta, setMeta] = useState<{ count: number; skipped: number; limitedDropped: number }>({ count: contributors.length || 0, skipped: 0, limitedDropped: 0 });
  const timerRef = useRef<any>(null);

  // Hydrate on mount: ensure contributors derive from input if missing
  useEffect(() => {
    if ((contributors?.length ?? 0) === 0 && (contributorsInput || "").trim().length > 0) {
      const { list, skipped, limitedDropped } = parseContributorsDetailed(contributorsInput);
      setPatch({ contributors: list });
      setMeta({ count: list.length, skipped, limitedDropped });
    }
    // keep local value synced with store
    setValue(contributorsInput || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On input change: update input immediately, then debounce parse → contributors
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const onChange = (v: string) => {
    setValue(v);
    setPatch({ contributorsInput: v });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const { list, skipped, limitedDropped } = parseContributorsDetailed(v);
      setPatch({ contributors: list });
      setMeta({ count: list.length, skipped, limitedDropped });
    }, 250);
  };

  const onBlur = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const { list, skipped, limitedDropped } = parseContributorsDetailed(value);
    setPatch({ contributors: list });
    setMeta({ count: list.length, skipped, limitedDropped });
  };

  const countLabel = useMemo(() => {
    const n = meta.count;
    return n === 1 ? "1 contributor added" : `${n} contributors added`;
  }, [meta.count]);

  return (
    <div className="flex flex-col gap-12">
      <div className="w-full max-w-[960px] flex flex-col items-center gap-3 mx-auto">
        <div className="text-center text-white text-5xl md:text-7xl font-black leading-[1.04]">Lastly, give contributors credits.</div>
        <div className="text-center text-vulcan-100 text-2xl font-light leading-9">Let the community and public know who were involved in the action(s)</div>
      </div>

      <section className="grid gap-3 items-center text-center w-full max-w-[600px] mx-auto">
        <h3 className="text-vulcan-700 text-2xl font-black">Contributors</h3>
        <Textarea
          aria-label="Contributors"
          aria-describedby="contributors-help"
          placeholder="Jane Smith, John Smith, John Doe …"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="min-h-[140px] max-h-[360px] resize-y rounded-lg outline outline-1 outline-vulcan-700 placeholder:text-white/50"
        />
        <div className="text-vulcan-300 text-sm mt-1 pb-4">
          {countLabel}
          {meta.skipped > 0 && <span> • We skipped {meta.skipped} empty/invalid name{meta.skipped > 1 ? 's' : ''}</span>}
          {meta.limitedDropped > 0 && <span> • Limit reached (showing first {MAX_NAMES})</span>}
        </div>
      </section>
    </div>
  );
}

