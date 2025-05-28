# PC Monitor Application: Migration from Mock to Real Data using OpenHardwareMonitor

## Current State Analysis

The PC monitoring application currently uses mock data to display:
1. Power consumption metrics over time
2. Session tracking with electricity cost calculations
3. Component-level data (CPU, GPU, RAM, etc.) including:
   - Utilization percentages
   - Temperature readings
   - Power consumption estimates

## Implementation Plan

### 1. Backend Service Development

We will create a backend service that utilizes the OpenHardwareMonitorLib.dll to:
- Collect real-time system metrics from the PC hardware
- Process and format this data to match the frontend's expectations
- Expose an API for the frontend to consume

#### C# .NET Backend Service

We'll implement a .NET Core service that will:
- Reference the OpenHardwareMonitorLib.dll to gather detailed hardware metrics
- Create a REST API with ASP.NET Core
- Implement WebSockets for real-time updates
- Provide direct access to hardware sensors for more accurate data

### 2. Data Collection with OpenHardwareMonitor

The OpenHardwareMonitorLib provides access to the following metrics:

- **CPU**:
  - Utilization percentage (overall and per-core)
  - Temperature (per core and package)
  - Clock speed (current and maximum)
  - Power consumption (package/cores)
  - Model information
  - Voltage

- **GPU**:
  - Core/memory utilization
  - Temperature
  - Memory usage and controller information
  - Fan speed
  - Power consumption (if supported by the GPU)
  - Clock speeds (core, memory, shader)

- **Memory**:
  - Used/available memory
  - Utilization percentage
  - Virtual memory statistics

- **Storage**:
  - Disk utilization
  - Temperature (if supported by the drive)
  - Read/write activity
  - SMART attributes (when available)

- **Motherboard/System**:
  - Temperatures (chipset, VRM, etc.)
  - Fan speeds
  - Voltage readings

- **Power Supply**:
  - No direct metrics available, but can be estimated using component power data

### 3. Power Consumption Calculation

The OpenHardwareMonitor library provides direct power measurements for many modern CPUs and GPUs. For our implementation:
- Use direct power readings from sensors when available
- For components without power sensors, implement estimation models:
  - TDP-based calculations adjusted by utilization percentages
  - Power curve models based on component specifications
- Provide calibration options for users to improve accuracy

### 4. Frontend Integration

- Update data fetching logic to use the new OpenHardwareMonitor-based API
- Implement WebSocket connections for real-time updates
- Add configuration UI for power rate settings and hardware monitoring preferences
- Add calibration options for power estimates

### 5. Architecture Implementation

1. **C# .NET Service**:
   - Create a .NET Core Web API project
   - Reference the OpenHardwareMonitorLib.dll
   - Implement controller endpoints for hardware metrics
   - Set up SignalR for real-time updates

2. **Data Collection Service**:
   - Implement a background service to poll hardware metrics
   - Create hardware monitoring classes using OpenHardwareMonitor
   - Store historical data in a local database (SQLite)

3. **Frontend Communication**:
   - Expose REST endpoints for historical data
   - Implement WebSocket connections for real-time updates
   - Provide configuration endpoints

### 6. Deployment Considerations

- Package the .NET service as a Windows service or standalone executable
- Ensure the service runs with administrative privileges (required for hardware access)
- Include the OpenHardwareMonitorLib.dll with the distribution
- Provide documentation for installation and configuration
