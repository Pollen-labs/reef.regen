"use client";

type Item = { label: string; count: number; color: string };

export default function BubbleChart({ data }: { data: Item[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const minSize = 64; // px
  const maxSize = 120; // px

  // Sort descending for nicer layout
  const items = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="w-full flex flex-wrap gap-4 items-center">
      {items.map((d, i) => {
        const size = Math.round(minSize + ((d.count / max) * (maxSize - minSize)));
        return (
          <div key={`${d.label}-${i}`} className="relative rounded-full flex items-center justify-center"
            style={{ width: size, height: size, background: d.color }}
            title={`${d.label}: ${d.count}`}
          >
            <div className="text-center leading-tight">
              <div className="text-white text-2xl font-black">{d.count}</div>
              <div className="text-white text-sm font-bold truncate max-w-[90%] mx-auto">{d.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

