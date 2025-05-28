import React from 'react';
import { usePowerData } from '../context/PowerDataContext';
import ComponentUsageBar from '../components/charts/ComponentUsageBar';
import { Cpu, HardDrive, MonitorSmartphone, Fan, Thermometer } from 'lucide-react';

const Components: React.FC = () => {
  const { components } = usePowerData();

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'processor':
        return <Cpu className="h-5 w-5" />;
      case 'graphics':
        return <MonitorSmartphone className="h-5 w-5" />;
      case 'storage':
        return <HardDrive className="h-5 w-5" />;
      case 'cooling':
        return <Fan className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  const getComponentColor = (type: string): 'blue' | 'green' | 'yellow' | 'red' | 'purple' => {
    switch (type) {
      case 'processor':
        return 'blue';
      case 'graphics':
        return 'green';
      case 'memory':
        return 'purple';
      case 'storage':
        return 'yellow';
      default:
        return 'red';
    }
  };

  const getTemperatureStatus = (temperature: number | null) => {
    if (!temperature) return null;
    
    if (temperature < 60) {
      return { status: 'Normal', color: 'bg-green-500' };
    } else if (temperature < 80) {
      return { status: 'Warm', color: 'bg-yellow-500' };
    } else {
      return { status: 'Hot', color: 'bg-red-500' };
    }
  };

  const getTotalPower = () => {
    return components.reduce((total, component) => total + component.power_watts, 0);
  };

  return (
    <div className="space-y-6">
      {/* Total Power Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Component Power Distribution</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Power Consumption</span>
            <div className="text-3xl font-bold">{getTotalPower().toFixed(1)} Watts</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="font-medium">{components.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Components</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium">
                {components.filter(c => c.temperature !== null).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Thermal Sensors</div>
            </div>
            
            <div className="text-center">
              <div className="font-medium">
                {components.filter(c => c.utilization !== null).length}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Utilization Metrics</div>
            </div>
          </div>
        </div>
        
        {/* Power distribution chart would go here */}
        <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Power Distribution</div>
            <div className="flex flex-wrap justify-center gap-2">
              {components.map(component => (
                <div 
                  key={component.id}
                  className="px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: `var(--${getComponentColor(component.type)}-500)`,
                    opacity: 0.8,
                    width: `${Math.max(10, (component.power_watts / getTotalPower()) * 100)}%`
                  }}
                >
                  {component.name}: {((component.power_watts / getTotalPower()) * 100).toFixed(1)}%
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Component List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold">Hardware Components</h2>
        </div>
        
        <div className="p-4 grid grid-cols-1 gap-6">
          {components.map((component) => (
            <div 
              key={component.id} 
              className="border dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 flex justify-between items-center">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 bg-${getComponentColor(component.type)}-100 dark:bg-${getComponentColor(component.type)}-900/30`}>
                    {getComponentIcon(component.type)}
                  </div>
                  <div>
                    <h3 className="font-medium">{component.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{component.model}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {component.temperature && (
                    <div className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-1 text-gray-500" />
                      <span 
                        className={`text-sm ${
                          component.temperature < 60 
                            ? 'text-green-500' 
                            : component.temperature < 80 
                              ? 'text-yellow-500' 
                              : 'text-red-500'
                        }`}
                      >
                        {component.temperature.toFixed(1)}°C
                      </span>
                      
                      {component.temperature && getTemperatureStatus(component.temperature) && (
                        <span 
                          className={`ml-2 px-2 py-0.5 text-xs rounded-full text-white ${
                            getTemperatureStatus(component.temperature)?.color
                          }`}
                        >
                          {getTemperatureStatus(component.temperature)?.status}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center text-yellow-500">
                    <span className="font-medium">{component.power_watts.toFixed(1)}W</span>
                    {component.tdp_watts && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                        / {component.tdp_watts}W
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                {component.utilization !== null && (
                  <ComponentUsageBar 
                    label="Utilization"
                    value={component.power_watts}
                    maxValue={component.tdp_watts || 100}
                    color={getComponentColor(component.type)}
                    percentage={component.utilization}
                    temperature={component.temperature}
                  />
                )}
                
                {component.utilization === null && (
                  <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                    <span>Power consumption</span>
                    <span>{component.power_watts.toFixed(1)}W</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Components;