"use client";
import { Line } from "react-chartjs-2";
import { useMemo } from "react";
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
  height = 140,
  className,
  lineColor = "#F6A17B", // flamingo
  fillColor = "rgba(246,161,123,0.20)",
  xLabelFormat = "raw",
  pointRadius = 4,
  pointHoverRadius = 5,
  borderWidth = 2,
  xTickSize = 14,
  yTickSize = 14,
  yStep = 1,
  paddingLeft = 28,
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
}) {
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
        pointBorderColor: "#2C2D3A",
        borderWidth,
      },
    ],
  }), [labels.join("|"), values.join("|"), lineColor, fillColor]);

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
        enabled: true,
        callbacks: {
          title: (items: any[]) => {
            if (!items?.length) return "";
            const idx = items[0].dataIndex ?? 0;
            const raw = rawLabels[idx] || labels[idx] || "";
            return xLabelFormat === "month" ? formatMonthYear(raw) : String(raw);
          },
        },
      },
    },
    layout: { padding: { left: paddingLeft, right: 8, top: 8, bottom: 12 } },
  };

  return (
    <div className={[className || "", "w-full"].join(" ")} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
