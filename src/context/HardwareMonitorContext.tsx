import React, { createContext, useContext, ReactNode } from 'react';
import { useHardwareMonitor } from '../hooks/useHardwareMonitor';
import { PowerData, ComponentData, Session } from '../types';

// Define the context type
interface HardwareMonitorContextType {
  powerData: PowerData | null;
  componentData: ComponentData[];
  powerHistory: PowerData[];
  currentSession: Session | null;
  sessions: Session[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  startSession: () => Promise<Session>;
  endSession: (sessionId: string) => Promise<Session>;
  fetchPowerHistory: (hours?: number) => Promise<PowerData[]>;
}

// Create the context with default values
const HardwareMonitorContext = createContext<HardwareMonitorContextType | null>(null);

// Provider component
export const HardwareMonitorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const hardwareMonitor = useHardwareMonitor();

  return (
    <HardwareMonitorContext.Provider value={hardwareMonitor}>
      {children}
    </HardwareMonitorContext.Provider>
  );
};

// Custom hook to use the hardware monitor context
export const useHardwareMonitorContext = () => {
  const context = useContext(HardwareMonitorContext);
  if (!context) {
    throw new Error('useHardwareMonitorContext must be used within a HardwareMonitorProvider');
  }
  return context;
};
