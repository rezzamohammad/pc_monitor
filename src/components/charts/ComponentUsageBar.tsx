import React from 'react';
import { Thermometer } from 'lucide-react';

interface ComponentUsageBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  percentage: number;
  temperature: number | null;
}

const ComponentUsageBar: React.FC<ComponentUsageBarProps> = ({
  label,
  value,
  maxValue,
  color,
  percentage,
  temperature
}) => {
  const powerPercentage = (value / maxValue) * 100;
  
  const getColorClass = () => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500'
    };
    return colors[color];
  };

  const getTemperatureColor = () => {
    if (!temperature) return 'text-gray-400';
    if (temperature < 60) return 'text-green-500';
    if (temperature < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">{label}</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {value.toFixed(1)}W / {maxValue}W
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({percentage.toFixed(0)}%)
            </span>
            
            {temperature && (
              <div className={`flex items-center ${getTemperatureColor()}`}>
                <Thermometer className="h-3 w-3 mr-1" />
                <span className="text-sm">{temperature.toFixed(1)}°C</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
        <div 
          className={`absolute top-0 left-0 h-4 rounded-full ${getColorClass()} transition-all duration-500 ease-out`}
          style={{ width: `${powerPercentage}%` }}
        ></div>
        
        <div 
          className="absolute top-0 left-0 h-4 border-r-2 border-white dark:border-gray-900 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ComponentUsageBar;