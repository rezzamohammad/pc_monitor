export interface PowerData {
  timestamp: string;
  power_watts: number;
  accumulated_kwh: number;
  session_id: string;
  components: {
    cpu_utilization: number;
    gpu_utilization: number;
    memory_utilization: number;
  };
}

export interface Session {
  id: string;
  start_time: string;
  end_time: string;
  total_kwh: number;
  total_cost: number;
}

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  model: string;
  tdp_watts: number | null;
  utilization: number | null;
  temperature: number | null;
  power_watts: number;
}

export interface PowerReportOptions {
  period: '6h' | '12h' | 'day' | 'week' | 'month' | 'all';
  format?: 'text' | 'csv' | 'json';
  includeGraph?: boolean;
}

export interface PowerConfig {
  electricity_rate: number;
  sample_interval_seconds: number;
  power_model: {
    base_power_watts: number;
    cpu_tdp_watts: number;
    gpu_tdp_watts: number;
  };
}