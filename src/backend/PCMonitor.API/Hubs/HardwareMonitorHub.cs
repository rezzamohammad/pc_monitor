using Microsoft.AspNetCore.SignalR;
// using PCMonitor.Core.Models; // Removed as types are no longer referenced

namespace PCMonitor.API.Hubs;

public class HardwareMonitorHub : Hub<IHardwareMonitorHubClient>
{
    private readonly ILogger<HardwareMonitorHub> _logger;

    public HardwareMonitorHub(ILogger<HardwareMonitorHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}, Reason: {Exception}", 
            Context.ConnectionId, exception?.Message ?? "No reason provided");
        await base.OnDisconnectedAsync(exception);
    }
}
// Removed IHardwareMonitorHubClient interface definition
