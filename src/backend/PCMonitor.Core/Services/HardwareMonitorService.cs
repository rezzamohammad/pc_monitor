using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using OpenHardwareMonitor.Hardware;
using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public class HardwareMonitorService : IHardwareMonitorService
{
    private readonly ILogger<HardwareMonitorService> _logger;
    private readonly Computer _computer;
    private readonly PowerConfig _powerConfig;
    private double _lastAccumulatedKwh = 0;
    private string _currentSessionId = string.Empty;

    public HardwareMonitorService(ILogger<HardwareMonitorService> logger, PowerConfig powerConfig)
    {
        _logger = logger;
        _powerConfig = powerConfig;
        
        // Initialize OpenHardwareMonitor
        _computer = new Computer
        {
            CPUEnabled = true,
            GPUEnabled = true,
            RAMEnabled = true,
            MainboardEnabled = true,
            HDDEnabled = true,
            FanControllerEnabled = true
        };
        
        _computer.Open();
        _currentSessionId = Guid.NewGuid().ToString();
        
        _logger.LogInformation("Hardware monitoring service initialized");
    }

    public PowerData GetCurrentPowerData()
    {
        try
        {
            // Update all hardware readings
            _computer.Hardware.ToList().ForEach(hardware => hardware.Update());
            
            // Get CPU utilization
            var cpuUtilization = GetCpuUtilization();
            
            // Get GPU utilization
            var gpuUtilization = GetGpuUtilization();
            
            // Get memory utilization
            var memoryUtilization = GetMemoryUtilization();
            
            // Calculate power consumption based on hardware readings
            var totalPowerWatts = CalculateTotalPower(cpuUtilization, gpuUtilization);
            
            // Calculate accumulated kWh
            var incrementKwh = (totalPowerWatts / 1000) * (_powerConfig.SampleIntervalSeconds / 3600.0);
            _lastAccumulatedKwh += incrementKwh;
            
            return new PowerData
            {
                Timestamp = DateTime.UtcNow.ToString("o"),
                PowerWatts = totalPowerWatts,
                AccumulatedKwh = _lastAccumulatedKwh,
                SessionId = _currentSessionId,
                Components = new ComponentUtilization
                {
                    CpuUtilization = cpuUtilization,
                    GpuUtilization = gpuUtilization,
                    MemoryUtilization = memoryUtilization
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current power data");
            throw;
        }
    }

    public List<ComponentData> GetComponentData()
    {
        var components = new List<ComponentData>();
        
        try
        {
            // Update all hardware readings
            _computer.Hardware.ToList().ForEach(hardware => hardware.Update());
            
            // Add CPU component
            components.Add(GetCpuComponentData());
            
            // Add GPU component(s)
            components.AddRange(GetGpuComponentData());
            
            // Add Memory component
            components.Add(GetMemoryComponentData());
            
            // Add Motherboard component
            components.Add(GetMotherboardComponentData());
            
            // Add Storage components
            components.AddRange(GetStorageComponentData());
            
            // Add estimated PSU component
            components.Add(new ComponentData
            {
                Id = "psu",
                Name = "Power Supply",
                Type = "psu",
                Model = "Estimated",
                PowerWatts = components.Sum(c => c.PowerWatts) * 0.1, // Estimate PSU overhead as 10% of total component power
                Temperature = GetSensorValue(_computer.Hardware, SensorType.Temperature, "PSU"),
                Utilization = null,
                TdpWatts = null
            });
            
            return components;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting component data");
            return components;
        }
    }

    public void Dispose()
    {
        _computer?.Close();
    }

    #region Private Methods

    private double GetCpuUtilization()
    {
        var cpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.CPU);
        if (cpuHardware == null)
            return 0;
        
        var utilizationSensors = cpuHardware.Sensors.Where(s => s.SensorType == SensorType.Load && s.Name.Contains("CPU Total"));
        if (!utilizationSensors.Any())
            return 0;
        
        return utilizationSensors.Average(s => s.Value ?? 0);
    }

    private double GetGpuUtilization()
    {
        var gpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.GpuNvidia || h.HardwareType == HardwareType.GpuAti);
        if (gpuHardware == null)
            return 0;
        
        var utilizationSensors = gpuHardware.Sensors.Where(s => s.SensorType == SensorType.Load && s.Name.Contains("GPU Core"));
        if (!utilizationSensors.Any())
            return 0;
        
        return utilizationSensors.Average(s => s.Value ?? 0);
    }

    private double GetMemoryUtilization()
    {
        var ramHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.RAM);
        if (ramHardware == null)
            return 0;
        
        var utilizationSensors = ramHardware.Sensors.Where(s => s.SensorType == SensorType.Load);
        if (!utilizationSensors.Any())
            return 0;
        
        return utilizationSensors.Average(s => s.Value ?? 0);
    }

    private double CalculateTotalPower(double cpuUtilization, double gpuUtilization)
    {
        var cpuPower = GetCpuPower(cpuUtilization);
        var gpuPower = GetGpuPower(gpuUtilization);
        var otherComponentsPower = _powerConfig.PowerModel.BasePowerWatts;
        
        return cpuPower + gpuPower + otherComponentsPower;
    }

    private double GetCpuPower(double cpuUtilization)
    {
        // Try to get direct power reading from CPU sensors
        var cpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.CPU);
        if (cpuHardware != null)
        {
            var powerSensors = cpuHardware.Sensors.Where(s => s.SensorType == SensorType.Power && s.Name.Contains("Package"));
            if (powerSensors.Any())
            {
                return powerSensors.Average(s => s.Value ?? 0);
            }
        }
        
        // If no direct reading, estimate based on TDP and utilization
        return _powerConfig.PowerModel.CpuTdpWatts * (0.3 + (0.7 * cpuUtilization / 100));
    }

    private double GetGpuPower(double gpuUtilization)
    {
        // Try to get direct power reading from GPU sensors
        var gpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.GpuNvidia || h.HardwareType == HardwareType.GpuAti);
        if (gpuHardware != null)
        {
            var powerSensors = gpuHardware.Sensors.Where(s => s.SensorType == SensorType.Power);
            if (powerSensors.Any())
            {
                return powerSensors.Average(s => s.Value ?? 0);
            }
        }
        
        // If no direct reading, estimate based on TDP and utilization
        return _powerConfig.PowerModel.GpuTdpWatts * (0.2 + (0.8 * gpuUtilization / 100));
    }

    private ComponentData GetCpuComponentData()
    {
        var cpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.CPU);
        
        var model = cpuHardware?.Name ?? "Unknown CPU";
        var utilization = GetCpuUtilization();
        var temperature = GetSensorValue(cpuHardware, SensorType.Temperature, "CPU Package");
        var power = GetCpuPower(utilization);
        
        return new ComponentData
        {
            Id = "cpu",
            Name = "CPU",
            Type = "processor",
            Model = model,
            TdpWatts = _powerConfig.PowerModel.CpuTdpWatts,
            Utilization = utilization,
            Temperature = temperature,
            PowerWatts = power
        };
    }

    private List<ComponentData> GetGpuComponentData()
    {
        var gpuComponents = new List<ComponentData>();
        var gpuHardware = _computer.Hardware.Where(h => h.HardwareType == HardwareType.GpuNvidia || h.HardwareType == HardwareType.GpuAti);
        
        int gpuIndex = 0;
        foreach (var gpu in gpuHardware)
        {
            var model = gpu.Name ?? "Unknown GPU";
            var utilization = GetSensorValue(gpu, SensorType.Load, "GPU Core");
            var temperature = GetSensorValue(gpu, SensorType.Temperature, "GPU Core");
            var power = GetSensorValue(gpu, SensorType.Power, "GPU Package") ?? 
                        (_powerConfig.PowerModel.GpuTdpWatts * (0.2 + (0.8 * (utilization ?? 0) / 100)));
            
            gpuComponents.Add(new ComponentData
            {
                Id = $"gpu{gpuIndex}",
                Name = $"GPU {(gpuIndex > 0 ? gpuIndex.ToString() : "")}",
                Type = "graphics",
                Model = model,
                TdpWatts = _powerConfig.PowerModel.GpuTdpWatts,
                Utilization = utilization,
                Temperature = temperature,
                PowerWatts = power
            });
            
            gpuIndex++;
        }
        
        // If no GPU was found, add a placeholder
        if (gpuComponents.Count == 0)
        {
            gpuComponents.Add(new ComponentData
            {
                Id = "gpu",
                Name = "GPU",
                Type = "graphics",
                Model = "Integrated/Unknown",
                TdpWatts = _powerConfig.PowerModel.GpuTdpWatts,
                Utilization = 0,
                Temperature = null,
                PowerWatts = 0
            });
        }
        
        return gpuComponents;
    }

    private ComponentData GetMemoryComponentData()
    {
        var ramHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.RAM);
        
        var utilization = GetMemoryUtilization();
        var usedMemory = GetSensorValue(ramHardware, SensorType.Data, "Used Memory");
        var availableMemory = GetSensorValue(ramHardware, SensorType.Data, "Available Memory");
        var totalMemory = (usedMemory ?? 0) + (availableMemory ?? 0);
        
        var memoryModel = $"{totalMemory:F1}GB";
        if (string.IsNullOrEmpty(memoryModel))
            memoryModel = "Unknown Memory";
        
        return new ComponentData
        {
            Id = "ram",
            Name = "Memory",
            Type = "memory",
            Model = memoryModel,
            TdpWatts = 10, // Default estimate for RAM
            Utilization = utilization,
            Temperature = null, // RAM typically doesn't have temperature sensors
            PowerWatts = 5 + (5 * utilization / 100) // Estimate RAM power usage
        };
    }

    private ComponentData GetMotherboardComponentData()
    {
        var mainboardHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.Mainboard);
        
        var model = mainboardHardware?.Name ?? "Unknown Motherboard";
        var temperature = GetSensorValue(mainboardHardware, SensorType.Temperature, "Temperature");
        
        return new ComponentData
        {
            Id = "mobo",
            Name = "Motherboard",
            Type = "motherboard",
            Model = model,
            TdpWatts = 25, // Default estimate for motherboard
            Utilization = null,
            Temperature = temperature,
            PowerWatts = 15 // Estimate motherboard power usage
        };
    }

    private List<ComponentData> GetStorageComponentData()
    {
        var storageComponents = new List<ComponentData>();
        var storageHardware = _computer.Hardware.Where(h => h.HardwareType == HardwareType.HDD);
        
        int storageIndex = 0;
        foreach (var storage in storageHardware)
        {
            var model = storage.Name ?? "Unknown Storage";
            var temperature = GetSensorValue(storage, SensorType.Temperature, "Temperature");
            var utilization = GetSensorValue(storage, SensorType.Load, "Used Space");
            
            bool isSsd = model.Contains("SSD") || model.Contains("NVMe");
            
            storageComponents.Add(new ComponentData
            {
                Id = $"storage{storageIndex}",
                Name = isSsd ? "SSD" : "HDD",
                Type = "storage",
                Model = model,
                TdpWatts = isSsd ? 5 : 8, // Estimate for SSD vs HDD
                Utilization = utilization,
                Temperature = temperature,
                PowerWatts = isSsd ? 2 : 4 // Estimate storage power usage
            });
            
            storageIndex++;
        }
        
        // If no storage was found, add a placeholder
        if (storageComponents.Count == 0)
        {
            storageComponents.Add(new ComponentData
            {
                Id = "storage",
                Name = "Storage",
                Type = "storage",
                Model = "Unknown Storage",
                TdpWatts = 5,
                Utilization = null,
                Temperature = null,
                PowerWatts = 3
            });
        }
        
        return storageComponents;
    }

    private double? GetSensorValue(IHardware? hardware, SensorType sensorType, string nameContains)
    {
        if (hardware == null)
            return null;
        
        hardware.Update();
        
        var sensors = hardware.Sensors
            .Where(s => s.SensorType == sensorType && s.Name.Contains(nameContains, StringComparison.OrdinalIgnoreCase));
        
        if (!sensors.Any())
            return null;
        
        return sensors.Average(s => s.Value);
    }

    private double? GetSensorValue(IEnumerable<IHardware> hardware, SensorType sensorType, string nameContains)
    {
        foreach (var h in hardware)
        {
            h.Update();
            
            var value = GetSensorValue(h, sensorType, nameContains);
            if (value.HasValue)
                return value;
            
            // Check sub-hardware
            var subValue = GetSensorValue(h.SubHardware, sensorType, nameContains);
            if (subValue.HasValue)
                return subValue;
        }
        
        return null;
    }

    #endregion
}
