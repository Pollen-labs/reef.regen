"use client";
import { Bubble } from "react-chartjs-2";
import {
  Chart as ChartJS,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export type BubbleDatum = { label: string; count: number; color: string };

export default function BubbleChartJS({ data }: { data: BubbleDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.count || 0));
  const minR = 18;
  const maxR = 46;

  const ds = data.map((d, i) => ({
    label: d.label,
    // leave extra space on both ends to avoid clipping
    data: [{ x: i + 1, y: 1, r: Math.round(minR + ((d.count / max) * (maxR - minR))) }],
    backgroundColor: d.color,
    borderWidth: 0,
    hoverBackgroundColor: d.color,
    metaCount: d.count as unknown as number,
  }));

  const chartData = { datasets: ds };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { display: false, min: -0.5, max: data.length + 1.5 },
      y: { display: false, min: 0, max: 2 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${ctx.dataset.metaCount ?? 0}`,
        },
      },
    },
    layout: { padding: 12 },
  };

  return (
    <div style={{ width: "100%", height: 160 }}>
      <Bubble data={chartData} options={options} />
    </div>
  );
}
