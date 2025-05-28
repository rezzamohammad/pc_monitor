using Microsoft.AspNetCore.SignalR;
using PCMonitor.API.Hubs;
using PCMonitor.Core.Models;
using PCMonitor.Core.Services;

namespace PCMonitor.API.Services;

public class SignalRBroadcastService : BackgroundService
{
    private readonly ILogger<SignalRBroadcastService> _logger;
    private readonly IHardwareMonitorService _hardwareMonitorService;
    private readonly IHubContext<HardwareMonitorHub, IHardwareMonitorHubClient> _hubContext;
    private readonly PowerConfig _powerConfig;

    public SignalRBroadcastService(
        ILogger<SignalRBroadcastService> logger,
        IHardwareMonitorService hardwareMonitorService,
        IHubContext<HardwareMonitorHub, IHardwareMonitorHubClient> hubContext,
        PowerConfig powerConfig)
    {
        _logger = logger;
        _hardwareMonitorService = hardwareMonitorService;
        _hubContext = hubContext;
        _powerConfig = powerConfig;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("SignalR broadcast service starting");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Get current hardware metrics
                var powerData = _hardwareMonitorService.GetCurrentPowerData();
                var componentData = _hardwareMonitorService.GetComponentData();
                
                // Broadcast to all connected clients
                await _hubContext.Clients.All.ReceivePowerUpdate(powerData);
                await _hubContext.Clients.All.ReceiveComponentUpdate(componentData);
                
                // Wait for the next broadcast interval
                await Task.Delay(TimeSpan.FromSeconds(_powerConfig.SampleIntervalSeconds), stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while broadcasting hardware metrics");
                
                // Wait a bit before retrying
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }
}
