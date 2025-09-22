
import React from 'react';

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: string;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'bg-primary',
  height = 'h-3',
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${color} ${height} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clampedValue}%` }}
      ></div>
    </div>
  );
};

export default ProgressBar;