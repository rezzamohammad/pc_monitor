using Microsoft.EntityFrameworkCore;
using PCMonitor.API.Hubs;
using PCMonitor.Core.Data;
using PCMonitor.Core.Models;
using PCMonitor.Core.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Add SignalR
builder.Services.AddSignalR();

// Configure database
var dbPath = Path.Combine(builder.Environment.ContentRootPath, "pcmonitor.db");
builder.Services.AddDbContext<PCMonitorContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Configure power config
var powerConfig = new PowerConfig
{
    ElectricityRate = 1445.0, // Default electricity rate
    SampleIntervalSeconds = 5, // Sample every 5 seconds
    PowerModel = new PowerModel
    {
        BasePowerWatts = 45, // Base system power consumption
        CpuTdpWatts = 125,   // Default CPU TDP
        GpuTdpWatts = 150    // Default GPU TDP
    }
};
builder.Services.AddSingleton(powerConfig);

// Register services
builder.Services.AddSingleton<IHardwareMonitorService, HardwareMonitorService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IPowerDataService, PowerDataService>();
builder.Services.AddHostedService<HardwareMonitorBackgroundService>();
builder.Services.AddHostedService<PCMonitor.API.Services.SignalRBroadcastService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<PCMonitorContext>();
    dbContext.Database.EnsureCreated();
}

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapHub<HardwareMonitorHub>("/hardwaremonitorhub");

app.Run();
