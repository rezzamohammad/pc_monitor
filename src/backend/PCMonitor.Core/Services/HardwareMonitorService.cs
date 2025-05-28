using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Logging;
using OpenHardwareMonitor.Hardware;
using PCMonitor.Core.Models;
using PCMonitor.Core.Reading; // Added for ISensorReader

namespace PCMonitor.Core.Services;

public class HardwareMonitorService : IHardwareMonitorService
{
    private readonly ILogger<HardwareMonitorService> _logger;
    private readonly ISensorReader _sensorReader; // Changed from Computer to ISensorReader
    private readonly PowerConfig _powerConfig;
    private double _lastAccumulatedKwh = 0;
    private string _currentSessionId = string.Empty;

    public HardwareMonitorService(ILogger<HardwareMonitorService> logger, PowerConfig powerConfig, ISensorReader sensorReader)
    {
        _logger = logger;
        _powerConfig = powerConfig;
        _sensorReader = sensorReader; // Assign ISensorReader
        
        _currentSessionId = Guid.NewGuid().ToString();
        
        _logger.LogInformation("Hardware monitoring service initialized with ISensorReader.");
    }

    public PowerData GetCurrentPowerData()
    {
        try
        {
            // Update all hardware readings // REMOVED: _computer.Hardware.ToList().ForEach(hardware => hardware.Update());
            
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
            // Update all hardware readings // REMOVED: _computer.Hardware.ToList().ForEach(hardware => hardware.Update());
            
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
        // _computer?.Close(); // Removed: _sensorReader's lifetime is managed by DI
        // The service itself is IDisposable because IHardwareMonitorService is IDisposable.
        // No other unmanaged resources are directly owned by this service.
    }

    #region Private Methods

    private double GetCpuUtilization()
    {
        var cpus = _sensorReader.GetHardware(HardwareType.CPU).ToList();
        if (cpus.Any())
        {
            var cpuInfo = cpus.First();
            return _sensorReader.GetSensorValue(cpuInfo.Identifier, SensorType.Load, "CPU Total") ?? 0;
        }
        _logger.LogWarning("No CPU hardware found by SensorReader for GetCpuUtilization.");
        return 0;
    }

    private double GetGpuUtilization()
    {
        var gpus = _sensorReader.GetHardware(HardwareType.GpuNvidia)
                                .Concat(_sensorReader.GetHardware(HardwareType.GpuAti))
                                .ToList();
        if (gpus.Any())
        {
            var gpuInfo = gpus.First(); // Simplification: uses the first GPU.
            return _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.Load, "GPU Core") ?? 0;
        }
        _logger.LogWarning("No GPU hardware found by SensorReader for GetGpuUtilization.");
        return 0;
    }

    private double GetMemoryUtilization()
    {
        var rams = _sensorReader.GetHardware(HardwareType.RAM).ToList();
        if (rams.Any())
        {
            var ramInfo = rams.First();
            // Assuming "Memory" is the correct sensor name for overall RAM load.
            // In OHM, this is often under "Memory" sensor type, with a name like "Memory Used" or "Memory Load".
            // The direct sensor name for load might be "Memory" or specific like "Memory Load".
            // Let's stick to "Memory" as a general load sensor name, if not found, GetSensorValue returns null -> 0.
            return _sensorReader.GetSensorValue(ramInfo.Identifier, SensorType.Load, "Memory") ?? 0;
        }
        _logger.LogWarning("No RAM hardware found by SensorReader for GetMemoryUtilization.");
        return 0;
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
        var cpuInfo = _sensorReader.GetHardware(HardwareType.CPU).FirstOrDefault();
        if (cpuInfo != null)
        {
            var directPower = _sensorReader.GetSensorValue(cpuInfo.Identifier, SensorType.Power, "Package");
            if (directPower.HasValue)
            {
                return directPower.Value;
            }
        }
        // Fallback to TDP estimation
        return _powerConfig.PowerModel.CpuTdpWatts * (0.3 + (0.7 * cpuUtilization / 100));
    }

