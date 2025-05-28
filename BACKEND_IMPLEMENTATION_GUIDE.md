# PC Monitor Backend Implementation Guide

## Overview

This document provides detailed implementation instructions for the backend service that powers the PC Monitor application. The backend is responsible for collecting real-time hardware metrics using OpenHardwareMonitorLib.dll and exposing this data to the frontend via REST API endpoints and WebSocket connections for real-time updates.

## Technology Stack

- **Framework**: .NET 8.0 with ASP.NET Core
- **Hardware Monitoring**: OpenHardwareMonitorLib.dll
- **Database**: SQLite for local data storage
- **Real-time Communication**: SignalR
- **API**: RESTful endpoints with JSON responses

## Project Structure

The solution consists of two main projects:

1. **PCMonitor.Core**: Contains the core business logic, hardware monitoring, and data access
2. **PCMonitor.API**: Web API project that exposes the core functionality through HTTP endpoints and SignalR

## Getting Started

### Prerequisites

- Visual Studio 2022 or later (or Visual Studio Code with C# extensions)
- .NET SDK 8.0 or later
- Administrative privileges (required for hardware monitoring)

### Setup

1. Clone the repository
2. Open `src/backend/PCMonitorService.sln` in Visual Studio
3. Restore NuGet packages
4. Build the solution
5. Run the application (must be run with administrative privileges)

## Integration with OpenHardwareMonitorLib

The OpenHardwareMonitorLib.dll is referenced in the PCMonitor.Core project. This library allows us to access hardware sensors and collect metrics such as:

- CPU usage, temperature, and power consumption
- GPU usage, temperature, memory usage, and power consumption
- Memory usage
- Storage device information
- Motherboard sensors (temperatures, fan speeds)

### Key Components

#### HardwareMonitorService (Core Implementation)

The `HardwareMonitorService` class is responsible for initializing the OpenHardwareMonitor library and collecting metrics from the hardware. It implements the `IHardwareMonitorService` interface.

```csharp
public class HardwareMonitorService : IHardwareMonitorService
{
    private readonly Computer _computer;
    
    public HardwareMonitorService()
    {
        // Initialize OpenHardwareMonitor
        _computer = new Computer
        {
            CPUEnabled = true,
            GPUEnabled = true,
            RAMEnabled = true,
            MainboardEnabled = true,
            HDDEnabled = true,
            FanControllerEnabled = true
        };
        
        _computer.Open();
    }
    
    // Implementation of methods to collect hardware metrics
    // ...
    
    public void Dispose()
    {
        _computer?.Close();
    }
}
```

**Important Implementation Details:**

1. **Administrative Privileges**: OpenHardwareMonitor requires administrative privileges to access hardware sensors.
2. **Hardware Update**: Call `hardware.Update()` before reading sensor values to ensure data is current.
3. **Sensor Types**: Different hardware components expose different types of sensors (temperature, load, clock, power, etc.).
4. **Error Handling**: Some sensors may not be available on all hardware configurations.

#### Accessing Sensor Data

```csharp
// Example: Reading CPU temperature
private double? GetCpuTemperature()
{
    var cpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.CPU);
    if (cpuHardware == null)
        return null;
    
    cpuHardware.Update();
    
    var tempSensors = cpuHardware.Sensors.Where(s => s.SensorType == SensorType.Temperature && s.Name.Contains("CPU Package"));
    if (!tempSensors.Any())
        return null;
    
    return tempSensors.Average(s => s.Value);
}
```

### Common Sensors by Component Type

#### CPU
- **Utilization**: `SensorType.Load`, typically named "CPU Total"
- **Temperature**: `SensorType.Temperature`, typically named "CPU Package" or "Core #X"
- **Power**: `SensorType.Power`, typically named "CPU Package" or "CPU Cores"
- **Clock**: `SensorType.Clock`, typically named "CPU Core #X"

#### GPU
- **Utilization**: `SensorType.Load`, typically named "GPU Core"
- **Temperature**: `SensorType.Temperature`, typically named "GPU Core"
- **Memory Usage**: `SensorType.SmallData`, typically named "GPU Memory Used"
- **Power**: `SensorType.Power`, typically named "GPU Package"
- **Clock**: `SensorType.Clock`, typically named "GPU Core"

#### Memory
- **Used Memory**: `SensorType.Data`, typically named "Used Memory"
- **Available Memory**: `SensorType.Data`, typically named "Available Memory"
- **Memory Load**: `SensorType.Load`, typically named "Memory"

#### Storage
- **Temperature**: `SensorType.Temperature`
- **Used Space**: `SensorType.Load`

#### Motherboard
- **Temperature**: `SensorType.Temperature`
- **Fan Speed**: `SensorType.Fan`
- **Voltage**: `SensorType.Voltage`

## Data Persistence

We use SQLite for local storage of historical data and session information. The database context is defined in `PCMonitorContext.cs`.

### Entity Models

- **PowerDataEntity**: Stores power consumption data points
- **SessionEntity**: Stores session information (start/end times, total consumption, cost)

### Database Configuration

```csharp
// In Program.cs
var dbPath = Path.Combine(builder.Environment.ContentRootPath, "pcmonitor.db");
builder.Services.AddDbContext<PCMonitorContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));
```

## API Endpoints

The API provides the following endpoints:

### Power Data Endpoints

- **GET /api/powerdata/current**: Get current power data
- **GET /api/powerdata/components**: Get component-level data
- **GET /api/powerdata/history?hours={hours}**: Get power history for the specified time period
- **GET /api/powerdata/session/{sessionId}**: Get power data for a specific session
- **GET /api/powerdata/total**: Get total power consumption and cost

### Session Endpoints

- **GET /api/session**: Get all sessions
- **GET /api/session/current**: Get current active session
- **GET /api/session/{id}**: Get session by ID
- **POST /api/session/start**: Start a new session
- **POST /api/session/{id}/end**: End an active session

## Real-time Updates with SignalR

SignalR is used to provide real-time updates to connected clients. The `HardwareMonitorHub` in the API project handles WebSocket connections.

### Hub Methods

The hub defines an interface for the client to receive updates:

```csharp
public interface IHardwareMonitorHubClient
{
    Task ReceivePowerUpdate(PowerData powerData);
    Task ReceiveComponentUpdate(List<ComponentData> componentData);
    Task ReceiveSessionUpdate(Session session);
}
```

### Broadcasting Updates

The `SignalRBroadcastService` runs as a background service and periodically broadcasts hardware metrics to all connected clients:

```csharp
// In SignalRBroadcastService.cs
protected override async Task ExecuteAsync(CancellationToken stoppingToken)
{
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
            await Task.Delay(TimeSpan.FromSeconds(_powerConfig.SampleInterval), stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error broadcasting hardware metrics");
            await Task.Delay(5000, stoppingToken);
        }
    }
}
```

## Power Consumption Calculation

Power consumption is calculated using a combination of direct sensor readings and estimation based on component utilization.

### Direct Sensor Readings

For components with power sensors (modern CPUs and GPUs), we use the direct readings:

```csharp
private double GetCpuPower(double cpuUtilization)
{
    // Try to get direct power reading from CPU sensors
    var cpuHardware = _computer.Hardware.FirstOrDefault(h => h.HardwareType == HardwareType.CPU);
    if (cpuHardware != null)
    {
        var powerSensors = cpuHardware.Sensors.Where(s => s.SensorType == SensorType.Power && s.Name.Contains("Package"));
        if (powerSensors.Any())
        {
            return powerSensors.Average(s => s.Value ?? 0);
        }
    }
    
    // If no direct reading, estimate based on TDP and utilization
    return _powerConfig.PowerModel.CpuTdpWatts * (0.3 + (0.7 * cpuUtilization / 100));
}
```

### TDP-based Estimation

For components without power sensors, we use an estimation based on the Thermal Design Power (TDP) and the current utilization:

```csharp
// Example: Base estimation
double estimatedPower = tdpWatts * (minLoad + (maxLoad - minLoad) * utilization / 100);
```

Where:
- **tdpWatts**: The component's TDP in watts
- **minLoad**: The minimum power consumption as a fraction of TDP (e.g., 0.3 for 30%)
- **maxLoad**: The maximum power consumption as a fraction of TDP (e.g., 1.0 for 100%)
- **utilization**: The current utilization percentage

## Configuration

The application uses a `PowerConfig` model to store configuration settings:

```csharp
public class PowerConfig
{
    public double ElectricityRate { get; set; }
    public int SampleIntervalSeconds { get; set; }
    public PowerModel PowerModel { get; set; }
}

public class PowerModel
{
    public double BasePowerWatts { get; set; }
    public double CpuTdpWatts { get; set; }
    public double GpuTdpWatts { get; set; }
}
```

Default configuration is registered in `Program.cs`:

```csharp
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
```

## Background Services

The application runs two background services:

1. **HardwareMonitorBackgroundService**: Collects hardware metrics at regular intervals and stores them in the database
2. **SignalRBroadcastService**: Broadcasts real-time updates to connected clients

## Advanced Customization

### Supporting Additional Hardware

To add support for additional hardware components or sensors:

1. Ensure the hardware is supported by OpenHardwareMonitor
2. Modify the `GetComponentData()` method in `HardwareMonitorService.cs` to include the new component
3. Create a model for the component if needed
4. Add API endpoints and SignalR events for the new component

### Power Model Calibration

The default power model is based on typical hardware behavior. For more accurate results:

1. Use power meters to measure actual power consumption
2. Adjust the TDP values and power scaling factors based on measurements
3. Consider adding more sophisticated power models for specific hardware

## Troubleshooting

### Common Issues

1. **Access Denied**: Ensure the application runs with administrative privileges
2. **Missing Sensors**: Not all hardware exposes the same sensors, implement fallbacks
3. **Inaccurate Power Readings**: Calibrate the power model or use direct measurements
4. **High CPU Usage**: Adjust the sampling interval to reduce system load

### Debugging

1. Enable verbose logging in `appsettings.json`
2. Check log files for errors and warnings
3. Use debugging tools to inspect sensor readings
4. Verify database connections and data persistence

## Deployment

### Running as a Windows Service

To run the application as a Windows service:

1. Use the .NET Worker Service template
2. Register the service using the Windows Service Control Manager
3. Ensure the service runs with administrative privileges

### Installation

1. Build the application in Release mode
2. Copy the build output to the target machine
3. Install the application as a Windows service
4. Configure the service to start automatically

## Frontend Integration

The frontend communicates with the backend through:

1. **REST API**: For historical data and session management
2. **SignalR**: For real-time updates

Refer to the frontend documentation for details on the integration.

## Additional Resources

- [OpenHardwareMonitor Documentation](https://openhardwaremonitor.org/documentation/)
- [.NET Core Web API Documentation](https://docs.microsoft.com/en-us/aspnet/core/web-api)
- [SignalR Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr)
- [Entity Framework Core Documentation](https://docs.microsoft.com/en-us/ef/core)
