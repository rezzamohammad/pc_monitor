using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public class HardwareMonitorBackgroundService : BackgroundService
{
    private readonly ILogger<HardwareMonitorBackgroundService> _logger;
    private readonly IHardwareMonitorService _hardwareMonitorService;
    private readonly IPowerDataService _powerDataService;
    private readonly ISessionService _sessionService;
    private readonly PowerConfig _powerConfig;
    private string _currentSessionId = string.Empty;

    public HardwareMonitorBackgroundService(
        ILogger<HardwareMonitorBackgroundService> logger,
        IHardwareMonitorService hardwareMonitorService,
        IPowerDataService powerDataService,
        ISessionService sessionService,
        PowerConfig powerConfig)
    {
        _logger = logger;
        _hardwareMonitorService = hardwareMonitorService;
        _powerDataService = powerDataService;
        _sessionService = sessionService;
        _powerConfig = powerConfig;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Hardware monitor background service starting");

        try
        {
            // Get or create a current session
            var currentSession = await _sessionService.GetCurrentSessionAsync();
            if (currentSession == null)
            {
                currentSession = await _sessionService.StartNewSessionAsync();
            }
            _currentSessionId = currentSession.Id;

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Get current hardware metrics
                    var powerData = _hardwareMonitorService.GetCurrentPowerData();
                    
                    // Make sure we're using the current session ID
                    powerData.SessionId = _currentSessionId;
                    
                    // Save to database
                    await _powerDataService.SavePowerDataAsync(powerData);
                    
                    // Wait for the next polling interval
                    await Task.Delay(TimeSpan.FromSeconds(_powerConfig.SampleIntervalSeconds), stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred while polling hardware metrics");
                    
                    // Wait a bit before retrying
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in hardware monitor background service");
            throw;
        }
        finally
        {
            // End the current session when the service stops
            if (!string.IsNullOrEmpty(_currentSessionId))
            {
                try
                {
                    await _sessionService.EndSessionAsync(_currentSessionId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error ending session when stopping service");
                }
            }
        }
    }
}
