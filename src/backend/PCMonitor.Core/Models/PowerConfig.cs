namespace PCMonitor.Core.Models;

public class PowerConfig
{
    public double ElectricityRate { get; set; }
    public int SampleIntervalSeconds { get; set; } = 5;
    public PowerModel PowerModel { get; set; } = new();
}

public class PowerModel
{
    public double BasePowerWatts { get; set; }
    public double CpuTdpWatts { get; set; }
    public double GpuTdpWatts { get; set; }
}
