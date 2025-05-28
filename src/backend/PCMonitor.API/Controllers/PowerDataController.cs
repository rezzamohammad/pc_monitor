using Microsoft.AspNetCore.Mvc;
using PCMonitor.Core.Models;
using PCMonitor.Core.Services;

namespace PCMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PowerDataController : ControllerBase
{
    private readonly IHardwareMonitorService _hardwareMonitorService;
    private readonly IPowerDataService _powerDataService;
    private readonly ILogger<PowerDataController> _logger;

    public PowerDataController(
        IHardwareMonitorService hardwareMonitorService,
        IPowerDataService powerDataService,
        ILogger<PowerDataController> logger)
    {
        _hardwareMonitorService = hardwareMonitorService;
        _powerDataService = powerDataService;
        _logger = logger;
    }

    [HttpGet("current")]
    public ActionResult<PowerData> GetCurrentPowerData()
    {
        try
        {
            var powerData = _hardwareMonitorService.GetCurrentPowerData();
            return Ok(powerData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current power data");
            return StatusCode(500, "Error retrieving current power data");
        }
    }

    [HttpGet("components")]
    public ActionResult<List<ComponentData>> GetComponentData()
    {
        try
        {
            var componentData = _hardwareMonitorService.GetComponentData();
            return Ok(componentData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting component data");
            return StatusCode(500, "Error retrieving component data");
        }
    }

    [HttpGet("history")]
    public async Task<ActionResult<List<PowerData>>> GetPowerHistory([FromQuery] int hours = 24)
    {
        try
        {
            var powerData = await _powerDataService.GetRecentPowerDataAsync(hours);
            return Ok(powerData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting power history data");
            return StatusCode(500, "Error retrieving power history data");
        }
    }

    [HttpGet("session/{sessionId}")]
    public async Task<ActionResult<List<PowerData>>> GetSessionPowerData(string sessionId)
    {
        try
        {
            var powerData = await _powerDataService.GetPowerDataBySessionAsync(sessionId);
            return Ok(powerData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting power data for session {SessionId}", sessionId);
            return StatusCode(500, $"Error retrieving power data for session {sessionId}");
        }
    }

    [HttpGet("total")]
    public async Task<ActionResult<object>> GetTotalConsumption()
    {
        try
        {
            var totalKwh = await _powerDataService.GetTotalPowerConsumptionAsync();
            var totalCost = await _powerDataService.GetTotalCostAsync();
            
            return Ok(new
            {
                TotalKwh = totalKwh,
                TotalCost = totalCost
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting total consumption data");
            return StatusCode(500, "Error retrieving total consumption data");
        }
    }
}
