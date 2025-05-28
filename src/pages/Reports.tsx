import React, { useState } from 'react';
import { usePowerData } from '../context/PowerDataContext';
import { PowerReportOptions } from '../types';
import PowerUsageChart from '../components/charts/PowerUsageChart';
import { BarChart, DownloadCloud, Calendar, Clock } from 'lucide-react';

const Reports: React.FC = () => {
  const { powerHistory, electricityRate } = usePowerData();
  const [reportOptions, setReportOptions] = useState<PowerReportOptions>({
    period: 'day',
    format: 'text',
    includeGraph: true
  });

  // Filter data based on selected period
  const getFilteredData = () => {
    const now = new Date();
    let filterTime: Date;
    
    switch(reportOptions.period) {
      case '6h':
        filterTime = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '12h':
        filterTime = new Date(now.getTime() - 12 * 60 * 60 * 1000);
        break;
      case 'day':
        filterTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        filterTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filterTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return powerHistory;
    }
    
    return powerHistory.filter(item => new Date(item.timestamp) >= filterTime);
  };
  
  const filteredData = getFilteredData();
  
  // Calculate report statistics
  const calculateStats = () => {
    if (filteredData.length === 0) return null;
    
    const totalPower = filteredData.reduce((sum, item) => sum + item.power_watts, 0);
    const avgPower = totalPower / filteredData.length;
    const maxPower = Math.max(...filteredData.map(item => item.power_watts));
    const minPower = Math.min(...filteredData.map(item => item.power_watts));
    
    // Calculate kWh for this period
    const firstKwh = filteredData[0].accumulated_kwh;
    const lastKwh = filteredData[filteredData.length - 1].accumulated_kwh;
    const totalKwh = lastKwh - firstKwh;
    
    // Calculate cost
    const totalCost = totalKwh * electricityRate;
    
    return {
      avgPower,
      maxPower,
      minPower,
      totalKwh,
      totalCost,
      sampleCount: filteredData.length
    };
  };
  
  const stats = calculateStats();

  const handleExport = () => {
    if (!stats) return;
    
    let content = '';
    const filename = `power-report-${reportOptions.period}-${new Date().toISOString().split('T')[0]}.${reportOptions.format}`;
    
    if (reportOptions.format === 'json') {
      content = JSON.stringify({
        period: reportOptions.period,
        timestamp: new Date().toISOString(),
        stats: {
          averagePower: stats.avgPower,
          maxPower: stats.maxPower,
          minPower: stats.minPower,
          totalKwh: stats.totalKwh,
          totalCost: stats.totalCost
        },
        data: filteredData
      }, null, 2);
    } else if (reportOptions.format === 'csv') {
      content = 'timestamp,power_watts,accumulated_kwh,cpu_utilization,gpu_utilization,memory_utilization\n';
      filteredData.forEach(item => {
        content += `${item.timestamp},${item.power_watts},${item.accumulated_kwh},${item.components.cpu_utilization},${item.components.gpu_utilization},${item.components.memory_utilization}\n`;
      });
    } else {
      // Text report
      content = `=== PC Power Consumption Report ===\n\n`;
      content += `Period: ${reportOptions.period}\n`;
      content += `Generated: ${new Date().toISOString()}\n\n`;
      content += `Statistics:\n`;
      content += `- Average Power: ${stats.avgPower.toFixed(2)} W\n`;
      content += `- Maximum Power: ${stats.maxPower.toFixed(2)} W\n`;
      content += `- Minimum Power: ${stats.minPower.toFixed(2)} W\n`;
      content += `- Total Energy: ${stats.totalKwh.toFixed(3)} kWh\n`;
      content += `- Total Cost: ${stats.totalCost.toFixed(2)} ¥\n`;
      content += `- Samples: ${stats.sampleCount}\n`;
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Generate Power Report</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Time Period Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Time Period</label>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <select
                className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-white dark:bg-gray-700"
                value={reportOptions.period}
                onChange={(e) => setReportOptions({...reportOptions, period: e.target.value as PowerReportOptions['period']})}
              >
                <option value="6h">Last 6 Hours</option>
                <option value="12h">Last 12 Hours</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Data</option>
              </select>
            </div>
          </div>
          
          {/* Export Format */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Export Format</label>
            <div className="flex items-center space-x-2">
              <BarChart className="h-5 w-5 text-gray-500" />
              <select
                className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 bg-white dark:bg-gray-700"
                value={reportOptions.format}
                onChange={(e) => setReportOptions({...reportOptions, format: e.target.value as 'text' | 'csv' | 'json'})}
              >
                <option value="text">Text Report</option>
                <option value="csv">CSV Data</option>
                <option value="json">JSON Data</option>
              </select>
            </div>
          </div>
          
          {/* Include Graph */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Include Graph</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reportOptions.includeGraph}
                onChange={(e) => setReportOptions({...reportOptions, includeGraph: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span>Include power usage graph in report</span>
            </div>
            
            {/* Export Button */}
            <button
              onClick={handleExport}
              className="mt-2 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DownloadCloud className="h-5 w-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>
      </div>
      
      {/* Report Preview */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">Report Preview</h2>
          </div>
          
          {/* Graph */}
          {reportOptions.includeGraph && (
            <div className="p-4 border-b dark:border-gray-700">
              <h3 className="text-md font-medium mb-4">Power Usage</h3>
              <div className="h-64">
                <PowerUsageChart data={filteredData} />
              </div>
            </div>
          )}
          
          {/* Statistics */}
          <div className="p-4">
            <h3 className="text-md font-medium mb-4">Statistics</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Average Power</div>
                <div className="text-2xl font-bold">{stats.avgPower.toFixed(2)} W</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Maximum Power</div>
                <div className="text-2xl font-bold">{stats.maxPower.toFixed(2)} W</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Minimum Power</div>
                <div className="text-2xl font-bold">{stats.minPower.toFixed(2)} W</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Energy</div>
                <div className="text-2xl font-bold">{stats.totalKwh.toFixed(3)} kWh</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Cost</div>
                <div className="text-2xl font-bold">{stats.totalCost.toFixed(2)} ¥</div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">Time Period</div>
                <div className="text-2xl font-bold flex items-center">
                  <Clock className="h-5 w-5 mr-1" />
                  {reportOptions.period}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;