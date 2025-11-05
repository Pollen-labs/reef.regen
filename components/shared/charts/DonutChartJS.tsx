"use client";
import { useRef } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export type DonutDatum = { label: string; count: number; color: string; category?: string };

export default function DonutChartJS({
  data,
  tooltipMode = "countPercent",
  height,
  className,
}: {
  data: DonutDatum[];
  tooltipMode?: "count" | "countPercent";
  height?: number; // optional fixed px height; otherwise fills parent
  className?: string; // allow parent-driven sizing via CSS
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const total = Math.max(1, data.reduce((s, d) => s + (d.count || 0), 0));
  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.count);
  const colors = data.map((d) => d.color);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };

  const externalTooltip = (ctx: any) => {
    const { chart, tooltip } = ctx;
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

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%" as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: externalTooltip,
      },
    },
  };

  const style: React.CSSProperties = {
    width: "100%",
    height: height ? height : "100%",
    position: "relative",
  };
  return (
    <div ref={containerRef} style={style} className={className}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}
