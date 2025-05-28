import React, { createContext, useContext, ReactNode } from 'react';
import { PowerData, Session, ComponentData } from '../types';
import { useHardwareMonitor } from '../hooks/useHardwareMonitor';

interface PowerDataContextType {
  currentPower: PowerData | null;
  powerHistory: PowerData[];
  sessions: Session[];
  components: ComponentData[];
  electricityRate: number;
  setElectricityRate: (rate: number) => void;
  sampleInterval: number;
  setSampleInterval: (interval: number) => void;
  isLoading: boolean;
  error: string | null;
  startSession: () => Promise<Session>;
  endSession: (sessionId: string) => Promise<Session>;
  fetchPowerHistory: (hours?: number) => Promise<PowerData[]>;
}

const PowerDataContext = createContext<PowerDataContextType | undefined>(undefined);

export const usePowerData = () => {
  const context = useContext(PowerDataContext);
  if (context === undefined) {
    throw new Error('usePowerData must be used within a PowerDataProvider');
  }
  return context;
};

interface PowerDataProviderProps {
  children: ReactNode;
}

export const PowerDataProvider: React.FC<PowerDataProviderProps> = ({ children }) => {
  // Use the real hardware monitoring hook instead of mock data
  const {
    powerData: currentPower,
    powerHistory,
    sessions,
    componentData: components,
    isLoading,
    error,
    startSession,
    endSession,
    fetchPowerHistory
  } = useHardwareMonitor();
  
  // Keep the settings state local to this context
  const [electricityRate, setElectricityRate] = React.useState<number>(1444.70);
  const [sampleInterval, setSampleInterval] = React.useState<number>(5);

  return (
    <PowerDataContext.Provider value={{
      currentPower,
      powerHistory,
      sessions,
      components,
      electricityRate,
      setElectricityRate,
      sampleInterval,
      setSampleInterval,
      isLoading,
      error,
      startSession,
      endSession,
      fetchPowerHistory
    }}>
      {children}
    </PowerDataContext.Provider>
  );
};