'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercent?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 85) return '#00D68F';
  if (score >= 70) return '#FFB800';
  if (score >= 50) return '#FF6B2C';
  return '#FF3D3D';
}

export default function ScoreRing({ score, size = 80, strokeWidth = 6, label, showPercent = true }: ScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--c-raised)"
          strokeWidth={strokeWidth}
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      {showPercent && (
        <div className="absolute" style={{ marginTop: size / 2 - 10 }}>
          <span className="text-base font-bold" style={{ color }}>{score}</span>
        </div>
      )}
      {label && <span className="text-xs text-slate-400 text-center">{label}</span>}
    </div>
  );
}

interface ScoreRingInlineProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function ScoreRingInline({ score, size = 80, strokeWidth = 6 }: ScoreRingInlineProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--c-raised)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <span className="relative text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}
