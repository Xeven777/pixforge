interface Props {
  value: number; // 0–100
  className?: string;
}

export default function ProgressBar({ value, className = "" }: Props) {
  return (
    <div className={`h-1.5 bg-surface-3 rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-accent rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}
