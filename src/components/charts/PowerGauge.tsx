import React from 'react';

interface PowerGaugeProps {
  value: number;
  maxValue: number;
}

const PowerGauge: React.FC<PowerGaugeProps> = ({ value, maxValue }) => {
  const percentage = (value / maxValue) * 100;
  const radius = 80;
  const strokeWidth = 15;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color gradient based on percentage
  let color = '#10B981'; // Green
  if (percentage > 60) color = '#FBBF24'; // Yellow
  if (percentage > 80) color = '#EF4444'; // Red

  return (
    <div className="relative flex flex-col items-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          stroke="#1F2937"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        
        {/* Progress circle */}
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      
      {/* Gauge text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value.toFixed(1)}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">Watts</span>
        <span className="text-xs mt-1">{percentage.toFixed(0)}% of {maxValue}W</span>
      </div>
    </div>
  );
};

export default PowerGauge;