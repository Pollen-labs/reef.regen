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
}: {
  data: LinePoint[];
  height?: number;
  className?: string;
  lineColor?: string;
  fillColor?: string;
}) {
  const labels = data.map((d) => d.label);
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
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: lineColor,
        pointBorderColor: "#2C2D3A",
        borderWidth: 2,
      },
    ],
  }), [labels.join("|"), values.join("|"), lineColor, fillColor]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#9AA0B4" },
      },
      y: {
        grid: { color: "rgba(255,255,255,0.08)" },
        ticks: { color: "#9AA0B4" },
        beginAtZero: true,
        precision: 0,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className={[className || "", "w-full"].join(" ")} style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
