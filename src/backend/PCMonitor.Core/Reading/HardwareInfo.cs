using OpenHardwareMonitor.Hardware;

namespace PCMonitor.Core.Reading
{
    public class HardwareInfo
    {
        public required string Identifier { get; init; } // Unique identifier from OHM
        public required string Name { get; init; }
        public required HardwareType Type { get; init; }
    }
}
