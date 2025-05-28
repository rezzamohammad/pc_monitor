using Microsoft.Extensions.Logging;
using OpenHardwareMonitor.Hardware;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PCMonitor.Core.Reading
{
    public class SensorReader : ISensorReader
    {
        private readonly ILogger<SensorReader> _logger;
        private readonly IComputer _computer; // Changed to IComputer

        public SensorReader(ILogger<SensorReader> logger, IComputer computer) // Added IComputer parameter
        {
            _logger = logger;
            _computer = computer; // Assign injected IComputer

            // Configure the computer instance
            _computer.CPUEnabled = true;
            _computer.GPUEnabled = true;
            _computer.RAMEnabled = true;
            _computer.MainboardEnabled = true;
            _computer.HDDEnabled = true;
            _computer.FanControllerEnabled = true;

            try
            {
                _computer.Open();
                _logger.LogInformation("SensorReader initialized and IComputer instance opened.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to open IComputer instance in SensorReader.");
                // Depending on desired behavior, could re-throw or operate in a disabled state.
            }
        }

        public IEnumerable<HardwareInfo> GetHardware(HardwareType type)
        {
            if (_computer.Hardware == null) yield break;

            foreach (var hardware in _computer.Hardware)
            {
                if (hardware.HardwareType == type)
                {
                    yield return new HardwareInfo
                    {
                        Identifier = hardware.Identifier.ToString(),
                        Name = hardware.Name,
                        Type = hardware.HardwareType
                    };
                }
                // Also check sub-hardware for certain types if necessary (e.g., some controllers)
                // For now, keep it to top-level hardware as per typical OHM structure for CPU/GPU/RAM etc.
            }
        }

        public HardwareInfo? GetMainboard()
        {
            if (_computer.Hardware == null) return null;

            var mainboard = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.Mainboard);
            if (mainboard != null)
            {
                return new HardwareInfo
                {
                    Identifier = mainboard.Identifier.ToString(),
                    Name = mainboard.Name,
                    Type = mainboard.HardwareType
                };
            }
            _logger.LogWarning("Mainboard hardware not found.");
            return null;
        }

        private IHardware? FindHardware(string hardwareIdentifier)
        {
            if (_computer.Hardware == null) return null;
            
            // Search top-level hardware
            var hardware = _computer.Hardware.FirstOrDefault(h => h.Identifier.ToString() == hardwareIdentifier);
            if (hardware != null) return hardware;

            // Search sub-hardware recursively (OpenHardwareMonitor can have nested hardware)
            foreach (var hwItem in _computer.Hardware)
            {
                hardware = FindSubHardware(hwItem, hardwareIdentifier);
                if (hardware != null) return hardware;
            }
            
            _logger.LogWarning($"Hardware with identifier '{hardwareIdentifier}' not found.");
            return null;
        }
        
        private IHardware? FindSubHardware(IHardware parentHardware, string hardwareIdentifier)
        {
            if (parentHardware.SubHardware == null) return null;

            foreach (var subHw in parentHardware.SubHardware)
            {
                if (subHw.Identifier.ToString() == hardwareIdentifier)
                {
                    return subHw;
                }
                var foundInNextLevel = FindSubHardware(subHw, hardwareIdentifier);
                if (foundInNextLevel != null) return foundInNextLevel;
            }
            return null;
        }


        public double? GetSensorValue(string hardwareIdentifier, SensorType sensorType, string namePattern)
        {
            var hardware = FindHardware(hardwareIdentifier);
            if (hardware == null)
            {
                // FindHardware already logs a warning
                return null;
            }

            hardware.Update(); // Crucial: Update hardware before reading sensors

            var sensor = hardware.Sensors.FirstOrDefault(s => 
                s.SensorType == sensorType && 
                s.Name.Contains(namePattern, StringComparison.OrdinalIgnoreCase));

            if (sensor == null)
            {
                _logger.LogWarning($"Sensor with type '{sensorType}' and name pattern '{namePattern}' not found on hardware '{hardware.Name} ({hardwareIdentifier})'.");
                return null;
            }
            
            return sensor.Value;
        }

        public IEnumerable<(ISensor Sensor, double? Value)> GetSensorReadings(string hardwareIdentifier, SensorType sensorType, string? namePattern = null)
        {
            var hardware = FindHardware(hardwareIdentifier);
            if (hardware == null)
            {
                // FindHardware already logs a warning
                yield break;
            }

            hardware.Update(); // Crucial: Update hardware before reading sensors

            var sensors = hardware.Sensors.Where(s => s.SensorType == sensorType);
            if (!string.IsNullOrEmpty(namePattern))
            {
                sensors = sensors.Where(s => s.Name.Contains(namePattern, StringComparison.OrdinalIgnoreCase));
            }

            if (!sensors.Any())
            {
                 _logger.LogWarning($"No sensors found with type '{sensorType}'{(string.IsNullOrEmpty(namePattern) ? "" : $" and name pattern '{namePattern}'")} on hardware '{hardware.Name} ({hardwareIdentifier})'.");
            }

            foreach (var sensor in sensors)
            {
                yield return (sensor, sensor.Value);
            }
        }

        public void Dispose()
        {
            try
            {
                _computer.Close();
                _logger.LogInformation("SensorReader disposed and Computer closed.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Exception closing Computer instance in SensorReader Dispose.");
            }
        }
    }
}
