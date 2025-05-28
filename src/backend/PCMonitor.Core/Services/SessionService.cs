using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PCMonitor.Core.Data;
using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public class SessionService : ISessionService
{
    private readonly PCMonitorContext _dbContext;
    private readonly ILogger<SessionService> _logger;
    private readonly PowerConfig _powerConfig;

    public SessionService(PCMonitorContext dbContext, ILogger<SessionService> logger, PowerConfig powerConfig)
    {
        _dbContext = dbContext;
        _logger = logger;
        _powerConfig = powerConfig;
    }

    public async Task<Session> StartNewSessionAsync()
    {
        var sessionId = Guid.NewGuid().ToString();
        var startTime = DateTime.UtcNow.ToString("o");

        var session = new SessionEntity
        {
            Id = sessionId,
            StartTime = startTime,
            EndTime = null,
            TotalKwh = 0,
            TotalCost = 0
        };

        await _dbContext.Sessions.AddAsync(session);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Started new session with ID: {SessionId}", sessionId);
        return session.ToModel();
    }

    public async Task<Session> EndSessionAsync(string sessionId)
    {
        var session = await _dbContext.Sessions.FindAsync(sessionId);
        if (session == null)
        {
            _logger.LogWarning("Attempted to end non-existent session: {SessionId}", sessionId);
            throw new ArgumentException($"Session with ID {sessionId} not found");
        }

        if (session.EndTime != null)
        {
            _logger.LogWarning("Attempted to end already ended session: {SessionId}", sessionId);
            return session.ToModel();
        }

        // Get power data for this session
        var powerData = await _dbContext.PowerData
            .Where(p => p.SessionId == sessionId)
            .OrderByDescending(p => p.Timestamp)
            .FirstOrDefaultAsync();

        // Update session with end time and accumulated kWh
        session.EndTime = DateTime.UtcNow.ToString("o");
        
        if (powerData != null)
        {
            session.TotalKwh = powerData.AccumulatedKwh;
            session.TotalCost = powerData.AccumulatedKwh * _powerConfig.ElectricityRate;
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Ended session with ID: {SessionId}, Total kWh: {TotalKwh}, Total Cost: {TotalCost}", 
            sessionId, session.TotalKwh, session.TotalCost);
        
        return session.ToModel();
    }

    public async Task<List<Session>> GetAllSessionsAsync()
    {
        var sessions = await _dbContext.Sessions
            .OrderByDescending(s => s.StartTime)
            .ToListAsync();

        return sessions.Select(s => s.ToModel()).ToList();
    }

    public async Task<Session?> GetSessionAsync(string sessionId)
    {
        var session = await _dbContext.Sessions.FindAsync(sessionId);
        return session?.ToModel();
    }

    public async Task<Session?> GetCurrentSessionAsync()
    {
        var session = await _dbContext.Sessions
            .Where(s => s.EndTime == null)
            .OrderByDescending(s => s.StartTime)
            .FirstOrDefaultAsync();

        return session?.ToModel();
    }
}
