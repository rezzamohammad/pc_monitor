namespace PCMonitor.Core.Models;

public class PowerData
{
    public string Timestamp { get; set; } = string.Empty;
    public double PowerWatts { get; set; }
    public double AccumulatedKwh { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public ComponentUtilization Components { get; set; } = new();
}

public class ComponentUtilization
{
    public double CpuUtilization { get; set; }
    public double GpuUtilization { get; set; }
    public double MemoryUtilization { get; set; }
}
