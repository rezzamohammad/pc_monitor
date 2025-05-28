import { PowerData, Session, ComponentData } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * API client for interacting with the hardware monitoring backend service
 */
export const hardwareMonitorApi = {
  /**
   * Get current power data and metrics
   */
  getCurrentPowerData: async (): Promise<PowerData> => {
    const response = await fetch(`${API_BASE_URL}/powerdata/current`);
    if (!response.ok) {
      throw new Error(`Failed to fetch current power data: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Get component-level data (CPU, GPU, RAM, etc.)
   */
  getComponentData: async (): Promise<ComponentData[]> => {
    const response = await fetch(`${API_BASE_URL}/powerdata/components`);
    if (!response.ok) {
      throw new Error(`Failed to fetch component data: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Get power data history for the specified time period
   */
  getPowerHistory: async (hours: number = 24): Promise<PowerData[]> => {
    const response = await fetch(`${API_BASE_URL}/powerdata/history?hours=${hours}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch power history: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Get total power consumption and cost
   */
  getTotalConsumption: async (): Promise<{totalKwh: number, totalCost: number}> => {
    const response = await fetch(`${API_BASE_URL}/powerdata/total`);
    if (!response.ok) {
      throw new Error(`Failed to fetch total consumption: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Get all sessions
   */
  getAllSessions: async (): Promise<Session[]> => {
    const response = await fetch(`${API_BASE_URL}/session`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sessions: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Get current active session
   */
  getCurrentSession: async (): Promise<Session> => {
    const response = await fetch(`${API_BASE_URL}/session/current`);
    if (!response.ok) {
      throw new Error(`Failed to fetch current session: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Get session by ID
   */
  getSession: async (sessionId: string): Promise<Session> => {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch session ${sessionId}: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * Start a new monitoring session
   */
  startSession: async (): Promise<Session> => {
    const response = await fetch(`${API_BASE_URL}/session/start`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to start session: ${response.statusText}`);
    }
    return response.json();
  },
  
  /**
   * End an active monitoring session
   */
  endSession: async (sessionId: string): Promise<Session> => {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/end`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Failed to end session ${sessionId}: ${response.statusText}`);
    }
    return response.json();
  },
};
