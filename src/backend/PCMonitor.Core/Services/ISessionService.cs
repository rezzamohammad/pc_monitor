using PCMonitor.Core.Models;

namespace PCMonitor.Core.Services;

public interface ISessionService
{
    Task<Session> StartNewSessionAsync();
    Task<Session> EndSessionAsync(string sessionId);
    Task<List<Session>> GetAllSessionsAsync();
    Task<Session?> GetSessionAsync(string sessionId);
    Task<Session?> GetCurrentSessionAsync();
}
