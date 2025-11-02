/**
 * DonutChart — SVG donut with straight segment joins and lightweight tooltip
 */
interface DonutChartProps {
  data: { label: string; count: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  onSegmentClick?: (item: { label: string; count: number; color: string }, index: number) => void;
}

export default function DonutChart({
  data,
  size = 96,
  strokeWidth = 16,
  className,
  onSegmentClick,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, data.reduce((sum, item) => sum + item.count, 0));

  let currentOffset = 0;
  const gapPx = 1; // small separator to avoid anti-aliasing overlaps

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />

        {data.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const segmentLength = (percentage / 100) * circumference;
          const seg = Math.max(0, segmentLength - gapPx);
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
              strokeDasharray={`${seg} ${circumference - seg}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              shapeRendering="geometricPrecision"
              className="transition-all duration-300 cursor-pointer"
              onClick={() => onSegmentClick?.(item, index)}
            >
              <title>{`${item.label}: ${item.count} (${percentage.toFixed(0)}%)`}</title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