    private double GetGpuPower(double gpuUtilization)
    {
        var gpuInfo = _sensorReader.GetHardware(HardwareType.GpuNvidia)
                                .Concat(_sensorReader.GetHardware(HardwareType.GpuAti))
                                .FirstOrDefault();
        if (gpuInfo != null)
        {
            // Using "Package" for GPU power as it's common, though original code searched any power sensor.
            // If a more specific or different named sensor is common, this pattern might need adjustment.
            var directPower = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.Power, "Package");
            if (directPower.HasValue)
            {
                return directPower.Value;
            }
        }
        // Fallback to TDP estimation
        return _powerConfig.PowerModel.GpuTdpWatts * (0.2 + (0.8 * gpuUtilization / 100));
    }

    private ComponentData GetCpuComponentData()
    {
        var cpuInfo = _sensorReader.GetHardware(HardwareType.CPU).FirstOrDefault();
        if (cpuInfo == null)
        {
            _logger.LogWarning("CPU hardware not found via SensorReader.");
            return new ComponentData { 
                Id = "cpu", Name = "CPU", Type = "processor", Model = "Unknown CPU", 
                TdpWatts = _powerConfig.PowerModel.CpuTdpWatts, Utilization = 0, 
                Temperature = null, PowerWatts = _powerConfig.PowerModel.CpuTdpWatts * 0.3, // idle estimate
                ClockSpeedMhz = null 
            };
        }
        
        var utilization = GetCpuUtilization(); // Already uses SensorReader
        // Log if GetCpuUtilization returned 0, potentially indicating a missing "CPU Total" sensor
        if (utilization == 0)
             _logger.LogWarning($"CPU Utilization is 0. Sensor 'CPU Total' might be missing or unreadable on '{cpuInfo.Name}'.");

        var temperature = _sensorReader.GetSensorValue(cpuInfo.Identifier, SensorType.Temperature, "CPU Package");
        var power = GetCpuPower(utilization); // Already uses SensorReader for direct power
        
        var coreClocks = _sensorReader.GetSensorReadings(cpuInfo.Identifier, SensorType.Clock, "CPU Core").ToList();
        double? clockSpeed = coreClocks.Any(c => c.Value.HasValue) ? coreClocks.Where(c => c.Value.HasValue).Average(c => c.Value.Value) : null;

        return new ComponentData
        {
            Id = "cpu",
            Name = "CPU",
            Type = "processor",
            Model = cpuInfo.Name,
            TdpWatts = _powerConfig.PowerModel.CpuTdpWatts,
            Utilization = utilization,
            Temperature = temperature,
            PowerWatts = power,
            ClockSpeedMhz = clockSpeed
        };
    }

    private List<ComponentData> GetGpuComponentData()
    {
        var gpuComponents = new List<ComponentData>();
        var gpuHardwareInfo = _sensorReader.GetHardware(HardwareType.GpuNvidia)
                                     .Concat(_sensorReader.GetHardware(HardwareType.GpuAti))
                                     .ToList();
        
        if (!gpuHardwareInfo.Any())
        {
            _logger.LogWarning("No GPU hardware found via SensorReader. Adding placeholder.");
            gpuComponents.Add(new ComponentData
            {
                Id = "gpu", Name = "GPU", Type = "graphics", Model = "Integrated/Unknown",
                TdpWatts = _powerConfig.PowerModel.GpuTdpWatts, Utilization = 0, Temperature = null, PowerWatts = 0
            });
            return gpuComponents;
        }

        int gpuIndex = 0;
        foreach (var gpuInfo in gpuHardwareInfo)
        {
            var utilization = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.Load, "GPU Core");
            var temperature = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.Temperature, "GPU Core");
            var directPower = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.Power, "GPU Package");
            var power = directPower ?? (_powerConfig.PowerModel.GpuTdpWatts * (0.2 + (0.8 * (utilization ?? 0) / 100)));
            var clockSpeed = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.Clock, "GPU Core");
            var memoryUsed = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.SmallData, "GPU Memory Used");
            var memoryTotal = _sensorReader.GetSensorValue(gpuInfo.Identifier, SensorType.SmallData, "GPU Memory Total");
            
            gpuComponents.Add(new ComponentData
            {
                Id = $"gpu{gpuIndex}",
                Name = $"GPU {(gpuIndex > 0 ? gpuIndex.ToString() : "")}",
                Type = "graphics",
                Model = gpuInfo.Name,
                TdpWatts = _powerConfig.PowerModel.GpuTdpWatts,
                Utilization = utilization,
                Temperature = temperature,
                PowerWatts = power,
                ClockSpeedMhz = clockSpeed,
                MemoryUsedMB = memoryUsed,
                MemoryTotalMB = memoryTotal
            });
            gpuIndex++;
        }
        return gpuComponents;
    }

    private ComponentData GetMemoryComponentData()
    {
        var ramInfo = _sensorReader.GetHardware(HardwareType.RAM).FirstOrDefault();
        var utilization = GetMemoryUtilization(); // Already uses SensorReader

        if (ramInfo == null)
        {
            _logger.LogWarning("RAM hardware not found via SensorReader.");
            return new ComponentData { 
                Id = "ram", Name = "Memory", Type = "memory", Model = "Unknown Memory", 
                TdpWatts = 10, Utilization = utilization, Temperature = null, 
                PowerWatts = 5 + (5 * utilization / 100) 
            };
        }
        
        var usedMemory = _sensorReader.GetSensorValue(ramInfo.Identifier, SensorType.Data, "Used Memory");
        var availableMemory = _sensorReader.GetSensorValue(ramInfo.Identifier, SensorType.Data, "Available Memory");
        var totalMemory = (usedMemory ?? 0) + (availableMemory ?? 0);
        
        var memoryModel = $"{totalMemory:F1}GB";
        if (totalMemory == 0)
        {
             memoryModel = (usedMemory.HasValue || availableMemory.HasValue) 
                ? $"Used: {usedMemory ?? 0:F1}GB, Avail: {availableMemory ?? 0:F1}GB" 
                : "Unknown Memory";
        }
        
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
        var mbInfo = _sensorReader.GetMainboard();
        if (mbInfo == null)
        {
            // GetMainboard in SensorReader already logs if mainboard itself is not found.
            // This service-level log indicates it wasn't available for component data creation.
            _logger.LogWarning("Motherboard hardware info not available from SensorReader for component data.");
            return new ComponentData {
                Id = "mobo", Name = "Motherboard", Type = "motherboard", Model = "Unknown Motherboard",
                TdpWatts = 25, Utilization = null, Temperature = null, PowerWatts = 15,
                FanSpeedRPM = null, Voltage = null
            };
        }
        
        var temperature = _sensorReader.GetSensorValue(mbInfo.Identifier, SensorType.Temperature, "Temperature");
        var fanSpeed = _sensorReader.GetSensorValue(mbInfo.Identifier, SensorType.Fan, "Fan");
        var voltage = _sensorReader.GetSensorValue(mbInfo.Identifier, SensorType.Voltage, "CPU VCore");
        
        return new ComponentData
        {
            Id = "mobo",
            Name = "Motherboard",
            Type = "motherboard",
            Model = mbInfo.Name,
            TdpWatts = 25, // Default estimate for motherboard
            Utilization = null,
            Temperature = temperature,
            PowerWatts = 15, // Estimate motherboard power usage
            FanSpeedRPM = fanSpeed,
            Voltage = voltage
        };
    }

    private List<ComponentData> GetStorageComponentData()
    {
        var storageComponents = new List<ComponentData>();
        var storageHardwareInfo = _sensorReader.GetHardware(HardwareType.HDD).ToList();
        
        if (!storageHardwareInfo.Any())
        {
            _logger.LogWarning("No storage hardware found via SensorReader. Adding placeholder.");
            storageComponents.Add(new ComponentData {
                Id = "storage", Name = "Storage", Type = "storage", Model = "Unknown Storage",
                TdpWatts = 5, Utilization = null, Temperature = null, PowerWatts = 3
            });
            return storageComponents;
        }

        int storageIndex = 0;
        foreach (var storageInfo in storageHardwareInfo)
        {
            var model = storageInfo.Name;
            var temperature = _sensorReader.GetSensorValue(storageInfo.Identifier, SensorType.Temperature, "Temperature");
            var utilization = _sensorReader.GetSensorValue(storageInfo.Identifier, SensorType.Load, "Used Space");
            
            bool isSsd = model.Contains("SSD", StringComparison.OrdinalIgnoreCase) || model.Contains("NVMe", StringComparison.OrdinalIgnoreCase);
            
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
        return storageComponents;
    }

    // Old GetSensorValue methods are removed as per instructions.
    #endregion
}
