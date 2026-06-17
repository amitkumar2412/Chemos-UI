// Reusable chart placeholder — swap with real chart library when ready
interface ChartPlaceholderProps {
  title: string;
  size?: 'sm' | 'md';
}

export default function ChartPlaceholder({ title, size = 'md' }: ChartPlaceholderProps) {
  return (
    <div className={`db-chart-placeholder db-chart-${size}`}>
      <div className="db-chart-placeholder-icon">📊</div>
      <div className="db-chart-placeholder-label">{title}</div>
      <div className="db-chart-placeholder-hint">Connect chart library to render</div>
    </div>
  );
}
