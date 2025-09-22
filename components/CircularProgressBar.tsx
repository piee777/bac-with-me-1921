import React from 'react';

interface CircularProgressBarProps {
  progress: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
}

const CircularProgressBar: React.FC<CircularProgressBarProps> = ({
  progress,
  size = 100,
  strokeWidth = 10,
  color = '#14b8a6', // primary
  trackColor,
  label
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-slate-200 dark:text-slate-700"
          stroke={trackColor || "currentColor"}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          className="transition-all duration-500 ease-out"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
         <span className="text-2xl font-extrabold text-slate-800 dark:text-white" style={{ fontSize: size / 4.5 }}>
            {Math.round(progress)}%
         </span>
         {label && <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>}
      </div>
    </div>
  );
};

export default CircularProgressBar;