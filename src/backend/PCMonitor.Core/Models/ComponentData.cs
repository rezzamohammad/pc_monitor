namespace PCMonitor.Core.Models;

public class ComponentData
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public double? TdpWatts { get; set; }
    public double? Utilization { get; set; }
    public double? Temperature { get; set; }
    public double PowerWatts { get; set; }
}
