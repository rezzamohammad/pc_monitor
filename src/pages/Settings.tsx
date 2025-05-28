import React, { useState } from 'react';
import { usePowerData } from '../context/PowerDataContext';
import { Save, RotateCcw, Settings as SettingsIcon, Clock, DollarSign, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { electricityRate, setElectricityRate, sampleInterval, setSampleInterval, isLoading } = usePowerData();
  
  const [formData, setFormData] = useState({
    electricityRate,
    sampleInterval,
    baseWatts: 45,
    cpuTdpWatts: 125,
    gpuTdpWatts: 150
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      // Update local context state
      setElectricityRate(formData.electricityRate);
      setSampleInterval(formData.sampleInterval);
      
      // Save settings to backend (simulated for now)
      // In a real implementation, we would call an API endpoint to update these settings
      // Example: await hardwareMonitorApi.updateSettings(formData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Clear success message after 3 seconds
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      electricityRate,
      sampleInterval,
      baseWatts: 50,
      cpuTdpWatts: 65,
      gpuTdpWatts: 35
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center mb-4">
          <SettingsIcon className="h-6 w-6 mr-2 text-gray-500" />
          <h2 className="text-lg font-semibold">Power Monitor Settings</h2>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Electricity Rate */}
            <div className="space-y-2">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 mr-1 text-yellow-500" />
                <label className="block text-sm font-medium">Electricity Rate (¥/kWh)</label>
              </div>
              <input
                type="number"
                name="electricityRate"
                value={formData.electricityRate}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Set your electricity cost per kilowatt-hour
              </p>
            </div>
            
            {/* Sample Interval */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-1 text-blue-500" />
                <label className="block text-sm font-medium">Sample Interval (seconds)</label>
              </div>
              <input
                type="number"
                name="sampleInterval"
                value={formData.sampleInterval}
                onChange={handleChange}
                min="1"
                max="60"
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                How often to collect power data (1-60 seconds)
              </p>
            </div>
            
            {/* Base Power */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Base System Power (Watts)</label>
              <input
                type="number"
                name="baseWatts"
                value={formData.baseWatts}
                onChange={handleChange}
                min="0"
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Baseline power consumption when system is idle
              </p>
            </div>
            
            {/* CPU TDP */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">CPU TDP (Watts)</label>
              <input
                type="number"
                name="cpuTdpWatts"
                value={formData.cpuTdpWatts}
                onChange={handleChange}
                min="0"
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thermal Design Power of your CPU
              </p>
            </div>
            
            {/* GPU TDP */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">GPU TDP (Watts)</label>
              <input
                type="number"
                name="gpuTdpWatts"
                value={formData.gpuTdpWatts}
                onChange={handleChange}
                min="0"
                className="block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thermal Design Power of your GPU
              </p>
            </div>
          </div>
          
          {/* Feedback Messages */}
          {saveError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center text-red-700 dark:text-red-400">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{saveError}</span>
              </div>
            </div>
          )}
          
          {saveSuccess && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center text-green-700 dark:text-green-400">
                <Save className="h-5 w-5 mr-2" />
                <span>Settings saved successfully!</span>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <div className="flex items-center text-blue-700 dark:text-blue-400">
                <div className="animate-spin h-5 w-5 mr-2 border-2 border-blue-600 border-t-transparent rounded-full" />
                <span>Loading hardware data...</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </div>
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center">
                {isSaving ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Settings'}
              </div>
            </button>
          </div>
        </form>
      </div>
      
      {/* About Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">About</h2>
        
        <div className="space-y-4">
          <p>
            PC Power Consumption Monitoring System v2.1.0
          </p>
          
          <div className="flex items-baseline space-x-2">
            <span className="font-medium">Data Source:</span>
            <span>OpenHardwareMonitorLib.dll (Real-time Hardware Monitoring)</span>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <span className="font-medium">Monitoring Method:</span>
            <span>Direct sensor readings when available, with fallback to TDP-based estimation</span>
          </div>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            This system uses OpenHardwareMonitor to collect real-time hardware metrics from your PC components,
            including direct power consumption readings when available. It tracks kWh usage with timestamps,
            calculates electricity costs, and generates reports across different time periods.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;