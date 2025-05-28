import { useState, useEffect, useCallback } from 'react';
import { PowerData, ComponentData, Session } from '../types';
import { hardwareMonitorApi } from '../api/hardwareMonitorApi';
import { signalRClient } from '../api/signalRClient';

interface HardwareMonitorState {
  powerData: PowerData | null;
  componentData: ComponentData[];
  powerHistory: PowerData[];
  currentSession: Session | null;
  sessions: Session[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useHardwareMonitor = () => {
  // State for all hardware monitoring data
  const [state, setState] = useState<HardwareMonitorState>({
    powerData: null,
    componentData: [],
    powerHistory: [],
    currentSession: null,
    sessions: [],
    isConnected: false,
    isLoading: true,
    error: null
  });

  // Initialize data and connection
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Load initial data from API
        const [
          currentPowerData,
          componentData,
          powerHistory,
          sessions
        ] = await Promise.all([
          hardwareMonitorApi.getCurrentPowerData(),
          hardwareMonitorApi.getComponentData(),
          hardwareMonitorApi.getPowerHistory(24),
          hardwareMonitorApi.getAllSessions()
        ]);
        
        // Try to get current session
        let currentSession = null;
        try {
          currentSession = await hardwareMonitorApi.getCurrentSession();
        } catch (error) {
          console.warn('No active session found');
        }
        
        // Update state with initial data
        setState(prev => ({
          ...prev,
          powerData: currentPowerData,
          componentData,
          powerHistory,
          currentSession,
          sessions,
          isLoading: false
        }));
        
        // Start SignalR connection for real-time updates
        await signalRClient.start();
        setState(prev => ({ ...prev, isConnected: true }));
        
        // Register real-time update handlers
        signalRClient.onPowerUpdate(handlePowerUpdate);
        signalRClient.onComponentUpdate(handleComponentUpdate);
        signalRClient.onSessionUpdate(handleSessionUpdate);
      } catch (error) {
        console.error('Error initializing hardware monitoring:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };
    
    initializeMonitoring();
    
    // Cleanup function
    return () => {
      signalRClient.offPowerUpdate(handlePowerUpdate);
      signalRClient.offComponentUpdate(handleComponentUpdate);
      signalRClient.offSessionUpdate(handleSessionUpdate);
      signalRClient.stop();
    };
  }, []);
  
  // Real-time update handlers
  const handlePowerUpdate = useCallback((data: PowerData) => {
    setState(prev => ({
      ...prev,
      powerData: data,
      powerHistory: [...prev.powerHistory, data].slice(-120) // Keep last 120 data points
    }));
  }, []);
  
  const handleComponentUpdate = useCallback((data: ComponentData[]) => {
    setState(prev => ({
      ...prev,
      componentData: data
    }));
  }, []);
  
  const handleSessionUpdate = useCallback((data: Session) => {
    setState(prev => {
      // Update current session if this is it
      const isCurrentSession = prev.currentSession?.id === data.id;
      
      // Update sessions list
      const updatedSessions = prev.sessions.map(s => 
        s.id === data.id ? data : s
      );
      
      // If this is a new session, add it to the list
      if (!updatedSessions.some(s => s.id === data.id)) {
        updatedSessions.unshift(data);
      }
      
      return {
        ...prev,
        currentSession: isCurrentSession ? data : prev.currentSession,
        sessions: updatedSessions
      };
    });
  }, []);
  
  // Session management functions
  const startSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const newSession = await hardwareMonitorApi.startSession();
      setState(prev => ({
        ...prev,
        currentSession: newSession,
        sessions: [newSession, ...prev.sessions],
        isLoading: false
      }));
      return newSession;
    } catch (error) {
      console.error('Error starting session:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to start session'
      }));
      throw error;
    }
  }, []);
  
  const endSession = useCallback(async (sessionId: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const endedSession = await hardwareMonitorApi.endSession(sessionId);
      setState(prev => {
        // Update sessions list
        const updatedSessions = prev.sessions.map(s => 
          s.id === sessionId ? endedSession : s
        );
        
        return {
          ...prev,
          currentSession: prev.currentSession?.id === sessionId ? null : prev.currentSession,
          sessions: updatedSessions,
          isLoading: false
        };
      });
      return endedSession;
    } catch (error) {
      console.error('Error ending session:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to end session'
      }));
      throw error;
    }
  }, []);
  
  // Fetch power history for a specific time period
  const fetchPowerHistory = useCallback(async (hours: number = 24) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const powerHistory = await hardwareMonitorApi.getPowerHistory(hours);
      setState(prev => ({
        ...prev,
        powerHistory,
        isLoading: false
      }));
      return powerHistory;
    } catch (error) {
      console.error('Error fetching power history:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch power history'
      }));
      throw error;
    }
  }, []);
  
  // Return the state and functions
  return {
    ...state,
    startSession,
    endSession,
    fetchPowerHistory,
  };
};
