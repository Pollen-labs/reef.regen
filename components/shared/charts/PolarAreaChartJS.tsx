"use client";
import { PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(RadialLinearScale, ArcElement, Tooltip, Legend);

export type PolarDatum = { label: string; value: number; color: string };

export default function PolarAreaChartJS({ data, height = 160 }: { data: PolarDatum[]; height?: number }) {
  const labels = data.map((d) => d.label);
  const values = data.map((d) => d.value);
  const colors = data.map((d) => d.color);

  const chartData = {
    labels,
    datasets: [
      {
        label: "",
        data: values,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        grid: { display: false },
        angleLines: { display: false },
        ticks: { display: false },
        pointLabels: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: (items: any[]) => items?.[0]?.label || "",
          label: (item: any) => String(item?.raw ?? 0),
        },
      },
    },
  };

  return (
    <div style={{ width: "100%", height }}>
      <PolarArea data={chartData} options={options} />
    </div>
  );
}

