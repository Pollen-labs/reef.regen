"use client";
import { useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export type StackedSegment = { label: string; value: number; color: string };

type Props = {
  segments: StackedSegment[];
  height?: number;
  barRadius?: number;
  padding?: number;
  barThickness?: number;
  tooltipMode?: "count" | "countPercent";
  className?: string;
  showLegend?: boolean; // render simple legend below the bar
  legendInside?: boolean; // place legend inside the fixed-height area
  legendHeight?: number; // px reserved when legendInside=true
  legendFontSize?: number; // px font size for legend text
  legendLineHeight?: number; // px line-height for legend text
  legendGap?: number; // px gap between legend items
  legendItemGap?: number; // px gap inside legend item (dot/text/value)
  legendIconSize?: number; // px square size for the colored dot
};

export default function StackedBarChartJS({
  segments,
  height = 128,
  barRadius = 8,
  padding = 0,
  barThickness = 28,
  tooltipMode = "count",
  className,
  showLegend = true,
  legendInside = true,
  legendHeight = 24,
  legendFontSize = 12,
  legendLineHeight = 16,
  legendGap = 12,
  legendItemGap = 6,
  legendIconSize = 10,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const total = Math.max(1, segments.reduce((s, d) => s + (d.value || 0), 0));

  const lastIdx = Math.max(0, segments.length - 1);
  const datasets = segments.map((s, i) => {
    // Round only the outer ends: first dataset gets left radii, last gets right radii
    const r = barRadius;
    const rad = i === 0
      ? { topLeft: r, bottomLeft: r, topRight: 0, bottomRight: 0 }
      : i === lastIdx
        ? { topLeft: 0, bottomLeft: 0, topRight: r, bottomRight: r }
        : { topLeft: 0, bottomLeft: 0, topRight: 0, bottomRight: 0 };

    return {
      label: s.label,
      data: [s.value],
      backgroundColor: s.color,
      borderWidth: 0,
      borderSkipped: false as any,
      borderRadius: rad as any,
      barThickness,
      maxBarThickness: barThickness,
    };
  });

  const chartData = {
    labels: ["Site types"],
    datasets,
  };

  const externalTooltip = (ctx: any) => {
    const { chart, tooltip } = ctx;
    const parent: HTMLElement | null = containerRef.current;
    if (!parent) return;
    let el = parent.querySelector<HTMLDivElement>("[data-rr-tooltip]");
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-rr-tooltip", "");
      el.className = "pointer-events-none absolute z-10 bg-vulcan-900/80 text-white rounded-xl shadow-xl px-3 py-2";
      el.style.opacity = "0";
      parent.appendChild(el);
      parent.style.position = parent.style.position || "relative";
    }
    if (tooltip.opacity === 0) {
      el.style.opacity = "0";
      return;
    }
    const dp = tooltip.dataPoints?.[0];
    const label = dp?.dataset?.label ?? "";
    const val = Number(dp?.raw ?? 0);
    const pct = Math.round((val / total) * 100);
    const second = tooltipMode === "count" ? String(val) : `${val} (${pct}%)`;
    el.innerHTML = `<div class=\"text-sm leading-tight\">${label}</div><div class=\"text-base font-black leading-6\">${second}</div>`;
    const { offsetLeft, offsetTop } = chart.canvas;
    const left = offsetLeft + tooltip.caretX;
    const top = offsetTop + tooltip.caretY;
    el.style.opacity = "1";
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.transform = "translate(-50%, -140%)";
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    scales: {
      x: { stacked: true, display: false },
      y: { stacked: true, display: false },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false, external: externalTooltip },
    },
    layout: { padding },
  };

  const legendH = showLegend && legendInside ? legendHeight : 0; // px reserved for legend inside

  return (
    <div ref={containerRef} className={[className || "", "w-full relative"].join(" ")} style={{ height }}>
      <div style={{ height: Math.max(0, height - legendH) }}>
        <Bar data={chartData} options={options} />
      </div>
      {showLegend && (
        legendInside ? (
          <div
            className="absolute left-0 right-0 flex flex-wrap items-center"
            style={{ bottom: 4, gap: legendGap, fontSize: legendFontSize, lineHeight: `${legendLineHeight}px` }}
          >
            {segments.map((s) => (
              <div key={s.label} className="inline-flex items-center" style={{ gap: legendItemGap }}>
                <span className="inline-block rounded" style={{ background: s.color, width: legendIconSize, height: legendIconSize }} />
                <span className="text-white/90">{s.label}</span>
                <span className="text-white font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex flex-wrap items-center"
            style={{ marginTop: 12, gap: legendGap, fontSize: legendFontSize + 2, lineHeight: `${legendLineHeight}px` }}
          >
            {segments.map((s) => (
              <div key={s.label} className="inline-flex items-center" style={{ gap: legendItemGap + 2 }}>
                <span className="inline-block rounded" style={{ background: s.color, width: legendIconSize + 2, height: legendIconSize + 2 }} />
                <span className="text-white/90">{s.label}</span>
                <span className="text-white font-bold">{s.value}</span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
