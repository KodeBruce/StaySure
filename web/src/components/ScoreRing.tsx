import React from 'react';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 48 }) => {
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--line)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--green)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: `${size * 0.3}px`, fontWeight: 800, color: 'var(--navy)' }}>
        {score}%
      </span>
    </div>
  );
};

