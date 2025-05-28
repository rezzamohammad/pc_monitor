import React from 'react';
import { usePowerData } from '../context/PowerDataContext';
import PowerUsageChart from '../components/charts/PowerUsageChart';
import PowerGauge from '../components/charts/PowerGauge';
import ComponentUsageBar from '../components/charts/ComponentUsageBar';
import CurrentCostCard from '../components/cards/CurrentCostCard';
import { Clock, Battery, Zap, TrendingUp } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentPower, powerHistory, components, electricityRate } = usePowerData();

  // Derived values
  const currentPowerWatts = currentPower?.power_watts || 0;
  const totalAccumulatedKwh = currentPower?.accumulated_kwh || 0;
  const estimatedDailyCost = totalAccumulatedKwh * electricityRate / 24 * 24; // Extrapolate to 24 hours
  
  // Get the main components
  const cpuComponent = components.find(c => c.id === 'cpu');
  const gpuComponent = components.find(c => c.id === 'gpu');
  const ramComponent = components.find(c => c.id === 'ram');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Power Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Power</h3>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{currentPowerWatts.toFixed(1)}</span>
              <span className="ml-1 text-lg text-gray-500 dark:text-gray-400">W</span>
            </div>
            <Zap className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        {/* Total Energy */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Energy</h3>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{totalAccumulatedKwh.toFixed(3)}</span>
              <span className="ml-1 text-lg text-gray-500 dark:text-gray-400">kWh</span>
            </div>
            <Battery className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Estimated Daily Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Est. Daily Cost</h3>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{estimatedDailyCost.toFixed(2)}</span>
              <span className="ml-1 text-lg text-gray-500 dark:text-gray-400">¥</span>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Session Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Session Duration</h3>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">10:32:15</span>
            </div>
            <Clock className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Power Usage Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Power Usage History</h2>
        <div className="h-64">
          <PowerUsageChart data={powerHistory.slice(-60)} />
        </div>
      </div>

      {/* Component Power Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Current Power</h2>
          <div className="flex justify-center">
            <PowerGauge value={currentPowerWatts} maxValue={300} />
          </div>
        </div>

        <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Component Distribution</h2>
          <div className="space-y-4">
            {cpuComponent && (
              <ComponentUsageBar 
                label={cpuComponent.name}
                value={cpuComponent.power_watts}
                maxValue={cpuComponent.tdp_watts || 150}
                color="blue"
                percentage={cpuComponent.utilization || 0}
                temperature={cpuComponent.temperature}
              />
            )}
            {gpuComponent && (
              <ComponentUsageBar 
                label={gpuComponent.name}
                value={gpuComponent.power_watts}
                maxValue={gpuComponent.tdp_watts || 200}
                color="green"
                percentage={gpuComponent.utilization || 0}
                temperature={gpuComponent.temperature}
              />
            )}
            {ramComponent && (
              <ComponentUsageBar 
                label={ramComponent.name}
                value={ramComponent.power_watts}
                maxValue={ramComponent.tdp_watts || 15}
                color="purple"
                percentage={ramComponent.utilization || 0}
                temperature={ramComponent.temperature}
              />
            )}
          </div>
        </div>
      </div>

      {/* Cost Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <CurrentCostCard 
          accumulatedKwh={totalAccumulatedKwh} 
          electricityRate={electricityRate} 
        />
      </div>
    </div>
  );
};

export default Dashboard;