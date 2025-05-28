using Microsoft.AspNetCore.Mvc;
using PCMonitor.Core.Models;
using PCMonitor.Core.Services;

namespace PCMonitor.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionController : ControllerBase
{
    private readonly ISessionService _sessionService;
    private readonly ILogger<SessionController> _logger;

    public SessionController(ISessionService sessionService, ILogger<SessionController> logger)
    {
        _sessionService = sessionService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<Session>>> GetAllSessions()
    {
        try
        {
            var sessions = await _sessionService.GetAllSessionsAsync();
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all sessions");
            return StatusCode(500, "Error retrieving session data");
        }
    }

    [HttpGet("current")]
    public async Task<ActionResult<Session>> GetCurrentSession()
    {
        try
        {
            var session = await _sessionService.GetCurrentSessionAsync();
            if (session == null)
            {
                return NotFound("No active session found");
            }
            
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting current session");
            return StatusCode(500, "Error retrieving current session");
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Session>> GetSession(string id)
    {
        try
        {
            var session = await _sessionService.GetSessionAsync(id);
            if (session == null)
            {
                return NotFound($"Session with ID {id} not found");
            }
            
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session {SessionId}", id);
            return StatusCode(500, $"Error retrieving session {id}");
        }
    }

    [HttpPost("start")]
    public async Task<ActionResult<Session>> StartSession()
    {
        try
        {
            // Check if there's already an active session
            var currentSession = await _sessionService.GetCurrentSessionAsync();
            if (currentSession != null)
            {
                return BadRequest($"Active session already exists with ID {currentSession.Id}");
            }
            
            var session = await _sessionService.StartNewSessionAsync();
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting new session");
            return StatusCode(500, "Error starting new session");
        }
    }

    [HttpPost("{id}/end")]
    public async Task<ActionResult<Session>> EndSession(string id)
    {
        try
        {
            var session = await _sessionService.GetSessionAsync(id);
            if (session == null)
            {
                return NotFound($"Session with ID {id} not found");
            }
            
            if (!string.IsNullOrEmpty(session.EndTime))
            {
                return BadRequest($"Session with ID {id} is already ended");
            }
            
            var endedSession = await _sessionService.EndSessionAsync(id);
            return Ok(endedSession);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending session {SessionId}", id);
            return StatusCode(500, $"Error ending session {id}");
        }
    }
}
