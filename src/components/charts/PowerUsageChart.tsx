import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { PowerData } from '../../types';

interface PowerUsageChartProps {
  data: PowerData[];
}

const PowerUsageChart: React.FC<PowerUsageChartProps> = ({ data }) => {
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const formattedData = data.map(item => ({
    ...item,
    time: formatXAxis(item.timestamp),
    cpu: item.components.cpu_utilization * (125/100), // Scale CPU utilization to power
    gpu: item.components.gpu_utilization * (170/100), // Scale GPU utilization to power
    other: item.power_watts - 
           (item.components.cpu_utilization * (125/100)) - 
           (item.components.gpu_utilization * (170/100))
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 shadow rounded">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-500">
            CPU: {payload[0]?.value.toFixed(1)} W ({(payload[0]?.value / 125 * 100).toFixed(1)}%)
          </p>
          <p className="text-green-500">
            GPU: {payload[1]?.value.toFixed(1)} W ({(payload[1]?.value / 170 * 100).toFixed(1)}%)
          </p>
          <p className="text-gray-500">
            Other: {payload[2]?.value.toFixed(1)} W
          </p>
          <p className="font-semibold text-yellow-500">
            Total: {payload[3]?.value.toFixed(1)} W
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={formattedData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
        <XAxis 
          dataKey="time" 
          tick={{ fill: '#9CA3AF' }} 
          tickLine={{ stroke: '#4B5563' }}
          axisLine={{ stroke: '#4B5563' }}
        />
        <YAxis 
          yAxisId="left" 
          tick={{ fill: '#9CA3AF' }} 
          tickLine={{ stroke: '#4B5563' }}
          axisLine={{ stroke: '#4B5563' }}
          label={{ 
            value: 'Power (W)', 
            angle: -90, 
            position: 'insideLeft',
            fill: '#9CA3AF',
            style: { textAnchor: 'middle' } 
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="cpu" 
          name="CPU"
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="gpu" 
          name="GPU"
          stroke="#10B981" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="other" 
          name="Other"
          stroke="#6B7280" 
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 6 }}
        />
        <Line 
          yAxisId="left"
          type="monotone" 
          dataKey="power_watts" 
          name="Total"
          stroke="#FBBF24" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PowerUsageChart;