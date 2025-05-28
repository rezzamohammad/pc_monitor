using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public interface IPowerDataService
{
    Task<PowerData> SavePowerDataAsync(PowerData powerData);
    Task<List<PowerData>> GetPowerDataBySessionAsync(string sessionId);
    Task<List<PowerData>> GetPowerDataByTimeRangeAsync(DateTime startTime, DateTime endTime);
    Task<List<PowerData>> GetRecentPowerDataAsync(int hours);
    Task<PowerData?> GetLatestPowerDataAsync();
    Task<double> GetTotalPowerConsumptionAsync();
    Task<double> GetTotalCostAsync();
}
