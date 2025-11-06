"use client";
import { Line } from "react-chartjs-2";
import { useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Filler);

export type LinePoint = { label: string; value: number };

export default function LineChartJS({
  data,
  height = 160,
  className,
  lineColor = "#F6A17B", // flamingo
  fillColor = "rgba(246,161,123,0.20)",
  xLabelFormat = "raw",
  pointRadius = 6,
  pointHoverRadius = 8,
  borderWidth = 4,
  xTickSize = 14,
  yTickSize = 14,
  yStep = 1,
  paddingLeft = 0,
  pointBorderColor = "#F6A17B",
  pointBorderWidth = 2,
}: {
  data: LinePoint[];
  height?: number;
  className?: string;
  lineColor?: string;
  fillColor?: string;
  xLabelFormat?: "raw" | "month";
  pointRadius?: number;
  pointHoverRadius?: number;
  borderWidth?: number;
  xTickSize?: number;
  yTickSize?: number;
  yStep?: number;
  paddingLeft?: number;
  pointBorderColor?: string;
  pointBorderWidth?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rawLabels = data.map((d) => d.label);
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  function formatMonthLabel(s: string): string {
    // Expect YYYY-MM; fallback to raw
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return s;
    const idx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
    // Use full-ish month name as per design (e.g., Jun, Jul, Aug)
    return monthNames[idx];
  }
  function formatMonthYear(s: string): string {
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return s;
    const idx = Math.max(0, Math.min(11, parseInt(m[2], 10) - 1));
    return `${monthNames[idx]}, ${m[1]}`;
  }
  const labels = rawLabels.map((s) => (xLabelFormat === "month" ? formatMonthLabel(s) : s));
  const values = data.map((d) => d.value);

  const chartData = useMemo(() => ({
    labels,
    datasets: [
      {
        data: values,
        borderColor: lineColor,
        backgroundColor: fillColor,
        fill: true,
        tension: 0.35,
        pointRadius,
        pointHoverRadius,
        pointBackgroundColor: lineColor,
        pointBorderColor,
        pointBorderWidth,
        borderWidth,
      },
    ],
  }), [labels.join("|"), values.join("|"), lineColor, fillColor, pointBorderColor, pointBorderWidth, pointRadius, pointHoverRadius, borderWidth]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#B8BBCC", font: { size: xTickSize }, maxRotation: 0, autoSkip: false },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.12)" },
        ticks: { color: "#B8BBCC", font: { size: yTickSize }, padding: 10, stepSize: yStep },
        beginAtZero: true,
        precision: 0,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: false,
        external: (ctx: any) => {
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
          const idx = dp?.dataIndex ?? 0;
          const raw = rawLabels[idx] || labels[idx] || "";
          const title = xLabelFormat === "month" ? formatMonthYear(raw) : String(raw);
          const val = Number(dp?.raw ?? 0);
          el.innerHTML = `<div class=\"text-sm leading-tight\">${title}</div><div class=\"text-base font-black leading-7\">${val}</div>`;
          const { offsetLeft, offsetTop } = chart.canvas;
          const left = offsetLeft + tooltip.caretX;
          const top = offsetTop + tooltip.caretY;
          el.style.opacity = "1";
          el.style.left = `${left}px`;
          el.style.top = `${top}px`;
          el.style.transform = "translate(-50%, -120%)";
        },
      },
    },
    layout: { padding: { left: paddingLeft, right: 8, top: 8, bottom: 12 } },
  };

  return (
    <div ref={containerRef} className={[className || "", "w-full"].join(" ")} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
