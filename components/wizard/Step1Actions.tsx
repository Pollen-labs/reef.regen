"use client";

import { useEffect, useMemo, useState } from "react";
import { useAttestationWizard } from "@/lib/wizard/attestationWizardStore";

type RegenOption = {
  id: number;
  name: string;
  category?: string | null;
  description?: string | null;
};

const GROUP_ORDER = [
  "Asexual Propagation",
  "Sexual Propagation",
  "Substratum Enhancement",
];

export function Step1Actions() {
  const { reefRegenActions, setPatch } = useAttestationWizard();
  const [options, setOptions] = useState<RegenOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/regen-types");
        const j = await res.json().catch(() => ({}));
        if (!cancelled) setOptions(Array.isArray(j.items) ? j.items : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const grouped = useMemo(() => {
    const groups = new Map<string, RegenOption[]>();
    for (const o of options) {
      const g = o.category || "Other";
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(o);
    }
    // sort within group by name
    for (const arr of groups.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
    // order groups
    const ordered: { title: string; items: RegenOption[] }[] = [];
    for (const title of GROUP_ORDER) if (groups.has(title)) ordered.push({ title, items: groups.get(title)! });
    // append any others
    for (const [title, items] of groups) if (!GROUP_ORDER.includes(title)) ordered.push({ title, items });
    return ordered;
  }, [options]);

  const toggle = (name: string) => {
    const selected = reefRegenActions.includes(name);
    const next = selected
      ? reefRegenActions.filter((n) => n !== name)
      : [...reefRegenActions, name];
    setPatch({ reefRegenActions: next });
  };

  if (loading && options.length === 0) {
    return <div className="text-white/70">Loading actions…</div>;
  }

  return (
    <div className="self-stretch flex flex-col items-center gap-10">
      {grouped.map((group) => (
        <div key={group.title} className="self-stretch flex flex-col items-center gap-6">
          <div className="w-full max-w-[728px] flex flex-col items-start gap-4">
            <div className="text-vulcan-700 text-3xl font-black leading-9 tracking-tight">{group.title}</div>
          </div>
          <div className="self-stretch grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {group.items.map((opt) => {
              const isSelected = reefRegenActions.includes(opt.name);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggle(opt.name)}
                  className={
                    "text-left relative p-6 rounded-3xl inline-flex flex-col justify-start items-start gap-1 min-h-[9rem] shadow transition-colors " +
                    (isSelected ? "bg-orange text-white" : "bg-vulcan-200 text-black")
                  }
                >
                  <div className="pt-2 inline-flex justify-start items-start gap-4 w-full">
                    <div className="flex-1 text-3xl font-black leading-9 tracking-tight">
                      {opt.name}
                    </div>
                    <div className="w-6 h-6 relative">
                      <i className={"f7-icons text-2xl absolute -top-2 right-0 " + (isSelected ? "text-white" : "text-black/60")}>
                        {isSelected ? "checkmark_alt_circle_fill" : "circle"}
                      </i>
                    </div>
                  </div>
                  {opt.description && (
                    <div className={"text-base font-light leading-6 " + (isSelected ? "text-white" : "text-black/80")}> 
                      {opt.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
