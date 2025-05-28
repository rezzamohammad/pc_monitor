using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public interface IHardwareMonitorService : IDisposable
{
    PowerData GetCurrentPowerData();
    List<ComponentData> GetComponentData();
}
