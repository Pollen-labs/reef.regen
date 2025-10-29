/**
 * DonutChart — Simple SVG donut chart
 *
 * Displays a donut chart for regen action breakdown.
 * Uses SVG circles with stroke-dasharray for segments.
 */
interface DonutChartProps {
  data: { label: string; count: number; color: string }[];
  size?: number;
  strokeWidth?: number;
}

export default function DonutChart({
  data,
  size = 96,
  strokeWidth = 16
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.count, 0);

  let currentOffset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />

      {/* Data segments */}
      {data.map((item, index) => {
        const percentage = (item.count / total) * 100;
        const segmentLength = (percentage / 100) * circumference;
        const offset = currentOffset;
        currentOffset += segmentLength;

        return (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        );
      })}
    </svg>
  );
}
