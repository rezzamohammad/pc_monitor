namespace PCMonitor.Core.Models;

public class Session
{
    public string Id { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public double TotalKwh { get; set; }
    public double TotalCost { get; set; }
}
