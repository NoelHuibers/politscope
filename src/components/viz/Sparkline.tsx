type Props = {
  values: readonly number[];
  width?: number;
  height?: number;
  color?: string;
};

export function Sparkline({ values, width = 100, height = 22, color = "var(--accent)" }: Props) {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const X = (i: number) => (i / (values.length - 1)) * width;
  const Y = (v: number) => height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
  const last = values[values.length - 1] ?? 0;
  const d = `M ${values.map((v, i) => `${X(i)} ${Y(v)}`).join(" L ")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} stroke={color} strokeWidth={1.4} fill="none" />
      <circle cx={X(values.length - 1)} cy={Y(last)} r={1.8} fill={color} />
    </svg>
  );
}
