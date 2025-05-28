# PC Monitor Implementation To-Do List

## Backend Development

- [x] Create a C# .NET Core Web API project
- [x] Set up project references to OpenHardwareMonitorLib.dll
- [x] Implement hardware monitoring service
  - [x] CPU metrics collection
  - [x] GPU metrics collection
  - [x] Memory metrics collection
  - [x] Storage metrics collection
  - [x] Motherboard/System metrics collection
- [x] Create API endpoints for hardware data
- [x] Implement WebSocket/SignalR for real-time updates
- [x] Add data persistence layer (SQLite)
- [x] Implement session tracking

## Frontend Integration

- [x] Create API client for the backend service
- [x] Update data fetching logic to use real data
- [x] Implement WebSocket client for real-time updates
- [x] Update UI components to handle real data
- [x] Add configuration UI for hardware monitoring settings

## Testing & Optimization

- [ ] Test monitoring on different hardware configurations
- [ ] Optimize polling intervals for performance
- [ ] Add error handling and recovery mechanisms
- [ ] Implement power consumption calibration

## Deployment

- [ ] Package the application for distribution
- [ ] Create installation documentation
- [ ] Add system requirements documentation

## Progress Records

### 2025-05-28
- Created implementation plan using OpenHardwareMonitorLib.dll
- Created TODO list for tracking implementation progress
- Created C# .NET Core solution structure with PCMonitor.API and PCMonitor.Core projects
- Implemented data models matching the existing frontend TypeScript interfaces
- Developed HardwareMonitorService using OpenHardwareMonitorLib.dll for real hardware metrics
- Implemented database context and repositories for data persistence
- Created SessionService for tracking PC usage sessions
- Implemented API controllers for hardware metrics and session management
- Set up SignalR hub for real-time metrics broadcasting
- Created backend services for polling hardware metrics and broadcasting to connected clients
- Implemented TypeScript API client for the backend service
- Created SignalR client for real-time updates in the frontend
- Developed custom React hook (useHardwareMonitor) for frontend integration
- Created HardwareMonitorContext provider for application-wide state management
- Updated PowerDataContext to use real hardware data instead of mock data
- Enhanced Settings page with real-time feedback and updated UI
