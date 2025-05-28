using OpenHardwareMonitor.Hardware; // For SensorType, HardwareType, ISensor
using System;
using System.Collections.Generic;

namespace PCMonitor.Core.Reading
{
    public interface ISensorReader : IDisposable
    {
        /// <summary>
        /// Gets information about all hardware components of a specific type.
        /// </summary>
        /// <param name="type">The type of hardware to find (e.g., CPU, GpuNvidia, GpuAti, RAM, HDD, Mainboard).</param>
        /// <returns>An enumerable of HardwareInfo objects.</returns>
        IEnumerable<HardwareInfo> GetHardware(HardwareType type);

        /// <summary>
        /// Gets information about the mainboard.
        /// </summary>
        /// <returns>HardwareInfo for the mainboard, or null if not found.</returns>
        HardwareInfo? GetMainboard();

        /// <summary>
        /// Gets the value of the first sensor that matches the specified type and name pattern on a given piece of hardware.
        /// The name pattern is a case-insensitive substring match.
        /// </summary>
        /// <param name="hardwareIdentifier">The identifier of the hardware (from HardwareInfo.Identifier).</param>
        /// <param name="sensorType">The type of sensor to find.</param>
        /// <param name="namePattern">The pattern to match in the sensor's name.</param>
        /// <returns>The sensor's value, or null if not found or sensor value is null.</returns>
        double? GetSensorValue(string hardwareIdentifier, SensorType sensorType, string namePattern);
        
        /// <summary>
        /// Gets all sensors and their values that match the specified type and an optional name pattern on a given piece of hardware.
        /// If namePattern is null or empty, all sensors of the specified type are returned.
        /// The name pattern is a case-insensitive substring match.
        /// </summary>
        /// <param name="hardwareIdentifier">The identifier of the hardware (from HardwareInfo.Identifier).</param>
        /// <param name="sensorType">The type of sensors to find.</param>
        /// <param name="namePattern">Optional pattern to match in the sensor's name.</param>
        /// <returns>An enumerable of tuples containing the ISensor and its value.</returns>
        IEnumerable<(ISensor Sensor, double? Value)> GetSensorReadings(string hardwareIdentifier, SensorType sensorType, string? namePattern = null);
    }
}
