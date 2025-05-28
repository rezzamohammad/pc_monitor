import React from 'react';
import { DollarSign, Clock } from 'lucide-react';

interface CurrentCostCardProps {
  accumulatedKwh: number;
  electricityRate: number;
}

const CurrentCostCard: React.FC<CurrentCostCardProps> = ({ 
  accumulatedKwh, 
  electricityRate 
}) => {
  const totalCost = accumulatedKwh * electricityRate;
  
  // Calculate estimated costs
  const hourlyRate = (accumulatedKwh / 10) * electricityRate; // Assuming 10 hours of data
  const dailyEstimate = hourlyRate * 24;
  const weeklyEstimate = dailyEstimate * 7;
  const monthlyEstimate = dailyEstimate * 30;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Electricity Cost</h2>
        <div className="flex items-center text-yellow-500">
          <DollarSign className="h-5 w-5 mr-1" />
          <span>{electricityRate.toFixed(2)} ¥/kWh</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Current Session</div>
          <div className="text-2xl font-bold mt-1">{totalCost.toFixed(2)} ¥</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {accumulatedKwh.toFixed(3)} kWh used
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Daily Estimate</div>
          <div className="text-2xl font-bold mt-1">{dailyEstimate.toFixed(2)} ¥</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(dailyEstimate / electricityRate).toFixed(3)} kWh/day
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Weekly Estimate</div>
          <div className="text-2xl font-bold mt-1">{weeklyEstimate.toFixed(2)} ¥</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(weeklyEstimate / electricityRate).toFixed(3)} kWh/week
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="text-sm text-gray-500 dark:text-gray-400">Monthly Estimate</div>
          <div className="text-2xl font-bold mt-1">{monthlyEstimate.toFixed(2)} ¥</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(monthlyEstimate / electricityRate).toFixed(3)} kWh/month
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
        <Clock className="h-4 w-4 mr-1" />
        <span>Estimates based on current session power consumption</span>
      </div>
    </div>
  );
};

export default CurrentCostCard;