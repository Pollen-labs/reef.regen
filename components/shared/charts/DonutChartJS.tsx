"use client";
import { useRef, useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export type DonutDatum = { label: string; count: number; color: string; category?: string };

// Convert hex colors to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export default function DonutChartJS({
  data,
  tooltipMode = "countPercent",
  height,
  className,
  defaultOpacity = 1.0, // Default opacity (0-1)
  hoverOpacity = 0.7,    // Hover opacity (0-1)
  fadeOthersOnHover = false, // If true, fade non-hovered segments when hovering
}: {
  data: DonutDatum[];
  tooltipMode?: "count" | "countPercent";
  height?: number; // optional fixed px height; otherwise fills parent
  className?: string; // allow parent-driven sizing via CSS
  defaultOpacity?: number; // Opacity for non-hovered segments (0-1)
  hoverOpacity?: number;   // Opacity for hovered segment (0-1)
  fadeOthersOnHover?: boolean; // Fade non-hovered segments when hovering
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Store chart instance for fadeOthersOnHover
  const chartInstanceRef = useRef<ChartJS<"doughnut"> | null>(null);
  const total = Math.max(1, data.reduce((s, d) => s + (d.count || 0), 0));
  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.count);
  
  const baseColors = useMemo(() => data.map((d) => d.color), [data]);
  const colors = useMemo(() => baseColors.map((c) => hexToRgba(c, defaultOpacity)), [baseColors, defaultOpacity]);
  const hoverColors = useMemo(() => baseColors.map((c) => hexToRgba(c, hoverOpacity)), [baseColors, hoverOpacity]);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors,
        borderWidth: 0,
      },
    ],
  }), [labels, values, colors, hoverColors]);

  const externalTooltip = (ctx: any) => {
    const { chart, tooltip } = ctx;
    // Store chart instance for fadeOthersOnHover
    if (fadeOthersOnHover) {
      chartInstanceRef.current = chart;
    }
    const parent: HTMLElement | null = containerRef.current;
    if (!parent) return;
    let el = parent.querySelector<HTMLDivElement>("[data-rr-tooltip]");
    if (!el) {
      el = document.createElement("div");
      el.setAttribute("data-rr-tooltip", "");
      el.className = "pointer-events-none absolute z-10 bg-vulcan-900/80 text-white rounded-xl shadow-xl px-2 py-2";
      el.style.opacity = "0";
      parent.appendChild(el);
      parent.style.position = parent.style.position || "relative";
    }
    if (tooltip.opacity === 0) {
      el.style.opacity = "0";
      return;
    }
    const dp = tooltip.dataPoints?.[0];
    const label = dp?.label ?? "";
    const val = Number(dp?.raw ?? 0);
    const sum = data.reduce((s, d) => s + (d.count || 0), 0) || 1;
    const pct = Math.round((val / sum) * 100);
    const idx = dp?.dataIndex ?? 0;
    const cat = data[idx]?.category;
    const line2 = tooltipMode === "count" ? String(val) : `${val} (${pct}%)`;
    const catHtml = cat ? `<div class=\"text-xs text-vulcan-300 leading-5\">${cat}</div>` : "";
    el.innerHTML = `${catHtml}<div class=\"text-sm leading-tight\">${label}</div><div class=\"text-base font-black leading-7\">${line2}</div>`;
    const { offsetLeft, offsetTop } = chart.canvas;
    const left = offsetLeft + tooltip.caretX;
    const top = offsetTop + tooltip.caretY;
    el.style.opacity = "1";
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.transform = "translate(-50%, -120%)";
  };

  const options: any = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%" as const,
    onHover: fadeOthersOnHover ? (event: any, activeElements: any[]) => {
      const chart = chartInstanceRef.current;
      if (!chart) return;
      
      const dataset = chart.data.datasets[0];
      if (activeElements.length > 0) {
        // Hovering: fade non-hovered segments, highlight hovered
        const hoveredIndex = activeElements[0].index;
        const newColors = baseColors.map((c, idx) => 
          hexToRgba(c, idx === hoveredIndex ? hoverOpacity : defaultOpacity * 0.3)
        );
        dataset.backgroundColor = newColors;
        chart.update('none'); // 'none' prevents animation
      } else {
        // Not hovering: restore default opacity
        dataset.backgroundColor = colors;
        chart.update('none');
      }
    } : undefined,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltip,
      },
    },
  }), [fadeOthersOnHover, baseColors, hoverOpacity, defaultOpacity, colors]);

  const style: React.CSSProperties = {
    width: "100%",
    height: height ? height : "100%",
    position: "relative",
  };
  
  return (
    <div ref={containerRef} style={style} className={className}>
      <Doughnut 
        data={chartData} 
        options={options} 
      />
    </div>
  );
}
