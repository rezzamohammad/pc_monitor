using Microsoft.EntityFrameworkCore;
using PCMonitor.Core.Models;

namespace PCMonitor.Core.Data;

public class PCMonitorContext : DbContext
{
    public PCMonitorContext(DbContextOptions<PCMonitorContext> options) : base(options)
    {
    }
    
    public DbSet<PowerDataEntity> PowerData { get; set; }
    public DbSet<SessionEntity> Sessions { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PowerDataEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Timestamp).IsRequired();
            entity.Property(e => e.PowerWatts).IsRequired();
            entity.Property(e => e.AccumulatedKwh).IsRequired();
            entity.Property(e => e.SessionId).IsRequired();
            entity.Property(e => e.CpuUtilization).IsRequired();
            entity.Property(e => e.GpuUtilization).IsRequired();
            entity.Property(e => e.MemoryUtilization).IsRequired();
        });
        
        modelBuilder.Entity<SessionEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StartTime).IsRequired();
            entity.Property(e => e.EndTime);
            entity.Property(e => e.TotalKwh).IsRequired();
            entity.Property(e => e.TotalCost).IsRequired();
        });
    }
}

// Entity classes for database
public class PowerDataEntity
{
    public int Id { get; set; }
    public string Timestamp { get; set; } = string.Empty;
    public double PowerWatts { get; set; }
    public double AccumulatedKwh { get; set; }
    public string SessionId { get; set; } = string.Empty;
    public double CpuUtilization { get; set; }
    public double GpuUtilization { get; set; }
    public double MemoryUtilization { get; set; }
    
    // Convert to model
    public PowerData ToModel()
    {
        return new PowerData
        {
            Timestamp = Timestamp,
            PowerWatts = PowerWatts,
            AccumulatedKwh = AccumulatedKwh,
            SessionId = SessionId,
            Components = new ComponentUtilization
            {
                CpuUtilization = CpuUtilization,
                GpuUtilization = GpuUtilization,
                MemoryUtilization = MemoryUtilization
            }
        };
    }
    
    // Create from model
    public static PowerDataEntity FromModel(PowerData model)
    {
        return new PowerDataEntity
        {
            Timestamp = model.Timestamp,
            PowerWatts = model.PowerWatts,
            AccumulatedKwh = model.AccumulatedKwh,
            SessionId = model.SessionId,
            CpuUtilization = model.Components.CpuUtilization,
            GpuUtilization = model.Components.GpuUtilization,
            MemoryUtilization = model.Components.MemoryUtilization
        };
    }
}

public class SessionEntity
{
    public string Id { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string? EndTime { get; set; }
    public double TotalKwh { get; set; }
    public double TotalCost { get; set; }
    
    // Convert to model
    public Session ToModel()
    {
        return new Session
        {
            Id = Id,
            StartTime = StartTime,
            EndTime = EndTime ?? string.Empty,
            TotalKwh = TotalKwh,
            TotalCost = TotalCost
        };
    }
    
    // Create from model
    public static SessionEntity FromModel(Session model)
    {
        return new SessionEntity
        {
            Id = model.Id,
            StartTime = model.StartTime,
            EndTime = model.EndTime,
            TotalKwh = model.TotalKwh,
            TotalCost = model.TotalCost
        };
    }
}
