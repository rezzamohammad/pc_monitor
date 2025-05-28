import { PowerData, Session, ComponentData } from '../types';

// Generate mock power data for the last 24 hours
export const mockPowerData: PowerData[] = Array.from({ length: 120 }, (_, i) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - (120 - i) * 5); // Every 5 minutes for the last 10 hours
  
  // Create a daily pattern with higher usage during day hours and lower at night
  const hourOfDay = date.getHours();
  const isActiveHours = hourOfDay >= 8 && hourOfDay <= 22;
  const basePower = isActiveHours ? 120 : 70;
  const randomVariation = isActiveHours ? 50 : 20;

  return {
    timestamp: date.toISOString(),
    power_watts: basePower + Math.random() * randomVariation,
    accumulated_kwh: 0.1 * i,
    session_id: "session-1",
    components: {
      cpu_utilization: isActiveHours ? 20 + Math.random() * 60 : 5 + Math.random() * 15,
      gpu_utilization: isActiveHours ? 10 + Math.random() * 50 : 2 + Math.random() * 8,
      memory_utilization: 50 + Math.random() * 30
    }
  };
});

// Update accumulated kWh to be properly incremental
mockPowerData.forEach((data, i) => {
  if (i > 0) {
    const prevKwh = mockPowerData[i-1].accumulated_kwh;
    const increment = (data.power_watts / 1000) * (5 / 60); // kW * hours (5 minutes)
    data.accumulated_kwh = prevKwh + increment;
  }
});

// Mock session data
export const mockSessions: Session[] = [
  {
    id: "session-1",
    start_time: new Date(new Date().getTime() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    end_time: new Date().toISOString(),
    total_kwh: 1.245,
    total_cost: 1799.65
  },
  {
    id: "session-2",
    start_time: new Date(new Date().getTime() - 34 * 60 * 60 * 1000).toISOString(), // 34 hours ago
    end_time: new Date(new Date().getTime() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
    total_kwh: 0.987,
    total_cost: 1425.92
  },
  {
    id: "session-3",
    start_time: new Date(new Date().getTime() - 58 * 60 * 60 * 1000).toISOString(), // 58 hours ago
    end_time: new Date(new Date().getTime() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago
    total_kwh: 1.543,
    total_cost: 2229.17
  }
];

// Mock component data
export const mockComponentData: ComponentData[] = [
  {
    id: "cpu",
    name: "CPU",
    type: "processor",
    model: "Intel Core i7-10700K",
    tdp_watts: 125,
    utilization: 35.2,
    temperature: 65.3,
    power_watts: 65.8
  },
  {
    id: "gpu",
    name: "GPU",
    type: "graphics",
    model: "NVIDIA GeForce RTX 3060",
    tdp_watts: 170,
    utilization: 28.7,
    temperature: 69.2,
    power_watts: 82.5
  },
  {
    id: "ram",
    name: "Memory",
    type: "memory",
    model: "32GB DDR4-3200",
    tdp_watts: 10,
    utilization: 62.4,
    temperature: null,
    power_watts: 8.2
  },
  {
    id: "mobo",
    name: "Motherboard",
    type: "motherboard",
    model: "ASUS ROG STRIX Z490-E",
    tdp_watts: 35,
    utilization: null,
    temperature: 48.7,
    power_watts: 22.5
  },
  {
    id: "ssd1",
    name: "SSD (NVMe)",
    type: "storage",
    model: "Samsung 970 EVO Plus 1TB",
    tdp_watts: 8,
    utilization: 15.8,
    temperature: 52.3,
    power_watts: 3.2
  },
  {
    id: "hdd1",
    name: "HDD",
    type: "storage",
    model: "Western Digital Blue 2TB",
    tdp_watts: 6,
    utilization: 5.3,
    temperature: 38.9,
    power_watts: 4.8
  },
  {
    id: "cooling",
    name: "CPU Cooler",
    type: "cooling",
    model: "Noctua NH-D15",
    tdp_watts: 3,
    utilization: null,
    temperature: null,
    power_watts: 2.5
  },
  {
    id: "psu",
    name: "Power Supply",
    type: "psu",
    model: "Corsair RM750x",
    tdp_watts: null,
    utilization: null,
    temperature: 45.6,
    power_watts: 15.2
  }
];