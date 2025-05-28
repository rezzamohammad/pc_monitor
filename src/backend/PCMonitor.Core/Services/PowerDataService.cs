using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PCMonitor.Core.Data;
using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public class PowerDataService : IPowerDataService
{
    private readonly PCMonitorContext _dbContext;
    private readonly ILogger<PowerDataService> _logger;
    private readonly PowerConfig _powerConfig;

    public PowerDataService(PCMonitorContext dbContext, ILogger<PowerDataService> logger, PowerConfig powerConfig)
    {
        _dbContext = dbContext;
        _logger = logger;
        _powerConfig = powerConfig;
    }

    public async Task<PowerData> SavePowerDataAsync(PowerData powerData)
    {
        var entity = PowerDataEntity.FromModel(powerData);
        
        await _dbContext.PowerData.AddAsync(entity);
        await _dbContext.SaveChangesAsync();
        
        _logger.LogDebug("Saved power data: {PowerWatts}W at {Timestamp}", powerData.PowerWatts, powerData.Timestamp);
        return powerData;
    }

    public async Task<List<PowerData>> GetPowerDataBySessionAsync(string sessionId)
    {
        var data = await _dbContext.PowerData
            .Where(p => p.SessionId == sessionId)
            .OrderBy(p => p.Timestamp)
            .ToListAsync();
        
        return data.Select(d => d.ToModel()).ToList();
    }

    public async Task<List<PowerData>> GetPowerDataByTimeRangeAsync(DateTime startTime, DateTime endTime)
    {
        var startTimeStr = startTime.ToString("o");
        var endTimeStr = endTime.ToString("o");
        
        var data = await _dbContext.PowerData
            .Where(p => p.Timestamp.CompareTo(startTimeStr) >= 0 && p.Timestamp.CompareTo(endTimeStr) <= 0)
            .OrderBy(p => p.Timestamp)
            .ToListAsync();
        
        return data.Select(d => d.ToModel()).ToList();
    }

    public async Task<List<PowerData>> GetRecentPowerDataAsync(int hours)
    {
        var cutoffTime = DateTime.UtcNow.AddHours(-hours).ToString("o");
        
        var data = await _dbContext.PowerData
            .Where(p => p.Timestamp.CompareTo(cutoffTime) >= 0)
            .OrderBy(p => p.Timestamp)
            .ToListAsync();
        
        return data.Select(d => d.ToModel()).ToList();
    }

    public async Task<PowerData?> GetLatestPowerDataAsync()
    {
        var data = await _dbContext.PowerData
            .OrderByDescending(p => p.Timestamp)
            .FirstOrDefaultAsync();
        
        return data?.ToModel();
    }

    public async Task<double> GetTotalPowerConsumptionAsync()
    {
        var latestData = await _dbContext.PowerData
            .OrderByDescending(p => p.Timestamp)
            .FirstOrDefaultAsync();
        
        return latestData?.AccumulatedKwh ?? 0;
    }

    public async Task<double> GetTotalCostAsync()
    {
        var totalKwh = await GetTotalPowerConsumptionAsync();
        return totalKwh * _powerConfig.ElectricityRate;
    }
}
