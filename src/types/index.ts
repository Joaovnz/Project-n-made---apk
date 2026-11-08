export type ActiveTab = 'dashboard' | 'ai' | 'maps' | 'medical' | 'mesh' | 'tools' | 'depot';

export type TacticalTheme = 'dark' | 'amber' | 'green' | 'oled';

export type Language = 'pt' | 'en';

export interface SystemVitals {
  cpuUsage: number;
  ramUsagePercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  diskUsedGb: number;
  diskTotalGb: number;
  batteryPercent: number;
  isCharging: boolean;
  temperatureC: number;
  uptimeHours: number;
  isOffgrid: boolean;
  serverConnected: boolean;
  serverUrl: string;
}
