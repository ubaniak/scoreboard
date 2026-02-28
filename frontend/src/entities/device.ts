export type DeviceStatus = "unknown" | "offline" | "connected";

export type JudgeDevice = {
  role: string;
  code: string;
  status: DeviceStatus;
};
