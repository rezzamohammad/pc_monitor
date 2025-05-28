import * as signalR from '@microsoft/signalr';
import { PowerData, ComponentData, Session } from '../types';

const SIGNALR_URL = 'http://localhost:5000/hardwaremonitorhub';

/**
 * SignalR client for real-time hardware monitoring updates
 */
class HardwareMonitorSignalRClient {
  private hubConnection: signalR.HubConnection | null = null;
  private powerUpdateCallbacks: ((data: PowerData) => void)[] = [];
  private componentUpdateCallbacks: ((data: ComponentData[]) => void)[] = [];
  private sessionUpdateCallbacks: ((data: Session) => void)[] = [];
  
  /**
   * Start the SignalR connection
   */
  public async start(): Promise<void> {
    try {
      // Create hub connection
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_URL)
        .withAutomaticReconnect()
        .build();
      
      // Set up event handlers
      this.hubConnection.on('ReceivePowerUpdate', (data: PowerData) => {
        this.powerUpdateCallbacks.forEach(callback => callback(data));
      });
      
      this.hubConnection.on('ReceiveComponentUpdate', (data: ComponentData[]) => {
        this.componentUpdateCallbacks.forEach(callback => callback(data));
      });
      
      this.hubConnection.on('ReceiveSessionUpdate', (data: Session) => {
        this.sessionUpdateCallbacks.forEach(callback => callback(data));
      });
      
      // Start the connection
      await this.hubConnection.start();
      console.log('SignalR connected.');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      throw error;
    }
  }
  
  /**
   * Stop the SignalR connection
   */
  public async stop(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      console.log('SignalR disconnected.');
    }
  }
  
  /**
   * Register a callback for power data updates
   */
  public onPowerUpdate(callback: (data: PowerData) => void): void {
    this.powerUpdateCallbacks.push(callback);
  }
  
  /**
   * Register a callback for component data updates
   */
  public onComponentUpdate(callback: (data: ComponentData[]) => void): void {
    this.componentUpdateCallbacks.push(callback);
  }
  
  /**
   * Register a callback for session updates
   */
  public onSessionUpdate(callback: (data: Session) => void): void {
    this.sessionUpdateCallbacks.push(callback);
  }
  
  /**
   * Remove a power update callback
   */
  public offPowerUpdate(callback: (data: PowerData) => void): void {
    this.powerUpdateCallbacks = this.powerUpdateCallbacks.filter(cb => cb !== callback);
  }
  
  /**
   * Remove a component update callback
   */
  public offComponentUpdate(callback: (data: ComponentData[]) => void): void {
    this.componentUpdateCallbacks = this.componentUpdateCallbacks.filter(cb => cb !== callback);
  }
  
  /**
   * Remove a session update callback
   */
  public offSessionUpdate(callback: (data: Session) => void): void {
    this.sessionUpdateCallbacks = this.sessionUpdateCallbacks.filter(cb => cb !== callback);
  }
}

// Create singleton instance
export const signalRClient = new HardwareMonitorSignalRClient();
